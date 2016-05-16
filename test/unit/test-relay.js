/* global describe, it, expect */

'use strict'

import Promise from 'bluebird'
import sinon from 'sinon'
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

    it('eventually submits queue items to the client', () => {
      const submissionInterval = 100
      const client = new TestClient()
      const relay = new Relay(client, {submissionInterval})
      relay.start()
      const items = [{}, {}, {}]
      for (const item of items) {
        relay.submit(item)
      }
      const time = submissionInterval * 1.1
      return expect(
          Promise.delay(time)
            .then(() => client.submitted)
        ).to.eventually.deep.equal(items)
    })

    it('throttles submissions', () => {
      const submissionInterval = 200
      const batchSize = 10
      const batches = 3
      const client = new TestClient()
      const relay = new Relay(client, {submissionInterval, batchSize})
      relay.start()

      setTimeout(() => {
        for (let i = 0; i < batchSize * batches; ++i) {
          relay.submit({})
        }
      }, submissionInterval * 0.8)

      const counts = []
      let counting = Promise.delay(1)
      for (let i = 0; i < batches; ++i) {
        counting = counting.then(() => Promise.delay(submissionInterval))
          .then(() => counts.push(client.submitted.length))
      }
      counting = counting.then(() => counts)

      const expected = []
      for (let i = 1; i <= batches; ++i) {
        expected.push(batchSize * i)
      }

      return expect(counting).to.eventually.deep.equal(expected)
    })

    it('emits an error event', () => {
      const submissionInterval = 100
      const failures = 3
      const retries = 2
      const spy = sinon.spy()
      const client = new TestClient(failures)
      const relay = new Relay(client, {submissionInterval})
      relay.on('error', spy)
      relay.start()
      relay.submit({})
      const time = submissionInterval * (failures + retries)
      return expect(
          Promise.delay(time)
            .then(() => spy.callCount)
        ).to.eventually.equal(failures)
    })
  })
})
