const LogItem = require('../../lib/log-item')

describe('LogItem', () => {
  describe('#date', () => {
    it("returns the item's date", () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const callback = () => {}
      const item = new LogItem(date, level, message, meta, callback)
      expect(item.date).to.equal(date)
    })
  })

  describe('#level', () => {
    it("returns the item's level", () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const callback = () => {}
      const item = new LogItem(date, level, message, meta, callback)
      expect(item.level).to.equal(level)
    })
  })

  describe('#message', () => {
    it("returns the item's message", () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const callback = () => {}
      const item = new LogItem(date, level, message, meta, callback)
      expect(item.message).to.equal(message)
    })
  })

  describe('#meta', () => {
    it("returns the item's meta object", () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const callback = () => {}
      const item = new LogItem(date, level, message, meta, callback)
      expect(item.meta).to.deep.equal(meta)
    })
  })

  describe('#callback', () => {
    it("returns the item's callback function", () => {
      const date = +new Date()
      const level = 'info'
      const message = 'Hello, world'
      const meta = {}
      const callback = () => {}
      const item = new LogItem(date, level, message, meta, callback)
      expect(item.callback).to.equal(callback)
    })
  })
})
