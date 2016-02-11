'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch:CloudWatchClient')

import AWS from 'aws-sdk'
import Promise from 'bluebird'
import defaults from 'defaults'
import find from 'lodash.find'
import CloudWatchEventFormatter from './cloudwatch-event-formatter'

export default class CloudWatchClient {
  constructor (logGroupName, logStreamName, options) {
    debug('constructor', {logGroupName, logStreamName, options})
    this._logGroupName = logGroupName
    this._logStreamName = logStreamName
    this._options = defaults(options, {
      awsConfig: null,
      maxSequenceTokenAge: -1,
      formatLogItem: CloudWatchEventFormatter.formatLogItem,
      createLogGroup: false,
      createLogStream: false
    })
    this._sequenceTokenInfo = null
    const client = new AWS.CloudWatchLogs(this._options.awsConfig)
    this._client = Promise.promisifyAll(client)
    this._initializing = null
  }

  submit (batch) {
    debug('submit', {batch})
    return this._initialize()
      .then(() => this._getSequenceToken())
      .then(sequenceToken => this._putLogEvents(batch, sequenceToken))
      .then(({nextSequenceToken}) => this._storeSequenceToken(nextSequenceToken))
  }

  _initialize () {
    if (this._initializing == null) {
      this._initializing = this._maybeCreateLogGroup()
        .then(() => this._maybeCreateLogStream())
    }
    return this._initializing
  }

  _maybeCreateLogGroup () {
    if (!this._options.createLogGroup) {
      return Promise.resolve()
    }
    const params = {
      logGroupName: this._logGroupName
    }
    return this._client.createLogGroupAsync(params)
      .catch(err => this._allowResourceAlreadyExistsException(err))
  }

  _maybeCreateLogStream () {
    if (!this._options.createLogStream) {
      return Promise.resolve()
    }
    const params = {
      logGroupName: this._logGroupName,
      logStreamName: this._logStreamName
    }
    return this._client.createLogStreamAsync(params)
      .catch(err => this._allowResourceAlreadyExistsException(err))
  }

  _allowResourceAlreadyExistsException (err) {
    if (err.code !== 'ResourceAlreadyExistsException') {
      throw err
    }
  }

  _putLogEvents (batch, sequenceToken) {
    debug('putLogEvents', {batch, sequenceToken})
    const params = {
      logGroupName: this._logGroupName,
      logStreamName: this._logStreamName,
      logEvents: batch.map(this._options.formatLogItem),
      sequenceToken
    }
    return this._client.putLogEventsAsync(params)
  }

  _getSequenceToken () {
    const now = +new Date()
    const isStale = (!this._sequenceTokenInfo ||
      this._sequenceTokenInfo.date + this._options.maxSequenceTokenAge < now)
    return isStale ? this._fetchAndStoreSequenceToken()
      : Promise.resolve(this._sequenceTokenInfo.sequenceToken)
  }

  _fetchAndStoreSequenceToken () {
    debug('fetchSequenceToken')
    return this._findLogStream()
      .then(({uploadSequenceToken}) => this._storeSequenceToken(uploadSequenceToken))
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
        if (match) {
          return match
        }
        if (nextToken == null) {
          throw new Error('Log stream not found')
        }
        return this._findLogStream(nextToken)
      })
  }
}
