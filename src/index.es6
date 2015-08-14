'use strict'

import {Transport} from 'winston'
import Message from './lib/Message'
import Queue from './lib/Queue'
import Worker from './lib/Worker'

class CloudWatchTransport extends Transport {
  constructor (options) {
    super()
    this._worker = new Worker(options.logGroupName, options.logStreamName, {
      awsConfig: options.awsConfig
    })
    this._queue = new Queue(this._worker)
  }
  log (level, msg, meta, callback) {
    this._queue.push(new Message(+new Date(), level, msg, meta))
    callback(null, true)
  }
}

export default CloudWatchTransport
