'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/Worker')

import defaults from 'defaults'
import AWS from 'aws-sdk'
import {ninvoke} from 'q'

class Worker {
  constructor (logGroupName, logStreamName, options) {
    debug('constructor', {logGroupName, logStreamName, options})
    this._logGroupName = logGroupName
    this._logStreamName = logStreamName
    this._options = defaults(options, {awsConfig: null})
    this._sequenceToken = null
    this._client = new AWS.CloudWatchLogs(this._options.awsConfig)
  }
  process (batch) {
    debug('process', {batch})
    const params = {
      logGroupName: this._logGroupName,
      logStreamName: this._logStreamName,
      logEvents: batch.map(msg => msg.toCloudWatchEvent()),
      sequenceToken: this._sequenceToken
    }
    return ninvoke(this._client, 'putLogEvents', params)
      .then(({nextSequenceToken}) => {
        debug('nextSequenceToken: ' + nextSequenceToken)
        this._sequenceToken = nextSequenceToken
      })
  }
}

export default Worker
