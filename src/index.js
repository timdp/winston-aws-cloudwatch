'use strict'

import {Transport} from 'winston'
import CloudWatchClient from './lib/cloudwatch-client'
import LogItem from './lib/log-item'
import Relay from './lib/relay'

class CloudWatchTransport extends Transport {
  constructor ({logGroupName, logStreamName, createLogGroup, createLogStream,
      awsConfig, formatLogItem}) {
    super()
    const client = new CloudWatchClient(logGroupName, logStreamName,
      {createLogGroup, createLogStream, awsConfig, formatLogItem})
    this._relay = new Relay(client)
    this._relay.on('error', (err) => this.emit('error', err))
    this._relay.start()
  }

  log (level, msg, meta, callback) {
    this._relay.submit(new LogItem(+new Date(), level, msg, meta))
    callback(null, true)
  }
}

export default CloudWatchTransport
