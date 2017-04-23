'use strict'

import _debug from 'debug'

const debug = _debug('winston-aws-cloudwatch:Queue')

export default class Queue {
  constructor () {
    this._contents = []
  }

  get size () {
    return this._contents.length
  }

  push (item) {
    debug('push', {item})
    this._contents.push(item)
  }

  head (num) {
    debug('head', {num})
    return this._contents.slice(0, num)
  }

  remove (num) {
    debug('remove', {num})
    this._contents.splice(0, num)
  }
}
