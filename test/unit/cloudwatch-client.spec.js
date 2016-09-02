'use strict'

import defaults from 'defaults'
import CloudWatchClient from '../../src/lib/cloudwatch-client'
import LogItem from '../../src/lib/log-item'

const logGroupName = 'testGroup'
const logStreamName = 'testStream'

let tokens = 0
let streams = 0

const withPromise = (res) => ({ promise: () => res })

const mapRequest = (stub, includeExpected, token, nextToken) => {
  const suffixes = [++streams, ++streams, includeExpected ? '' : ++streams]
  const res = Promise.resolve({
    logStreams: suffixes.map((suf) => ({ logStreamName: logStreamName + suf })),
    nextToken
  })
  if (token) {
    stub.withArgs(sinon.match({ nextToken: token }))
      .returns(withPromise(res))
  } else {
    stub.returns(withPromise(res))
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

const createErrorWithCode = (code) => {
  const error = new Error('Whoopsie daisies')
  error.code = code
  return error
}

const streamsStrategies = {
  default: (stub) => mapRequest(stub, true),
  notFound: (stub) => mapRequest(stub, false),
  paged: (stub) => mapRequests(stub, 3, true),
  pagedNotFound: (stub) => mapRequests(stub, 3, false)
}

const createClient = (options) => {
  options = defaults(options, {
    clientOptions: null,
    streamsStrategy: streamsStrategies.default,
    groupErrorCode: null,
    streamErrorCode: false
  })
  const client = new CloudWatchClient(logGroupName, logStreamName,
    options.clientOptions)
  sinon.stub(client._client, 'putLogEvents')
    .returns(withPromise(Promise.resolve({ nextSequenceToken: 'token42' })))
  sinon.stub(client._client, 'createLogGroup')
    .returns(withPromise(options.groupErrorCode
      ? Promise.reject(createErrorWithCode(options.groupErrorCode))
      : Promise.resolve()))
  sinon.stub(client._client, 'createLogStream')
    .returns(withPromise(options.streamErrorCode
      ? Promise.reject(createErrorWithCode(options.streamErrorCode))
      : Promise.resolve()))
  const stub = sinon.stub(client._client, 'describeLogStreams')
  options.streamsStrategy(stub)
  return client
}

const createBatch = (size) => {
  const batch = []
  for (let i = 0; i < size; ++i) {
    batch.push(new LogItem(+new Date(), 'info', 'Test', { foo: 'bar' }))
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
            .then(() => client._client.putLogEvents.calledOnce)
        ).to.eventually.equal(true)
    })

    it('handles log stream paging', () => {
      const client = createClient({
        streamsStrategy: streamsStrategies.paged
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.describeLogStreams.callCount)
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
        clientOptions: { maxSequenceTokenAge: 1000 }
      })
      return expect(
          client.submit(createBatch(1))
            .then(() => client.submit(createBatch(1)))
            .then(() => client._client.describeLogStreams.calledOnce)
        ).to.eventually.equal(true)
    })
  })

  describe('#options.formatLog', () => {
    it('uses the custom formatter', () => {
      const formatLog = sinon.spy((item) => {
        return `CUSTOM__${JSON.stringify(item)}`
      })
      const client = createClient({
        clientOptions: { formatLog }
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => formatLog.calledOnce)
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
        clientOptions: { formatLogItem }
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => formatLogItem.calledOnce)
        ).to.eventually.equal(true)
    })

    it('does not use the custom formatter if formatLog is specified', () => {
      const formatLog = sinon.spy((item) => {
        return `CUSTOM__${JSON.stringify(item)}`
      })
      const formatLogItem = sinon.spy((item) => {
        return {
          timestamp: item.date,
          message: `CUSTOM__${JSON.stringify(item)}`
        }
      })
      const client = createClient({
        clientOptions: { formatLog, formatLogItem }
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => formatLogItem.calledOnce)
        ).to.eventually.equal(false)
    })
  })

  describe('#options.createLogGroup', () => {
    it('creates the log group', () => {
      const client = createClient({
        clientOptions: { createLogGroup: true }
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.createLogGroup.calledOnce)
        ).to.eventually.equal(true)
    })

    it('does not throw if the log group already exists', () => {
      const client = createClient({
        clientOptions: { createLogGroup: true },
        groupErrorCode: 'ResourceAlreadyExistsException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.fulfilled
    })

    it('throws if another error occurs', () => {
      const client = createClient({
        clientOptions: { createLogGroup: true },
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
        clientOptions: { createLogStream: true }
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.createLogStream.calledOnce)
        ).to.eventually.equal(true)
    })

    it('does not throw if the log stream already exists', () => {
      const client = createClient({
        clientOptions: { createLogStream: true },
        streamErrorCode: 'ResourceAlreadyExistsException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.fulfilled
    })

    it('throws if another error occurs', () => {
      const client = createClient({
        clientOptions: { createLogStream: true },
        streamErrorCode: 'UnicornDoesNotExistException'
      })
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })
  })
})
