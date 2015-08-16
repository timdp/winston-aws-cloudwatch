/* global describe, it, expect */

'use strict'

import sinon from 'sinon'
import CloudWatchClient from '../../src/lib/CloudWatchClient'
import LogItem from '../../src/lib/LogItem'

const logGroupName = 'testGroup'
const logStreamName = 'testStream'

const stubClient = (client, withPaging) => {
  const cwl = client._client
  const stub = sinon.stub(cwl, 'describeLogStreamsAsync')
  if (withPaging) {
    stub.returns(Promise.resolve({nextToken: '1', logStreams: []}))
    stub.withArgs(sinon.match({nextToken: '1'}))
      .returns(Promise.resolve({nextToken: '2', logStreams: []}))
    stub.withArgs(sinon.match({nextToken: '2'}))
      .returns(Promise.resolve({logStreams: [{logStreamName}]}))
  } else {
    stub.returns(Promise.resolve({logStreams: [{logStreamName}]}))
  }
  sinon.stub(cwl, 'putLogEventsAsync')
    .returns(Promise.resolve({nextSequenceToken: '42'}))
}

const getClient = (options, withPaging = false) => {
  const client = new CloudWatchClient(logGroupName, logStreamName, options)
  stubClient(client, withPaging)
  return client
}

const getBatch = size => {
  const batch = []
  for (let i = 0; i < size; ++i) {
    batch.push(new LogItem(+new Date(), 'info', 'Test', {foo: 'bar'}))
  }
  return batch
}

describe('CloudWatchClient', () => {
  describe('#submit()', () => {
    it('calls putLogEvents', () => {
      const client = getClient()
      const batch = getBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.putLogEventsAsync.calledOnce)
        ).to.eventually.equal(true)
    })

    it('handles log stream paging', () => {
      const client = getClient(null, true)
      const batch = getBatch(1)
      return expect(
          client.submit(batch)
            .then(() => client._client.describeLogStreamsAsync.callCount)
        ).to.eventually.equal(3)
    })

    it('caches the sequence token', () => {
      const client = getClient({maxSequenceTokenAge: 1000})
      return expect(
          client.submit(getBatch(1))
            .then(() => client.submit(getBatch(1)))
            .then(() => client._client.describeLogStreamsAsync.calledOnce)
        ).to.eventually.equal(true)
    })
  })
})
