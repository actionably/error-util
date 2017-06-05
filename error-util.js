'use strict'

const _ = require('lodash')
const q = require('q')
const uuidV4 = require('uuid/v4')

class ErrorUtil {
  initializeAirbrake() {
    if (!this.airbrake) {
      if (process.env.AIRBRAKE_PROJECT_ID && process.env.AIRBRAKE_PROJECT_API_KEY) {
        this.airbrake = require('airbrake').createClient(
          process.env.AIRBRAKE_PROJECT_ID,
          process.env.AIRBRAKE_PROJECT_API_KEY
        )
        this.airbrake.handleExceptions()
      }
    }
  }

  handleLambda(promise, event, context, callback)  {
    q(promise).done(retValue => {
      callback(null, retValue)
    }, error => {
      this.initializeAirbrake()
      const referenceUUID = uuidV4()
      console.error('ERROR500:: ', referenceUUID)
      console.error('ERROR500:: ', JSON.stringify(event))
      console.error('ERROR500:: ', JSON.stringify(context))
      console.error('ERROR500:: ', JSON.stringify(error))
      console.error('ERROR500:: ', error.stack)
      console.error('ERROR500:: ', this.errorToString(error))

      if (this.airbrake) {
        error.referenceUUID = referenceUUID
        this.airbrake.notify(error, (err2, url) => {
          if (err2) {
            console.error('unable to save to airbrake ' + this.errorToString(err2))
          }
          console.error('Error saved to airbrake ' + url)
        })
      }
      const errorReturn = {
        errors: [{message: JSON.stringify(error) + ' ' + error.stack}]
      }
      callback(JSON.stringify(errorReturn))
    })
  }

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

  log(error, metadata, toAirbrake, consoleLevel) {
    if(metadata) {
      error.referenceUUID = metadata.referenceUUID || uuidV4()
      if (consoleLevel) {
        console.error(`${consoleLevel}::CONTINUE::${error.referenceUUID}::`, JSON.stringify(metadata, null, 2), this.errorToString(error))
      }
    }

    if(toAirbrake && !this.airbrake) {
      this.initializeAirbrake()
      if(!this.airbrake) {
        console.log(error)
        return
      }
      this.airbrake.notify(error, (err2, url) => {
        if (err2) {
          console.error('unable to save to airbrake ' + this.errorToString(err2))
        }
        console.error('Error saved to airbrake ' + url)
      })
    }

  }

  logToAirbrake(error, metadata) {
    if (!this.airbrake) {
      this.initializeAirbrake()
    }
    if (!this.airbrake) {
      console.error(error)
      return
    }

    if(metadata) {
      error.referenceUUID = metadata.referenceUUID || uuidV4()
      console.error(`ERROR::CONTINUE::${error.referenceUUID}:: `, JSON.stringify(metadata, null, 2), this.errorToString(error))
    }

    this.airbrake.notify(error, (err2, url) => {
      if (err2) {
        console.error('unable to save to airbrake ' + this.errorToString(err2))
      }
      console.error('Error saved to airbrake ' + url)
    })
  }
}

module.exports = new ErrorUtil()
