'use strict'

import LogItem from '../../src/lib/log-item'

describe('LogItem', () => {
  describe('#date', () => {
    it('returns the item\'s date', () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const item = new LogItem(date, level, message, meta)
      expect(item.date).to.equal(date)
    })
  })

  describe('#level', () => {
    it('returns the item\'s level', () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const item = new LogItem(date, level, message, meta)
      expect(item.level).to.equal(level)
    })
  })

  describe('#message', () => {
    it('returns the item\'s message', () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const item = new LogItem(date, level, message, meta)
      expect(item.message).to.equal(message)
    })
  })

  describe('#meta', () => {
    it('returns the item\'s meta object', () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const item = new LogItem(date, level, message, meta)
      expect(item.meta).to.deep.equal(meta)
    })
  })
})
