const _debug = require('debug')

const debug = _debug('winston-aws-cloudwatch:Queue')

class Queue {
  constructor () {
    this._contents = []
  }

  get size () {
    return this._contents.length
  }

  push (item) {
    debug('push', { item })
    this._contents.push(item)
  }

  head (num) {
    debug('head', { num })
    return this._contents.slice(0, num)
  }

  remove (num) {
    debug('remove', { num })
    this._contents.splice(0, num)
  }
}

module.exports = Queue
