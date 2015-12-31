# winston-aws-cloudwatch

[![npm](https://img.shields.io/npm/v/winston-aws-cloudwatch.svg)](https://www.npmjs.com/package/winston-aws-cloudwatch) [![Dependencies](https://img.shields.io/david/timdp/winston-aws-cloudwatch.svg)](https://david-dm.org/timdp/winston-aws-cloudwatch) [![Build Status](https://img.shields.io/travis/timdp/winston-aws-cloudwatch.svg)](https://travis-ci.org/timdp/winston-aws-cloudwatch) [![Coverage Status](https://img.shields.io/coveralls/timdp/winston-aws-cloudwatch.svg)](https://coveralls.io/r/timdp/winston-aws-cloudwatch) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

A [Winston](https://www.npmjs.com/package/winston) transport for
[Amazon CloudWatch](https://aws.amazon.com/cloudwatch/).

## Usage

```js
var CloudWatchTransport = require('winston-aws-cloudwatch')

winston.add(CloudWatchTransport, {
  logGroupName: '...',
  logStreamName: '...',
  awsConfig: { // Optional
    accessKeyId: '...',
    secretAccessKey: '...',
    region: '...'
  },
  formatLogItem: function (item) { // Optional
    return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta)
  }
})
```

## But Why?

As you may have noticed, there is also
[winston-cloudwatch](https://www.npmjs.com/package/winston-cloudwatch), which
predates this module. After making some contributions to that one, I felt like
writing my own version. Feel free to use whichever you like best.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
