'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/Relay')

import defaults from 'defaults'
import {delay} from './util'

export default class Relay {
  constructor (client, options) {
    debug('constructor', {client, options})
    this._client = client
    this._options = defaults(options, {
      submissionInterval: 2000,
      errorDelay: 1000,
      batchSize: 20
    })
  }
  start (queue) {
    debug('start', {queue})
    if (this._queue) {
      throw new Error('Already started')
    }
    this._queue = queue
    this._submitting = null
    this._lastSubmitted = -1
    this._queue.on('push', () => this._onQueuePush())
  }
  _onQueuePush () {
    if (this._submitting) {
      debug('onQueuePush: submission already in progress')
      return
    }
    const remainingTime = this._computeRemainingTime()
    debug('onQueuePush: submitting in ' + remainingTime + ' ms')
    this._submitting = delay(remainingTime)
      .then(() => this._submit())
      .then(() => this._submitting = null)
  }
  _submit () {
    if (this._queue.size === 0) {
      debug('submit: queue empty')
      return Promise.resolve()
    }
    this._lastSubmitted = +new Date()
    const batch = this._queue.head(this._options.batchSize)
    this._queue.lock()
    debug(`submit: submitting ${batch.length} item(s)`)
    return this._client.submit(batch)
      .then(() => this._onSubmitted(batch.length), err => this._onError(err))
      .catch(err => {
        console.error('Unexpected error: %s', err)
        throw err
      })
  }
  _onSubmitted (num) {
    debug('onSubmitted', {num})
    this._queue.unlock()
    this._queue.remove(num)
    return this._submit()
  }
  _onError (err) {
    debug('onError', {error: err})
    console.warn('Error: %s', err.stack || err)
    return delay(this._options.errorDelay)
      .then(() => this._submit())
  }
  _computeRemainingTime () {
    const interval = this._options.submissionInterval
    return (this._lastSubmitted < 0) ? interval :
      Math.max(0, this._lastSubmitted + interval - new Date())
  }
}
