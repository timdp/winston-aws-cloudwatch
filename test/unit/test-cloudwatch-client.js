/* global describe, it, expect */

'use strict'

import sinon from 'sinon'
import defaults from 'defaults'
import CloudWatchClient from '../../src/lib/cloudwatch-client'
import LogItem from '../../src/lib/log-item'

const logGroupName = 'testGroup'
const logStreamName = 'testStream'

let tokens = 0
let streams = 0

const mapRequest = (stub, includeExpected, token, nextToken) => {
  const suffixes = [++streams, ++streams, includeExpected ? '' : ++streams]
  const res = Promise.resolve({
    logStreams: suffixes.map(suf => ({logStreamName: logStreamName + suf})),
    nextToken
  })
  if (token) {
    stub.withArgs(sinon.match({nextToken: token}))
      .returns(res)
  } else {
    stub.returns(res)
  }
}

const mapRequests = (stub, pages, includeExpected) => {
  let prevToken = null
  for (let i = 0; i < pages - 1; ++i) {
    let token = 'token' + ++tokens
    mapRequest(stub, false, prevToken, token)
    prevToken = token
  }
  mapRequest(stub, includeExpected, prevToken)
}

const createErrorWithCode = code => {
  const error = new Error('Whoopsie daisies')
  error.code = code
  return error
}

const streamsStrategies = {
  default: stub => mapRequest(stub, true),
  notFound: stub => mapRequest(stub, false),
  paged: stub => mapRequests(stub, 3, true),
  pagedNotFound: stub => mapRequests(stub, 3, false)
}

const createClient = options => {
  options = defaults(options, {
    clientOptions: null,
    streamsStrategy: streamsStrategies.default,
    groupErrorCode: null,
    streamErrorCode: false
  })
  const client = new CloudWatchClient(logGroupName, logStreamName,
    options.clientOptions)
  sinon.stub(client._client, 'putLogEventsAsync')
    .returns(Promise.resolve({nextSequenceToken: 'token42'}))
  sinon.stub(client._client, 'createLogGroupAsync')
    .returns(options.groupErrorCode
      ? Promise.reject(createErrorWithCode(options.groupErrorCode))
      : Promise.resolve())
  sinon.stub(client._client, 'createLogStreamAsync')
    .returns(options.streamErrorCode
      ? Promise.reject(createErrorWithCode(options.streamErrorCode))
      : Promise.resolve())
  const stub = sinon.stub(client._client, 'describeLogStreamsAsync')
  options.streamsStrategy(stub)
  return client
}

const createBatch = size => {
  const batch = []
  for (let i = 0; i < size; ++i) {
    batch.push(new LogItem(+new Date(), 'info', 'Test', {foo: 'bar'}))
  }
  return batch
}

describe('CloudWatchClient', () => {
  describe('#submit()', () => {
    it('calls putLogEvents', () => {
      const client = createClient()
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.putLogEventsAsync.calledOnce)
        ).to.eventually.equal(true)
    })

    it('handles log stream paging', () => {
      const client = createClient({
        streamsStrategy: streamsStrategies.paged
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.describeLogStreamsAsync.callCount)
        ).to.eventually.equal(3)
    })

    it('rejects if the log stream is not found in a single page', () => {
      const client = createClient({
        streamsStrategy: streamsStrategies.notFound
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })

    it('rejects if the log stream is not found in multiple pages', () => {
      const client = createClient({
        streamsStrategy: streamsStrategies.pagedNotFound
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })
  })

  describe('#options.maxSequenceTokenAge', () => {
    it('caches the sequence token', () => {
      const client = createClient({
        clientOptions: {maxSequenceTokenAge: 1000}
      })
      return expect(
          client.submit(createBatch(1))
            .then(() => client.submit(createBatch(1)))
            .then(() => client._client.describeLogStreamsAsync.calledOnce)
        ).to.eventually.equal(true)
    })
  })

  describe('#options.formatLogItem', () => {
    it('uses the custom formatter', () => {
      const formatLogItem = sinon.spy((item) => {
        return {
          timestamp: item.date,
          message: `CUSTOM__${JSON.stringify(item)}`
        }
      })
      const client = createClient({
        clientOptions: {formatLogItem}
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => formatLogItem.calledOnce)
        ).to.eventually.equal(true)
    })
  })

  describe('#options.createLogGroup', () => {
    it('creates the log group', () => {
      const client = createClient({
        clientOptions: {createLogGroup: true}
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.createLogGroupAsync.calledOnce)
        ).to.eventually.equal(true)
    })

    it('does not throw if the log group already exists', () => {
      const client = createClient({
        clientOptions: {createLogGroup: true},
        groupErrorCode: 'ResourceAlreadyExistsException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.fulfilled
    })

    it('throws if another error occurs', () => {
      const client = createClient({
        clientOptions: {createLogGroup: true},
        groupErrorCode: 'UnicornDoesNotExistException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })
  })

  describe('#options.createLogStream', () => {
    it('creates the log stream', () => {
      const client = createClient({
        clientOptions: {createLogStream: true}
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.createLogStreamAsync.calledOnce)
        ).to.eventually.equal(true)
    })

    it('does not throw if the log stream already exists', () => {
      const client = createClient({
        clientOptions: {createLogStream: true},
        streamErrorCode: 'ResourceAlreadyExistsException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.fulfilled
    })

    it('throws if another error occurs', () => {
      const client = createClient({
        clientOptions: {createLogStream: true},
        streamErrorCode: 'UnicornDoesNotExistException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })
  })
})
