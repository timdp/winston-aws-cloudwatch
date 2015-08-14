# winston-aws-cloudwatch

[![npm](https://img.shields.io/npm/v/winston-aws-cloudwatch.svg)](https://www.npmjs.com/package/winston-aws-cloudwatch) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

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
