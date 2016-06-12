'use strict'

import sinon from 'sinon'
import delay from 'delay'
import Relay from '../../src/lib/relay'

class TestClient {
  constructor (failures = 0) {
    this._submitted = []
    this._failures = failures
  }

  submit (batch) {
    this._submitted = this._submitted.concat(batch)
    if (this._failures > 0) {
      this._failures--
      return Promise.reject(new Error('FAIL'))
    }
    return Promise.resolve()
  }

  get submitted () {
    return this._submitted
  }
}

describe('Relay', () => {
  describe('#start()', () => {
    it('can only be called once', () => {
      const relay = new Relay(new TestClient())
      relay.start()
      expect(() => {
        relay.start()
      }).to.throw(Error)
    })

    it('submits queue items to the client', async () => {
      const submissionInterval = 50
      const client = new TestClient()
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
      const client = new TestClient()
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
      const failures = 3
      const retries = 2
      const spy = sinon.spy()
      const client = new TestClient(failures)
      const relay = new Relay(client, {submissionInterval})
      relay.on('error', spy)
      relay.start()
      relay.submit({})
      await delay(submissionInterval * (failures + retries) * 1.1)
      expect(spy.callCount).to.equal(failures)
    })
  })
})
