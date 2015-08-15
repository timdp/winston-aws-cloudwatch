'use strict'

const delay = time => new Promise(resolve => setTimeout(resolve, time))

const find = (arr, fn) => arr.filter(fn).shift()

const isEmpty = obj => (obj == null || Object.keys(obj).length === 0)

export default {
  delay,
  find,
  isEmpty
}
