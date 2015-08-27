'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch:Queue')

import {EventEmitter} from 'events'

export default class Queue extends EventEmitter {
  constructor () {
    super()
    this._contents = []
  }
  get size () {
    return this._contents.length
  }
  push (item) {
    debug('push', {item})
    this._contents.push(item)
    this.emit('push', item)
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
