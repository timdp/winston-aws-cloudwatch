'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/Queue')

import defaults from 'defaults'

class Queue {
  constructor (worker, options) {
    debug('constructor', {worker, options})
    this._worker = worker
    this._options = defaults(options, {
      flushInterval: 2000,
      errorDelay: 1000,
      batchSize: 20
    })
    this._items = []
    this._flushing = null
    this._lastFlushStarted = 0
  }
  push (item) {
    debug('push', {item})
    this._items.push(item)
    this._delayedFlush()
  }
  _delayedFlush () {
    if (this._flushing) {
      debug('delayedFlush: already flushing')
      return
    }
    const remainingTime = this._computeRemainingTime()
    debug('delayedFlush: next flush in ' + remainingTime + ' ms')
    this._flushing = Queue._delay(remainingTime)
      .then(() => this._flush())
      .then(() => this._flushing = null)
  }
  _flush () {
    if (this._items.length === 0) {
      debug('flush: queue empty')
      return Promise.resolve()
    }
    this._lastFlushStarted = new Date().getTime()
    const batch = this._items.slice(0, this._options.batchSize)
    debug('flush: flushing ' + batch.length)
    return this._worker.process(batch)
      .then(() => this._onProcessed(), err => this._onError(err))
  }
  _onProcessed () {
    debug('onProcessed')
    this._items.splice(0, this._options.batchSize)
    return this._flush()
  }
  _onError (err) {
    debug('onError', {error: err})
    console.warn('Error: %s', err)
    return Queue._delay(this._options.errorDelay)
      .then(() => this._flush())
  }
  _computeRemainingTime () {
    const nextFlush = this._lastFlushStarted + this._options.flushInterval
    const now = new Date().getTime()
    return Math.max(0, Math.min(this._options.flushInterval, nextFlush - now))
  }
  static _delay (time) {
    return new Promise(resolve => setTimeout(resolve, time))
  }
}

export default Queue
