// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var debug = require('debug')('literapi:plugin:http:parse')

var requestRegex = /^(GET|PUT|POST|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S*)/
var responseRegex = /^(\d\d\d)\s*(.*)/

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

  if ((match = requestRegex.exec(params.title))) {
    params.request = true
    params.method = match[1]
    params.path = match[2]
    return params
  }

  if ((match = responseRegex.exec(params.title))) {
    params.response = true
    params.code = parseInt(match[1], 10)
    params.statusText = match[2]
    return params
  }
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

        headers[match[1].toLowerCase()] = match[2]
    }

    return headers
}

module.exports.examples = function http_parse(example, next) {

  if (!example.text) return next()

  var params = parse(example.text)

  if (params) {
    example.http = params
    example.title = params.title
  }

  next()
}
