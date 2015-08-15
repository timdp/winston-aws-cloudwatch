'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/CloudWatchClient')

import AWS from 'aws-sdk'
import Promise from 'bluebird'
import defaults from 'defaults'
import {find, isEmpty} from 'lodash'

export default class CloudWatchClient {
  constructor (logGroupName, logStreamName, options) {
    debug('constructor', {logGroupName, logStreamName, options})
    this._logGroupName = logGroupName
    this._logStreamName = logStreamName
    this._options = defaults(options, {
      awsConfig: null,
      maxSequenceTokenAge: -1
    })
    this._sequenceTokenInfo = null
    const client = new AWS.CloudWatchLogs(this._options.awsConfig)
    this._client = Promise.promisifyAll(client)
  }
  submit (batch) {
    debug('submit', {batch})
    return this._getSequenceToken()
      .then(sequenceToken => this._putLogEvents(batch, sequenceToken))
      .then(({nextSequenceToken}) => this._storeSequenceToken(nextSequenceToken))
  }
  _putLogEvents (batch, sequenceToken) {
    debug('putLogEvents', {batch, sequenceToken})
    const params = {
      logGroupName: this._logGroupName,
      logStreamName: this._logStreamName,
      logEvents: batch.map(CloudWatchClient._toCloudWatchEvent),
      sequenceToken
    }
    return this._client.putLogEventsAsync(params)
  }
  _getSequenceToken () {
    const now = +new Date()
    const isStale = (!this._sequenceTokenInfo ||
      this._sequenceTokenInfo.date + this._options.maxSequenceTokenAge < now)
    return isStale ? this._fetchAndStoreSequenceToken() :
      Promise.resolve(this._sequenceTokenInfo.sequenceToken)
  }
  _fetchAndStoreSequenceToken () {
    debug('fetchSequenceToken')
    return this._findLogStream()
      .then(({uploadSequenceToken}) => uploadSequenceToken)
      .then(sequenceToken => this._storeSequenceToken(sequenceToken))
  }
  _storeSequenceToken (sequenceToken) {
    debug('storeSequenceToken', {sequenceToken})
    const date = +new Date()
    this._sequenceTokenInfo = {sequenceToken, date}
    return sequenceToken
  }
  _findLogStream (nextToken) {
    debug('findLogStream', {nextToken})
    const params = {
      logGroupName: this._logGroupName,
      logStreamNamePrefix: this._logStreamName,
      nextToken
    }
    return this._client.describeLogStreamsAsync(params)
      .then(({logStreams, nextToken}) => {
        const match = find(logStreams,
          ({logStreamName}) => (logStreamName === this._logStreamName))
        return match || this._findLogStream(nextToken)
      })
  }
  static _toCloudWatchEvent (item) {
    return {
      message: CloudWatchClient._toCloudWatchMessage(item),
      timestamp: item.date
    }
  }
  static _toCloudWatchMessage (item) {
    const meta = isEmpty(item.meta) ? '' :
      ' ' + JSON.stringify(item.meta, null, 2)
    return `[${item.level.toUpperCase()}] ${item.message}${meta}`
  }
}
