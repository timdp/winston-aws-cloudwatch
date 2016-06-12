'use strict'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

global.Promise = global.Promise || require('pinkie')

chai.use(chaiAsPromised)
chai.use(sinonChai)

global.expect = chai.expect
