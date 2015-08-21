'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch:Relay')

import Bottleneck from 'bottleneck'
import defaults from 'defaults'
import Queue from './Queue'
import {EventEmitter} from 'events'

export default class Relay extends EventEmitter {
  constructor (client, options) {
    super()
    debug('constructor', {client, options})
    this._client = client
    this._options = defaults(options, {
      submissionInterval: 2000,
      batchSize: 20
    })
    this._limiter = null
    this._queue = null
  }
  start () {
    debug('start')
    if (this._queue) {
      throw new Error('Already started')
    }
    this._limiter = new Bottleneck(1, this._options.submissionInterval, 1)
    this._queue = new Queue()
    this._queue.on('push', () => this._scheduleSubmission())
    // Initial call to postpone first submission
    this._scheduleSubmission()
    return this._queue
  }
  _scheduleSubmission () {
    debug('scheduleSubmission')
    this._limiter.schedule(() => this._submit())
  }
  _submit () {
    if (this._queue.size === 0) {
      debug('submit: queue empty')
      return Promise.resolve()
    }
    const batch = this._queue.head(this._options.batchSize)
    const num = batch.length
    debug(`submit: submitting ${num} item(s)`)
    return this._client.submit(batch)
      .then(() => this._onSubmitted(num), err => this._onError(err))
      .then(() => this._scheduleSubmission())
  }
  _onSubmitted (num) {
    debug('onSubmitted', {num})
    this._queue.remove(num)
  }
  _onError (err) {
    debug('onError', {error: err})
    this.emit('error', err)
  }
}
