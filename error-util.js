'use strict'

const _ = require('lodash')

class ErrorUtil {
  errorToString(err) {
    let s = ''
    const stringify = JSON.stringify(err)
    if (stringify !== '{}') {
      s = stringify
    }
    if (_.isFunction(err.toString)) {
      const toString = err.toString()
      if (toString !== '[object Object]') {
        s += ' ' + toString
      }
    }
    if (err.stack) {
      s += ' ' + err.stack
    }
    return s
  }
}

module.exports = new ErrorUtil()
