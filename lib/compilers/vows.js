var request = require('request')
  , assert = require('assert')
  , vows = require('vows')
  , captureRE = /\[([A-Z_]+)\]/g

function vowsCompiler(options) {
    this.options = options
    this.root = options.root
    this.vars = {}
}

vowsCompiler.prototype = {}

vowsCompiler.prototype.call = function (params) {
    var self = this
    return function() {
        var cb = this.callback
          , options =
            { uri: self.root + self.substitute(params.path)
            , method: params.method
            , headers: self.convertRequestHeaders(params.headers, true)
            }

        if (params.body) options.body = self.substitute(params.body, true)
        else options.headers['content-length'] = 0

        request(options, function (error, response, body) {
            cb(error, response)
        })
    }
}

vowsCompiler.prototype.substitute = function(string, json) {
    for (var key in this.vars) {
        if (!this.vars.hasOwnProperty(key)) continue
        if (json)
            string = string.replace('[' + key + ']', JSON.stringify(this.vars[key]))
        else
            string = string.replace('[' + key + ']', this.vars[key])
    }
    return string
}

vowsCompiler.prototype.convertRequestHeaders = function(arr, sub) {
    var headers = {}, match

    for (var i = 0; i < arr.length; i++) {
        if (!(match = /([^:]+):[ \t]+(.*)/.exec(arr[i]))) continue
        
        if (sub)
            headers[match[1].toLowerCase()] = this.substitute(match[2])
        else
            headers[match[1].toLowerCase()] = match[2]
    }

    return headers
}

vowsCompiler.prototype.headerCapture = function(string) {
    var captures = []
      , regex = string.replace(captureRE, function(m, name) { captures.push(name); return '(.*)' })

    if (captures.length > 0) return { regex: new RegExp(regex, 'g'), captures: captures }
}

function mergeCaptures(current, next) {
    for (var key in next) {
        if (!next.hasOwnProperty(key)) continue
        if (current.hasOwnProperty(key))
            assert.equal(current[key], next[key], "Got mismatching results for capture [" + key + "]")

        current[key] = next[key]
    }
    return current
}

vowsCompiler.prototype.jsonCompare = function(sample, example, path) {
    var captures = {}

    path = path || '/'

    function test(a, b, message) {
        assert.equal(a, b, "At key '" + path + "': expected " + a + ", got " + b)
    }

    if ('object' == typeof example && example) {
        if (specials(example).capture) {
            captures[specials(example).capture] = sample
        } else if (specials(example).any) {
            // anything will do
        } else {
            test(typeof example, typeof sample)

            var globbing = false
            if (specials(example).glob) {
                delete example[specials.glob]
                globbing = true
            }

            assert.ok(sample, "Got null at " + path)
            assert.equal(sample.constructor, example.constructor, "Not the same type")

            for (var key in example) {
                if (!example.hasOwnProperty(key)) continue
                assert.ok(sample.hasOwnProperty(key), "At " + path + ", key '" + key + "' not found")
                var newCaptures = this.jsonCompare(sample[key], example[key], path + '/' + key)
                mergeCaptures(captures, newCaptures)
            }

            if (!globbing) {
                for (var key in sample) {
                    if (!sample.hasOwnProperty(key)) continue
                    assert.ok(example.hasOwnProperty(key), "At " + path + ", unexpected key \"" + key + "\": " + JSON.stringify(sample[key]) )
                }
            }
        }
    } else { // non-objects
        test(typeof example, typeof sample)
        test(example, sample)
    }
    return captures
}

var specials = function(obj) {
    var opts = {}

    if (obj.hasOwnProperty(specials.glob))    opts.glob    = obj[specials.glob]
    if (obj.hasOwnProperty(specials.capture)) opts.capture = obj[specials.capture]
    if (obj.hasOwnProperty(specials.any))     opts.any     = obj[specials.any]

    return opts
}

specials.glob    = "$ wunderapi GLOB     ..."
specials.capture = "$ wunderapi CAPTURE  var"
specials.any     = "$ wunderapi ANY      *"

function unicode(str) {
    var output = '', code
    for (var i = 0; i < str.length; i++) {
        code = str.charCodeAt(i).toString(16)
        while (code.length < 4) code = '0' + code
        output += '\\u' + code
    }
    return output
}

function escapeString(string) {
    return string.replace(/(\*|\.\.\.|\[)/, unicode)
}

vowsCompiler.prototype.matchers = function (batch, params) {
    var self = this

    batch[params.label] = function(error, result) {
        assert.equal(result.statusCode, params.code, "Got status code: " + result.statusCode)
    }

    var headers = self.convertRequestHeaders(params.headers)
    for (var key in headers) {
        batch[key + ": " + headers[key]] = function(key) {
            return function(error, result) {
                var pattern, header = self.substitute(headers[key])
                if (pattern = self.headerCapture(header)) {
                    assert.ok(result.headers[key], "Header should exist, but doesn't")
                    var match = pattern.regex.exec(result.headers[key])
                    assert.ok(match, "Header did not match pattern")
                    for (var i = 0; i < pattern.captures.length; i++) {
                        assert.ok(match[i], pattern.captures.length, "Header did not match all patterns")
                        self.vars[pattern.captures[i]] = match[i + 1]
                    }
                } else {
                    assert.equal(result.headers[key], headers[key])
                }
            }
        }(key)
    }

    if (params.body) {
        batch[params.body.replace(/\s+/g, " ")] = function(error, result) {
            var pattern = self.substitute(params.body, true), body
            pattern = pattern.replace(/".*?[^\\"]"/g, escapeString)
            pattern = pattern.replace(/\*/g,     '{ "' + specials.any     + '": true }')
            pattern = pattern.replace(/\.\.\./g,   '"' + specials.glob    + '": true')
            pattern = pattern.replace(captureRE, '{ "' + specials.capture + '": "$1" }')
            try {
                pattern = JSON.parse(pattern)
            } catch(e) {
                assert.equal(result.body, params.body)
            }
            assert.notEqual(result.body, '', "No body returned")
            assert.doesNotThrow(function(){ body = JSON.parse(result.body) }, SyntaxError, "Response was not JSON: " + result.body)
            try {
                var captures = self.jsonCompare(body, pattern)
                mergeCaptures(self.vars, captures)
            } catch (e) {
                e.message += ", got: \n        " + result.body
                throw(e);
            }
        }
    } else {
        batch["Empty response body"] = function(error, result) {
            assert.equal(result.body, '', "Body should be empty")
        }
    }
}

vowsCompiler.prototype.makeBatch = function (test) {
    var batch = {}, topic = {}

    batch[test.req.label] = topic = { topic: this.call(test.req) }
    if (test.resp)
        this.matchers(topic, test.resp);
    else
        topic['done'] = function(err, result) { assert.ok(result) }

    return batch;
}

vowsCompiler.prototype.compile = function (results) {
    var suite = vows.describe(results.title)

    for (var i = 0; i < results.tests.length; i++) {
        suite.addBatch(this.makeBatch(results.tests[i]))
    }

    return suite
}

module.exports = vowsCompiler


