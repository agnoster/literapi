var request = require('request')
  , assert = require('assert')
  , vows = require('vows')
  , JSONExp = require('../jsonexp')
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
        var re = new RegExp('\\[' + key + '\\]', 'g')
        if (json)
            string = string.replace(re, JSON.stringify(this.vars[key]))
        else
            string = string.replace(re, this.vars[key])

    }
    if (json) {
        var match;
        if (match = captureRE.exec(string)) {
            console.log("WARNING: Possible unrecognized capture: " + match[0])
            console.log("      -> " + string)
        }

        try {
            JSON.parse(string)
        } catch (e) {
            console.log("WARNING: Malformed JSON: " + string)
            console.log(e)
        }

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
            try {
                var exp = new JSONExp(params.body)
            } catch (e) {
                // invalid JSONExp
                console.log("Failed to compile params: ", e)
                assert.equal(result.body, params.body)
                return
            }

            assert.notEqual(result.body, '', "No body returned")

            assert.doesNotThrow(function(){
                    body = JSON.parse(result.body)
                }, SyntaxError, "Response was not JSON: " + result.body)

            try {
                var match = exp.assert(body, { namespace: self.vars, merge: true })
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


