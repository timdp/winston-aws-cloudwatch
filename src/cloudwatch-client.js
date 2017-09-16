'use strict'

import _debug from 'debug'
import AWS from 'aws-sdk'
import defaults from 'defaults'
import find from 'lodash.find'
import CloudWatchEventFormatter from './cloudwatch-event-formatter'

const debug = _debug('winston-aws-cloudwatch:CloudWatchClient')

export default class CloudWatchClient {
  constructor (logGroupName, logStreamName, options) {
    debug('constructor', {logGroupName, logStreamName, options})
    this._logGroupName = logGroupName
    this._logStreamName = logStreamName
    this._options = defaults(options, {
      awsConfig: null,
      formatLog: null,
      formatLogItem: null,
      createLogGroup: false,
      createLogStream: false
    })
    this._formatter = new CloudWatchEventFormatter(this._options)

    this._sequenceTokenInfo = {
      date: null,
      sequenceToken: null
    }

    this._client = new AWS.CloudWatchLogs(this._options.awsConfig)
    this._initializing = null
  }

  submit (batch) {
    debug('submit', {batch})
    return this._initialize()
      .then(() => this._getSequenceToken())
      .then((sequenceToken) => this._putLogEvents(batch, sequenceToken))
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
    return this._client.createLogGroup(params).promise()
      .catch((err) => this._allowResourceAlreadyExistsException(err))
  }

  _maybeCreateLogStream () {
    if (!this._options.createLogStream) {
      return Promise.resolve()
    }
    const params = {
      logGroupName: this._logGroupName,
      logStreamName: this._logStreamName
    }
    return this._client.createLogStream(params).promise()
      .catch((err) => this._allowResourceAlreadyExistsException(err))
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
      logEvents: batch.map((item) => this._formatter.formatLogItem(item)),
      sequenceToken
    }
    return this._client.putLogEvents(params).promise()
  }

  _getSequenceToken () {
    const isCached = this._sequenceTokenInfo.sequenceToken
    return isCached ? this._sequenceTokenInfo.sequenceToken : this._fetchAndStoreSequenceToken()
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
    return this._client.describeLogStreams(params).promise()
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
