'use strict'

import {Transport} from 'winston'
import CloudWatchClient from './lib/cloudwatch-client'
import LogItem from './lib/log-item'
import Relay from './lib/relay'

class CloudWatchTransport extends Transport {
  constructor ({logGroupName, logStreamName, awsConfig}) {
    super()
    const client = new CloudWatchClient(logGroupName, logStreamName, {awsConfig})
    const relay = new Relay(client)
    relay.on('error', err => console.error('CloudWatch error: %s', err))
    this._queue = relay.start()
  }

  log (level, msg, meta, callback) {
    this._queue.push(new LogItem(+new Date(), level, msg, meta))
    callback(null, true)
  }
}

export default CloudWatchTransport
