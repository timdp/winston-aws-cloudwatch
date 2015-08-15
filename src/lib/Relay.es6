'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/Relay')

import Promise from 'bluebird'
import Bottleneck from 'bottleneck'
import defaults from 'defaults'
import {EventEmitter} from 'events'

export default class Relay extends EventEmitter {
  constructor (client, options) {
    super()
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
    this._limiter = new Bottleneck(1, this._options.submissionInterval, 1)
    // Initial call to postpone first submission
    this._scheduleSubmission()
    this._queue.on('push', () => this._scheduleSubmission())
  }
  _scheduleSubmission () {
    this._limiter.schedule(() => this._submit())
  }
  _submit () {
    if (this._queue.size === 0) {
      debug('submit: queue empty')
      return Promise.resolve()
    }
    const batch = this._queue.head(this._options.batchSize)
    this._queue.lock()
    debug(`submit: submitting ${batch.length} item(s)`)
    return this._client.submit(batch)
      .then(() => this._onSubmitted(batch.length), err => this._onError(err))
      .then(() => this._scheduleSubmission())
  }
  _onSubmitted (num) {
    debug('onSubmitted', {num})
    this._queue.unlock()
    this._queue.remove(num)
  }
  _onError (err) {
    debug('onError', {error: err})
    this.emit('error', err)
    return Promise.delay(this._options.errorDelay)
      .then(() => this._queue.unlock())
  }
}
