var request = require('request')
  , vows = require('vows')
  , assert = require('assert')
  , captureRE = /\[([A-Z_]+)\]/g

function convertRequestHeaders(arr, sub) {
    var headers = {}, match

    for (var i = 0; i < arr.length; i++) {
        if (!(match = /([^:]+):[ \t]+(.*)/.exec(arr[i]))) continue
        
        if (sub)
            headers[match[1].toLowerCase()] = substitute(match[2])
        else
            headers[match[1].toLowerCase()] = match[2]
    }

    return headers
}

var api = {}

api.vars = {}

api.call = function (params) {
   return function() {
        var self = this
          , options =
            { uri: api.root + substitute(params.path)
            , method: params.method
            , headers: convertRequestHeaders(params.headers, true)
            }

        if (params.body) options.body = substitute(params.body, true)
 
        request(options, function (error, response, body) {
            self.callback(error, response)
        })
    }
}

function substitute(string, json) {
    for (var key in api.vars) {
        if (!api.vars.hasOwnProperty(key)) continue
        if (json)
            string = string.replace('[' + key + ']', JSON.stringify(api.vars[key]))
        else
            string = string.replace('[' + key + ']', api.vars[key])
    }
    return string
}

function headerCapture(string) {
    var captures = []
      , regex = string.replace(captureRE, function(m, name) { captures.push(name); return '(.*)' })

    if (captures.length > 0) return { regex: new RegExp(regex, 'g'), captures: captures }
}

function jsonCompare(sample, example, path) {
    var ok = true
    path = path || []

    function test(a, b, message) {
        assert.equal(a, b, "At key " + path.join('.') + ": expected " + a + ", got " + b)
    }

    if ('object' == typeof example && example) {
        if (example.hasOwnProperty('$CAPTURE')) {
            if (example.$CAPTURE)
                api.vars[example.$CAPTURE] = sample
        } else {
            test(typeof example, typeof sample)

            for (var key in example) {
                if (!example.hasOwnProperty(key)) continue
                jsonCompare(sample[key], example[key], path.concat(key))
            }
        }
    } else {
        test(typeof example, typeof sample)
        test(example, sample)
    }
}

api.matchers = function (batch, params) {
    batch[params.label] = function(error, result) {
        assert.equal(result.statusCode, params.code, "Got status code: " + result.statusCode)
    }

    var headers = convertRequestHeaders(params.headers)
    for (var key in headers) {
        batch[key + ": " + headers[key]] = function(error, result) {
            var pattern, header = substitute(headers[key])
            if (pattern = headerCapture(header)) {
                assert.ok(result.headers[key], "Header should exist, but doesn't")
                var match = pattern.regex.exec(result.headers[key])
                assert.ok(match, "Header did not match pattern")
                for (var i = 0; i < pattern.captures.length; i++) {
                    assert.ok(match[i], pattern.captures.length, "Header did not match all patterns")
                    api.vars[pattern.captures[i]] = match[i + 1]
                }
            } else {
                assert.equal(result.headers[key], headers[key])
            }
        }
    }

    if (params.body) {
        batch[params.body.replace(/\s+/g, " ")] = function(error, result) {
            var pattern = substitute(params.body, true)
            pattern = pattern.replace(captureRE, '{ "$CAPTURE": "$1" }')
            pattern = JSON.parse(pattern)

            assert.notEqual(result.body, '', "No body returned")
            jsonCompare(JSON.parse(result.body), pattern)
        }
    } else {
        batch["Empty response"] = function(error, result) {
            assert.equal(result.body, '', "Body should be empty")
        }
    }
}

api.makeBatch = function (test) {
    var batch = {}, topic = {}

    batch[test.req.label] = topic = { topic: api.call(test.req) }
    if (test.resp)
        api.matchers(topic, test.resp);
    else
        topic['done'] = function(err, result) { assert.ok(result) }

    return batch;
}

api.compile = function (results) {
    var suite = vows.describe(results.title)

    for (var i = 0; i < results.tests.length; i++) {
        suite.addBatch(api.makeBatch(results.tests[i]))
    }

    return suite
}

module.exports = api


