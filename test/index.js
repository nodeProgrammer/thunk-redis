/*global describe, before, after*/

var should = require('should')
var redis = require('..')
var clientTest = require('./client')
var commandsConnection = require('./commands-connection')
var commandsGeo = require('./commands-geo')
var commandsHash = require('./commands-hash')
var commandsKey = require('./commands-key')
var commandsList = require('./commands-list')
var commandsPubsub = require('./commands-pubsub')
var commandsScript = require('./commands-script')
var commandsHyperLogLog = require('./commands-hyperloglog')
var commandsServer = require('./commands-server')
var commandsSet = require('./commands-set')
var commandsSortedSet = require('./commands-sorted-set')
var commandsString = require('./commands-string')
var commandsTransaction = require('./commands-transaction')

describe('thunk-redis', function () {
  before(function (done) {
    redis.createClient({
      database: 0
    }).flushall()(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.dbsize()
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.select(1)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.flushdb()
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.dbsize()
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      this.clientEnd()
    })(done)
  })

  after(function () {
    setTimeout(function () {
      process.exit()
    }, 1000)
  })

  clientTest()

  commandsKey()
  commandsSet()
  commandsGeo()
  commandsHash()
  commandsList()
  commandsPubsub()
  commandsScript()
  commandsServer()
  commandsString()
  commandsSortedSet()
  commandsConnection()
  commandsHyperLogLog()
  commandsTransaction()

  try {
    var check = new Function('return function*(){}') // eslint-disable-line
    require('./chaos')()
  } catch (e) {
    console.log('Not support generator!')
  }
})
