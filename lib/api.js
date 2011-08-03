var request = require('request')
  , assert = require('assert')

function convertRequestHeaders(arr) {
    // convert an array of headers to an object, with variable interpolation

    var headers = {}, match

    for (var i = 0; i < arr.length; i++) {
        if (!(match = /([^:]+):[ \t]+(.*)/.exec(arr[i]))) continue
        
        headers[match[1].toLowerCase()] = match[2]
    }

    return headers
}

var api = {}

api.call = function (params) {
    var options =
        { uri: api.root + params.path
        , method: params.method
        , headers: convertRequestHeaders(params.headers)
        }

    if (params.body) options.body = params.body

    return function() {
        var self = this

        request(options, function (error, response, body) {
            self.callback(error, response)
        })
    }
}

api.match = function (params) {
    return function(error, result) {
        assert.equal(result.statusCode, params.code, "Got status code: " + result.statusCode)
        
        if (params.body) {
            assert.notEqual(result.body, '', "No body returned")
            assert.deepEqual(JSON.parse(result.body), JSON.parse(params.body))
        } else {
            assert.equal(result.body, '', "Body should be empty")
        }

        var headers = convertRequestHeaders(params.headers)
        for (var key in headers) {
            assert.equal(result.headers[key], headers[key])
        }
    }
}

module.exports = api
