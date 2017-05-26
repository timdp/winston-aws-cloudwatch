'use strict'

import CloudWatchEventFormatter from '../../src/cloudwatch-event-formatter'
import LogItem from '../../src/log-item'

describe('CloudWatchEventFormatter', () => {
  describe('constructor', () => {
    it('does not require options', () => {
      expect(() => {
        return new CloudWatchEventFormatter()
      }).to.not.throw(Error)
    })
  })

  describe('#formatLogItem()', () => {
    let formatter

    beforeEach(() => {
      formatter = new CloudWatchEventFormatter()
    })

    it('formats a log item with metadata', () => {
      const date = 123456789
      const item = new LogItem(date, 'info', 'Hello, world', {foo: 'bar'}, () => {})
      const event = formatter.formatLogItem(item)
      expect(event.timestamp).to.equal(date)
      expect(event.message).to.equal(`[INFO] Hello, world {
  "foo": "bar"
}`)
    })
  })

  describe('#formatLog()', () => {
    let formatter

    beforeEach(() => {
      formatter = new CloudWatchEventFormatter()
    })

    it('formats a log message with metadata', () => {
      const date = 123456789
      const item = new LogItem(date, 'info', 'Hello, world', {foo: 'bar'}, () => {})
      const msg = formatter.formatLog(item)
      expect(msg).to.equal(`[INFO] Hello, world {
  "foo": "bar"
}`)
    })

    it('omits metadata when undefined', () => {
      const item = new LogItem(+new Date(), 'info', 'Hello, world', undefined, () => {})
      const msg = formatter.formatLog(item)
      expect(msg).to.equal('[INFO] Hello, world')
    })

    it('omits metadata when empty', () => {
      const item = new LogItem(+new Date(), 'info', 'Hello, world', {}, () => {})
      const msg = formatter.formatLog(item)
      expect(msg).to.equal('[INFO] Hello, world')
    })
  })

  describe('#options.formatLog', () => {
    it('overrides formatLog', () => {
      const formatLog = () => {}
      const formatter = new CloudWatchEventFormatter({formatLog})
      expect(formatter.formatLog).to.equal(formatLog)
    })
  })

  describe('#options.formatLogItem', () => {
    it('overrides formatLogItem', () => {
      const formatLogItem = () => {}
      const formatter = new CloudWatchEventFormatter({formatLogItem})
      expect(formatter.formatLogItem).to.equal(formatLogItem)
    })

    it('does not override formatLogItem if formatLog is also supplied', () => {
      const formatLog = () => {}
      const formatLogItem = () => {}
      const formatter = new CloudWatchEventFormatter({formatLog, formatLogItem})
      expect(formatter.formatLog).to.equal(formatLog)
      expect(formatter.formatLogItem).to.not.equal(formatLogItem)
    })
  })
})
