'use strict'

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
      message: [
        this.level,
        this.message,
        JSON.stringify(this.meta, null, '  ')
      ].join(' - '),
      timestamp: this.date.getTime()
    }
  }
}

export default Message
