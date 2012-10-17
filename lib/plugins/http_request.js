// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var request = require('request')
  , interpolate = require('../interpolate')
  , debug = require('debug')('literapi:plugin:http:request')

// Workaround for stubbing
request.make = request

/**
 * Internal: actually make the request described by `params`
 */
function make_request(params, cb) {

  var options =
  { uri: params.uri
  , method: params.method
  , headers: params.headers
  }

  if (params.body) options.body = params.body
  else options.headers['content-length'] = 0

  debug("making request", options)
  request.make(options, function (error, response, body) {
    cb(error, response)
  })
}

/**
 * Internal: interpolate the values from `bindings` into the `params` struct
 */
function interpolateRequest(params, bindings) {

  params.body = interpolate(params.body, bindings, { json: true })
  params.path = interpolate(params.path, bindings)
  for (var key in params.headers) {
    params.headers[key] = interpolate(params.headers[key], bindings)
  }
  return params
}

module.exports = function(options) {

  function http_request(example, next) {

    var params = example.http
    if (!params || !params.request) return next()

    interpolateRequest(params, example.context.bindings)

    params.uri = options.root + params.path
    make_request(params, function(err, response) {
      if (err) return next(err)

      example.context.response = response
      example.context.request = params
      next()
    })
  }

  return {
    examples: http_request
  }
}
