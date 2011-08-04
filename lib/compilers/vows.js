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

vowsCompiler.prototype.jsonCompare = function(sample, example, path) {
    var ok = true
    path = path || '/'

    function test(a, b, message) {
        assert.equal(a, b, "At key '" + path + "': expected " + a + ", got " + b)
    }

    if ('object' == typeof example && example) {
        if (example.hasOwnProperty('$WA CAPTURE')) {
            if (example['$WA CAPTURE'])
                this.vars[example['$WA CAPTURE']] = sample
        } else {
            test(typeof example, typeof sample)
            var globbing = false
            if (example['$WA GLOB']) {
                delete example['$WA GLOB']
                globbing = true
            }

            for (var key in example) {
                if (!example.hasOwnProperty(key)) continue
                assert.ok(sample.hasOwnProperty(key), "At " + path + ", key '" + key + "' not found")
                this.jsonCompare(sample[key], example[key], path + '/' + key)
            }
            if (!globbing) {
                for (var key in sample) {
                    if (!sample.hasOwnProperty(key)) continue
                    assert.ok(example.hasOwnProperty(key), "At " + path + ", unexpected key \"" + key + "\": " + JSON.stringify(sample[key]) )
                }
            }
        }
    } else {
        test(typeof example, typeof sample)
        test(example, sample)
    }
}

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
        batch[key + ": " + headers[key]] = function(error, result) {
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
    }

    if (params.body) {
        batch[params.body.replace(/\s+/g, " ")] = function(error, result) {
            var pattern = self.substitute(params.body, true), body
            pattern = pattern.replace(/".*?[^\\"]"/g, escapeString)
            pattern = pattern.replace(/\*/g, '{ "$WA CAPTURE": false }')
            pattern = pattern.replace(/\.\.\./g, '"$WA GLOB": true')
            pattern = pattern.replace(captureRE, '{ "$WA CAPTURE": "$1" }')
            try {
                pattern = JSON.parse(pattern)
            } catch(e) {
                assert.equal(result.body, params.body)
            }
            assert.notEqual(result.body, '', "No body returned")
            assert.doesNotThrow(function(){ body = JSON.parse(result.body) }, SyntaxError, "Response was not JSON: " + result.body)
            self.jsonCompare(JSON.parse(result.body), pattern)
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


