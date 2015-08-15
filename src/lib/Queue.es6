'use strict'

import _debug from 'debug'
const debug = _debug('winston-aws-cloudwatch/Queue')

import {EventEmitter} from 'events'

export default class Queue extends EventEmitter {
  constructor () {
    super()
    this._contents = []
    this._locked = false
  }
  get size () {
    return this._contents.length
  }
  get locked () {
    return this._locked
  }
  push (item) {
    debug('push', {item})
    this._contents.push(item)
    this.emit('push', item)
  }
  head (num) {
    debug('head', {num})
    if (this._locked) {
      throw new Error('Not allowed')
    }
    return this._contents.slice(0, num)
  }
  remove (num) {
    debug('remove', {num})
    if (this._locked) {
      throw new Error('Not allowed')
    }
    this._contents.splice(0, num)
  }
  lock () {
    if (this._locked) {
      throw new Error('Already locked')
    }
    this._locked = true
  }
  unlock () {
    if (!this._locked) {
      throw new Error('Not locked')
    }
    this._locked = false
  }
}
