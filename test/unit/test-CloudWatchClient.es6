/* global describe, it, expect */

'use strict'

import sinon from 'sinon'
import CloudWatchClient from '../../src/lib/CloudWatchClient'
import LogItem from '../../src/lib/LogItem'

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

const strategies = {
  default: stub => mapRequest(stub, true),
  notFound: stub => mapRequest(stub, false),
  paged: stub => mapRequests(stub, 3, true),
  pagedNotFound: stub => mapRequests(stub, 3, false)
}

const createClient = (options, streamsStrategy = strategies.default) => {
  const client = new CloudWatchClient(logGroupName, logStreamName, options)
  sinon.stub(client._client, 'putLogEventsAsync')
    .returns(Promise.resolve({nextSequenceToken: '42'}))
  const stub = sinon.stub(client._client, 'describeLogStreamsAsync')
  streamsStrategy(stub)
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
      const client = createClient(null, strategies.paged)
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.describeLogStreamsAsync.callCount)
        ).to.eventually.equal(3)
    })

    it('rejects if the log stream is not found in a single page', () => {
      const client = createClient(null, strategies.notFound)
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })

    it('rejects if the log stream is not found in multiple pages', () => {
      const client = createClient(null, strategies.pagedNotFound)
      const batch = createBatch(1)
      return expect(
          client.submit(batch)
        ).to.be.rejected
    })

    it('caches the sequence token', () => {
      const client = createClient({maxSequenceTokenAge: 1000})
      return expect(
          client.submit(createBatch(1))
            .then(() => client.submit(createBatch(1)))
            .then(() => client._client.describeLogStreamsAsync.calledOnce)
        ).to.eventually.equal(true)
    })
  })
})
