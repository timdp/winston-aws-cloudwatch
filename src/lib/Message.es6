'use strict'

class Message {
  constructor (level, message, meta) {
    this._level = level
    this._message = message
    this._meta = meta
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
      timestamp: new Date().getTime()
    }
  }
}

export default Message
