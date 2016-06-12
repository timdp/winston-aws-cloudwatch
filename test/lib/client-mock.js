export default class MockClient {
  constructor (failures = 0) {
    this._submitted = []
    this._failures = failures
  }

  submit (batch) {
    this._submitted = this._submitted.concat(batch)
    if (this._failures > 0) {
      this._failures--
      return Promise.reject(new Error('FAIL'))
    }
    return Promise.resolve()
  }

  get submitted () {
    return this._submitted
  }
}
