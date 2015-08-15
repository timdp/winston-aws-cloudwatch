'use strict'

import {Transport} from 'winston'
import CloudWatchClient from './lib/CloudWatchClient'
import LogItem from './lib/LogItem'
import Relay from './lib/Relay'
import Queue from './lib/Queue'

class CloudWatchTransport extends Transport {
  constructor ({logGroupName, logStreamName, awsConfig}) {
    super()
    this._queue = new Queue()
    const client = new CloudWatchClient(logGroupName, logStreamName, {awsConfig})
    const relay = new Relay(client)
    relay.start(this._queue)
  }
  log (level, msg, meta, callback) {
    this._queue.push(new LogItem(+new Date(), level, msg, meta))
    callback(null, true)
  }
}

export default CloudWatchTransport
