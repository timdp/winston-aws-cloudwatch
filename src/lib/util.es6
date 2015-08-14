'use strict'

const delay = time => new Promise(resolve => setTimeout(resolve, time))

const isEmpty = obj => (obj != null && Object.keys(obj).length > 0)

export default {
  delay,
  isEmpty
}
