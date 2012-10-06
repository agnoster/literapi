var request = require('request')

var requestRegex = /^(GET|PUT|POST|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S*)/
var responseRegex = /^([1-5]\d\d)\s*(.+)?\n/

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

function call(doc, params, cb) {

  var options =
  { uri: doc.root + doc.substitute(params.path)
  , method: params.method
  , headers: convertHeaders(doc, params.headers, true)
  }

  if (params.body) options.body = doc.substitute(params.body, true)
  else options.headers['content-length'] = 0

  request(options, function (error, response, body) {
    if (delay) setTimeout(function(){ cb(error, response) }, delay)
    else cb(error, response)
  })
}

function http(block, doc, next) {

  var params = parse(block.text)

  if (params.request) {
    next()
  } else if (params.response) {
    next()
  } else {
    next()
  }
}

module.exports = function () {
  return http
}
