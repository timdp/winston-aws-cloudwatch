# winston-aws-cloudwatch

[![npm](https://img.shields.io/npm/v/winston-aws-cloudwatch.svg)](https://www.npmjs.com/package/winston-aws-cloudwatch) [![Dependencies](https://img.shields.io/david/timdp/winston-aws-cloudwatch.svg)](https://david-dm.org/timdp/winston-aws-cloudwatch) [![Build Status](https://img.shields.io/circleci/project/github/timdp/winston-aws-cloudwatch/master.svg?label=build)](https://circleci.com/gh/timdp/winston-aws-cloudwatch) [![Coverage Status](https://img.shields.io/coveralls/timdp/winston-aws-cloudwatch/master.svg)](https://coveralls.io/r/timdp/winston-aws-cloudwatch) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A [Winston](https://www.npmjs.com/package/winston) transport for
[Amazon CloudWatch](https://aws.amazon.com/cloudwatch/).

## Usage

```js
var CloudWatchTransport = require('winston-aws-cloudwatch')

winston.add(CloudWatchTransport, {
  logGroupName: '...', // REQUIRED
  logStreamName: '...', // REQUIRED
  createLogGroup: true,
  createLogStream: true,
  submissionInterval: 2000,
  submissionRetryCount: 1,
  batchSize: 20,
  awsConfig: {
    accessKeyId: '...',
    secretAccessKey: '...',
    region: '...'
  },
  formatLog: function (item) {
    return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta)
  }
})
```

## Error Handling

If, for any reason, logging to CloudWatch should fail, then the transport will
emit an `error` event. It is recommended that you
[subscribe to this event](https://www.npmjs.com/package/winston#events-and-callbacks-in-winston)
to avoid crashes.

## But Why?

As you may have noticed, there is also
[winston-cloudwatch](https://www.npmjs.com/package/winston-cloudwatch), which
predates this module. After making some contributions to that one, I felt like
writing my own version. Feel free to use whichever you like best.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
