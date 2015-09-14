'use strict'

import {isEmpty} from 'lodash'

export default class CloudWatchEventFormatter {
  static formatLogItem (item) {
    return {
      message: CloudWatchEventFormatter._logItemToCloudWatchMessage(item),
      timestamp: item.date
    }
  }

  static _logItemToCloudWatchMessage (item) {
    const meta = isEmpty(item.meta) ? ''
      : ' ' + JSON.stringify(item.meta, null, 2)
    return `[${item.level.toUpperCase()}] ${item.message}${meta}`
  }
}
