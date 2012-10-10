// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var interpolate = require('../interpolate')
  , JSONExp = require('jsonexp')
  , should = require('should')
  , debug = require('debug')('literapi:plugin:http:match_response')

function http_match_response(example, next) {

  // Doesn't look like a response block
  if (!example.http || !example.http.response) return next()

  // There's no current response to compare to
  if (!example.context.response) return next()

  debug('Entering plugin', example)

  function assert(label, test) {
    debug('assert', label)
    try {
      test()
      debug('succeeded')
      example.ok = example.ok || []
      example.ok.push({ label: label })
    } catch(e) {
      debug('failed: ', e)
      example.fail = example.fail || []
      example.fail.push({ label: label, error: e })
    }
  }

  //vowsCompiler.prototype.matchers = function (params) {
  function assertBodyMatches(actual, expected, context) {
    var exp
    try { exp = new JSONExp(expected) } catch (e) {}

    if (exp) {
      assert("Body matches JSONExp: " + expected.replace(/\s+/g, " "), function() {

        should.notEqual(actual, '', "No body returned")

        var parsed = JSON.parse(actual)
        exp.assert(parsed, { namespace: context, merge: true })
      })
    } else {
      debug("Failed to compile expression, treating as raw text", e)

      assert("Body matches text: " + expected.replace(/\s+/g, " "), function() {
        should.equal(actual, expected)
      })
    }
  }

  /**
   * Internal: interpolate the values from `context` into the `params` struct
   */
  function checkResponse(actual, expected, context) {

    debug('Checking response, expecting:', expected)

    assert(expected.title, function() {
      actual.statusCode.should.equal(expected.code)
    })

    for (var key in expected.headers) {
      var val = expected.headers[key]
      assert(key + ': ' + val, function() {
        actual.headers.should.have.property(key)
        should.ok(interpolate.match(actual.headers[key], val, context))
      })
    }

    if (expected.body) {
      assertBodyMatches(actual.body, expected.body, context)
    } else {
      assert('No content', function() {
        actual.body.should.be.empty
      })
    }
  }

  checkResponse(example.context.response, example.http, context)
  next()
}

module.exports.examples = http_match_response
