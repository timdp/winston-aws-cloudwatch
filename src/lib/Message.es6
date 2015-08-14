'use strict'

import {isEmpty} from './util'

class Message {
  constructor (date, level, message, meta) {
    this._date = date
    this._level = level
    this._message = message
    this._meta = meta
  }
  get date () {
    return this._date
  }
  get level () {
    return this._level
  }
  get message () {
    return this._message
  }
  get meta () {
    return this._meta
  }
  toCloudWatchEvent () {
    return {
      message: this._toCloudWatchMessage(),
      timestamp: this.date.getTime()
    }
  }
  _toCloudWatchMessage () {
    const meta = this.meta
    return `[${this.level.toUpperCase()}] ${this.message}` +
      (isEmpty(meta) ? ' ' + JSON.stringify(meta, null, 2) : '')
  }
}

export default Message
