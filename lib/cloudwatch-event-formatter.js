const isEmpty = require('lodash.isempty')

class CloudWatchEventFormatter {
  constructor ({ formatLog, formatLogItem } = {}) {
    if (typeof formatLog === 'function') {
      this.formatLog = formatLog
    } else if (typeof formatLogItem === 'function') {
      this.formatLogItem = formatLogItem
    }
  }

  formatLogItem (item) {
    return {
      message: this.formatLog(item),
      timestamp: item.date
    }
  }

  formatLog (item) {
    const meta = isEmpty(item.meta)
      ? ''
      : ' ' + JSON.stringify(item.meta, null, 2)
    return `[${item.level.toUpperCase()}] ${item.message}${meta}`
  }
}

module.exports = CloudWatchEventFormatter
