// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var request = require('request')

var requestRegex = /^(GET|PUT|POST|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S*)/
var responseRegex = /^([1-5]\d\d)\s*(.+)?\n/

/* Internal: Parse a block of text into an HTTP request or response.
 *
 * raw - a string of text to parse
 *
 * Returns an object with properties like title, headers, body
 *
 * Examples
 *
 *   parse("POST /hello\nContent-type: text/plain\n\nHello World")
 *   // { method: "POST", path: "/hello",
 *   //   headers: { "content-type": "text/plain" },
 *   //   body: "Hello World" }
 */
function parse(raw) {

  var parts = raw.split(/\n\s*\n/)
    , params = {}, match
    , headers = parts.shift().split("\n")

  params.title = headers.shift()
  params.headers = parseHeaders(headers)
  params.body = parts.shift()
  params.remainder = parts

  if ((match = requestRegex.exec(params.title))) {
    params.request = true
    params.method = match[1]
    params.path = match[2]
  }

  if ((match = responseRegex.exec(params.title))) {
    params.response = true
    params.code = match[1]
    params.statusText = match[2]
  }

  return params
}

/* Internal: parse HTTP headers
 * Since HTTP header names are defined to be case-insensitive, normalize header names
 * to lowercase.
 *
 * headersArray - an array of strings representing the raw headers
 *
 * Returns an object with key-value pairs representing the normalized headers
 *
 * Examples
 *
 *   parseHeaders(["Content-type: text/plain", "Authorization: Bearer DEADBEEF"])
 *   // { "content-type": "text/plain", "authorization": "Bearer DEADBEEF" }
 */
function parseHeaders(headersArray) {

    var headers = {}, match

    for (var i = 0; i < headersArray.length; i++) {
        if (!(match = /([^:]+):[ \t]+(.*)/.exec(headersArray[i]))) continue

        if (sub)
            headers[match[1].toLowerCase()] = doc.substitute(match[2])
        else
            headers[match[1].toLowerCase()] = match[2]
    }

    return headers
}

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

function http(options, example, next) {

  var params = parse(example.text)

  if (params.request) {
    params.uri = options.root + params.path
    make_request(options, params, function(err, response) {
      if (err) return next(err)

      example.context.response = response
      next()
    })
  } else if (params.response) {
    // match the response here
    next()
  } else {
    next()
  }
}

module.exports = function(options) {
  return {
    example: function(example, next) {
      return http(options, example, next)
    }
  }
}
