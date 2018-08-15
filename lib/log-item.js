class LogItem {
  constructor (date, level, message, meta, callback) {
    this._date = date
    this._level = level
    this._message = message
    this._meta = meta
    this._callback = callback
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

  get callback () {
    return this._callback
  }
}

module.exports = LogItem
