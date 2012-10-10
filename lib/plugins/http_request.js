// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var request = require('request')
  , interpolate = require('../interpolate')

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

  request(options, function (error, response, body) {
    cb(error, response)
  })
}

/**
 * Internal: interpolate the values from `context` into the `params` struct
 */
function interpolateRequest(params, context) {

  params.body = interpolate(params.body, context, { json: true })
  params.path = interpolate(params.body, context)
  for (var key in params.headers) {
    params.headers[key] = interpolate(params.headers[key], context)
  }
  return params
}

module.exports = function(options) {

  function http_request(example, next) {

    var params = example.http
    if (!params || !params.request) return next()

    params.uri = options.root + params.path
    make_request(params, function(err, response) {
      if (err) return next(err)

      example.response = response
      next()
    })
  }

  return {
    examples: http_request
  }
}
