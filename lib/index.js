/**
 * thunk-redis - https://github.com/thunks/thunk-redis
 *
 * MIT Licensed
 */

const defaultPort = 6379
const defaultHost = '127.0.0.1'
const tool = require('./tool')
const calcSlot = require('./slot')
const RedisClient = require('./client')
const wrapIPv6Address = require('./connection').wrapIPv6Address

exports.log = tool.log
exports.each = tool.each
exports.slice = tool.slice
exports.calcSlot = calcSlot

exports.createClient = function (port, host, options) {
  var addressArray

  if (Array.isArray(port)) {
    addressArray = normalizeNetAddress(port)
    options = host
  } else if (port && typeof port.port === 'number') {
    addressArray = normalizeNetAddress([port])
    options = host
  } else if (typeof port === 'string') {
    addressArray = normalizeNetAddress([port])
    options = host
  } else if (typeof port === 'number') {
    if (typeof host !== 'string') {
      options = host
      host = defaultHost
    }
    addressArray = normalizeNetAddress([{
      port: port,
      host: host
    }])
  } else {
    options = port
    addressArray = normalizeNetAddress([{
      port: defaultPort,
      host: defaultHost
    }])
  }

  options = options || {}
  options.bufBulk = !!options.returnBuffers
  options.authPass = (options.authPass || '') + ''
  options.noDelay = options.noDelay == null ? true : !!options.noDelay
  options.onlyMaster = options.onlyMaster == null ? true : !!options.onlyMaster

  options.database = options.database > 0 ? Math.floor(options.database) : 0
  options.maxAttempts = options.maxAttempts >= 0 ? Math.floor(options.maxAttempts) : 5
  options.pingInterval = options.pingInterval >= 0 ? Math.floor(options.pingInterval) : 0
  options.retryMaxDelay = options.retryMaxDelay >= 3000 ? Math.floor(options.retryMaxDelay) : 5 * 60 * 1000

  var client = new RedisClient(addressArray, options)

  var AliasPromise = options.usePromise

  if (!AliasPromise) return client

  if (typeof AliasPromise !== 'function' && typeof Promise === 'function') AliasPromise = Promise
  if (!AliasPromise.prototype || typeof AliasPromise.prototype.then !== 'function') {
    throw new Error(String(AliasPromise) + ' is not Promise constructor')
  }
  // if `options.usePromise` is available, export promise commands API for a client instance.
  tool.each(client.clientCommands, function (command) {
    var commandMethod = client[command]
    client[command] = client[command.toUpperCase()] = function () {
      var thunk = commandMethod.apply(this, arguments)
      return new AliasPromise(function (resolve, reject) {
        thunk(function (err, res) {
          return err == null ? resolve(res) : reject(err)
        })
      })
    }
  })
  return client
}

// return ['[192.168.0.100]:6379', '[::192.9.5.5]:6379']
function normalizeNetAddress (array) {
  return array.map(function (options) {
    if (typeof options === 'string') return wrapIPv6Address(options)
    if (typeof options === 'number') return wrapIPv6Address(defaultHost, options)
    options.host = options.host || defaultHost
    options.port = options.port || defaultPort
    return wrapIPv6Address(options.host, options.port)
  })
}
