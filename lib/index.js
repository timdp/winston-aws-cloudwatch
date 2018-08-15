const Transport = require('winston-transport')
const CloudWatchClient = require('./cloudwatch-client')
const LogItem = require('./log-item')
const Relay = require('./relay')

class CloudWatchTransport extends Transport {
  constructor (options) {
    super(options)
    const client = new CloudWatchClient(
      options.logGroupName,
      options.logStreamName,
      options
    )
    this._relay = new Relay(client, options)
    this._relay.on('error', err => this.emit('error', err))
    this._relay.start()
  }

  log (info, callback) {
    const level = info.level
    const msg = info.message
    const meta = Object.assign({}, info)
    delete meta.level
    delete meta.message
    this._relay.submit(new LogItem(+new Date(), level, msg, meta, callback))
  }
}

module.exports = CloudWatchTransport
