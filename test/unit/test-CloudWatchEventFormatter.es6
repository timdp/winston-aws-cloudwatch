/* global describe, it, expect */

'use strict'

import CloudWatchEventFormatter from '../../src/lib/CloudWatchEventFormatter'
import LogItem from '../../src/lib/LogItem'

describe('CloudWatchEventFormatter', () => {
  describe('#formatItem()', () => {
    it('formats a log item', () => {
      const date = 123456789
      const item = new LogItem(date, 'info', 'Hello, world', {foo: 'bar'})
      const event = CloudWatchEventFormatter.formatLogItem(item)
      expect(event.timestamp).to.equal(date)
      expect(event.message).to.equal(`[INFO] Hello, world {
  "foo": "bar"
}`)
    })

    it('omits metadata when undefined', () => {
      const item = new LogItem(+new Date(), 'info', 'Hello, world')
      const event = CloudWatchEventFormatter.formatLogItem(item)
      expect(event.message).to.equal('[INFO] Hello, world')
    })

    it('omits metadata when empty', () => {
      const item = new LogItem(+new Date(), 'info', 'Hello, world', {})
      const event = CloudWatchEventFormatter.formatLogItem(item)
      expect(event.message).to.equal('[INFO] Hello, world')
    })
  })
})
