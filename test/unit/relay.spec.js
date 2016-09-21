'use strict'

import delay from 'delay'
import ClientMock from '../lib/client-mock'
import Relay from '../../src/relay'

describe('Relay', () => {
  describe('#start()', () => {
    it('can only be called once', () => {
      const relay = new Relay(new ClientMock())
      relay.start()
      expect(() => {
        relay.start()
      }).to.throw(Error)
    })

    it('submits queue items to the client', async () => {
      const submissionInterval = 50
      const client = new ClientMock()
      const relay = new Relay(client, {submissionInterval})
      relay.start()
      const items = [{}, {}, {}]
      for (const item of items) {
        relay.submit(item)
      }
      await delay(submissionInterval * 1.1)
      expect(client.submitted).to.deep.equal(items)
    })

    it('throttles submissions', async () => {
      const submissionInterval = 50
      const batchSize = 10
      const batches = 3
      const client = new ClientMock()
      const relay = new Relay(client, {submissionInterval, batchSize})
      relay.start()

      for (let i = 0; i < batchSize * batches; ++i) {
        relay.submit({})
      }

      const counts = []
      for (let i = 0; i < batches; ++i) {
        await delay(submissionInterval * 1.1)
        counts.push(client.submitted.length)
      }

      const expected = []
      for (let i = 1; i <= batches; ++i) {
        expected.push(batchSize * i)
      }

      expect(counts).to.deep.equal(expected)
    })

    it('emits an error event', async () => {
      const submissionInterval = 50
      const failures = ['FAIL', 'FAIL', 'FAIL']
      const spy = sinon.spy()
      const client = new ClientMock(failures)
      const relay = new Relay(client, {submissionInterval})
      relay.on('error', spy)
      relay.start()
      relay.submit({})
      await delay(submissionInterval * failures.length * 1.1)
      expect(spy.callCount).to.equal(failures.length)
    })

    it('silently handles a DataAlreadyAcceptedException error', async () => {
      const submissionInterval = 50
      const failures = ['DataAlreadyAcceptedException']
      const spy = sinon.spy()
      const client = new ClientMock(failures)
      const relay = new Relay(client, {submissionInterval})
      relay.on('error', spy)
      relay.start()
      relay.submit({})
      await delay(submissionInterval * failures.length * 1.1)
      expect(spy.callCount).to.equal(0)
    })

    it('handles InvalidSequenceTokenException errors by retrying', async () => {
      const submissionInterval = 50
      const failures = ['InvalidSequenceTokenException', 'InvalidSequenceTokenException']
      const client = new ClientMock(failures)
      const relay = new Relay(client, {submissionInterval})
      relay.start()
      relay.submit({})
      await delay(submissionInterval * (failures.length + 1) * 1.1)
      expect(client.submitted.length).to.equal(1)
    })
  })
})
