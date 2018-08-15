const Queue = require('../../lib/queue')

const createItem = () => ({ callback () {} })

describe('Queue', () => {
  describe('#size', () => {
    it('is 0 by default', () => {
      const queue = new Queue()
      expect(queue.size).to.equal(0)
    })
  })

  describe('#push()', () => {
    it('adds an item to an empty queue', () => {
      const queue = new Queue()
      const item = createItem()
      queue.push(item)
      expect(queue.size).to.equal(1)
    })

    it('adds an item to a non-empty queue', () => {
      const queue = new Queue()
      for (let i = 0; i < 5; ++i) {
        queue.push(createItem())
      }
      const prevSize = queue.size
      queue.push(createItem())
      expect(queue.size).to.equal(prevSize + 1)
    })
  })

  describe('#head()', () => {
    it('returns the first items for a longer queue', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 3; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      for (let i = 0; i < 7; ++i) {
        queue.push(createItem())
      }
      expect(queue.head(items.length)).to.deep.equal(items)
    })

    it('returns as many items as it can for a shorter queue', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 10; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      expect(queue.head(items.length * 2)).to.deep.equal(items)
    })

    it('returns all items for a queue of equal length', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 10; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      expect(queue.head(items.length)).to.deep.equal(items)
    })

    it('returns no items for an empty queue', () => {
      const queue = new Queue()
      expect(queue.head(10)).to.deep.equal([])
    })

    it('returns no items when asked to do so', () => {
      const queue = new Queue()
      for (let i = 0; i < 10; ++i) {
        queue.push(createItem())
      }
      expect(queue.head(0)).to.deep.equal([])
    })
  })

  describe('#remove()', () => {
    it('removes the first items for a longer queue', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 3; ++i) {
        queue.push(createItem())
      }
      for (let i = 0; i < 7; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      queue.remove(3)
      expect(queue.size).to.equal(items.length)
      expect(queue.head(items.length)).to.deep.equal(items)
    })

    it('removes all items for a queue of equal length', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 10; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      queue.remove(items.length)
      expect(queue.size).to.equal(0)
    })

    it('removes no items when asked to do so', () => {
      const queue = new Queue()
      const items = []
      for (let i = 0; i < 10; ++i) {
        const item = createItem()
        items.push(item)
        queue.push(item)
      }
      queue.remove(0)
      expect(queue.size).to.equal(items.length)
      expect(queue.head(10)).to.deep.equal(items)
    })
  })
})
