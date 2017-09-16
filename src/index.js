'use strict'

import {Transport} from 'winston'
import CloudWatchClient from './cloudwatch-client'
import LogItem from './log-item'
import Relay from './relay'

class CloudWatchTransport extends Transport {
  constructor (options) {
    super(options)
    const client = new CloudWatchClient(options.logGroupName,
      options.logStreamName, options)
    this._relay = new Relay(client, options)
    this._relay.on('error', (err) => this.emit('error', err))
    this._relay.start()
  }

  log (level, msg, meta, callback) {
    this._relay.submit(new LogItem(+new Date(), level, msg, meta, callback))
  }
}

export default CloudWatchTransport
