'use strict'

export default class LogItem {
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
}
