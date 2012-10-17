// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var interpolate = require('../interpolate')
  , JSONExp = require('jsonexp')
  , assert = require('assert')
  , debug = require('debug')('literapi:plugin:http:match_response')

function http_match_response(example, next) {

  // Doesn't look like a response block
  if (!example.http || !example.http.response) return next()

  // There's no current response to compare to
  if (!example.context.response) return next()

  debug('enter')

  function addTest(title, assertion) {
    debug('addTest', title)
    var test = example.addTest({ title: title })
    try {
      assertion()
      debug('succeeded')
      test.ok()
    } catch(e) {
      debug('failed: ', e)
      example.fail = true
      test.fail(e)
    }
  }

  function assertBodyMatches(actual, expected, bindings) {
    try {
      var exp = new JSONExp(expected)
      addTest("Body matches JSONExp: " + expected.replace(/\s+/g, " "), function() {

        assert.notEqual(actual, '', "No body returned")

        try {
          var parsed = JSON.parse(actual)
        } catch(e) {
          assert.fail(actual, expected, "Could not parse JSON")
        }
        exp.assert(parsed, { namespace: bindings, merge: true })
      })
    } catch (e) {
      debug("Failed to compile expression '" + expected + "', treating as raw text", e)

      addTest("Body matches plaintext: " + expected.replace(/\s+/g, " "), function() {
        assert.equal(actual, expected)
      })
    }
  }

  /**
   * Internal: interpolate the values from `context` into the `params` struct
   */
  function checkResponse(actual, expected, bindings) {

    debug('Checking response, expecting:', expected)

    addTest(expected.title, function() {
      assert.equal(actual.statusCode, expected.code)
    })

    for (var key in expected.headers) {
      var val = expected.headers[key]
      addTest(key + ': ' + val, function() {
        assert.ok(actual.headers[key], "Header " + key + " expected, but not found")
        assert.ok(interpolate.match(actual.headers[key], val, bindings), "Expected headers to match")
      })
    }

    if (expected.body) {
      assertBodyMatches(actual.body, expected.body, bindings)
    } else {
      addTest('No body', function() {
        if (actual.body) assert.fail(actual.body, '', "Expected empty body")
      })
    }
  }

  example.title = example.context.request.title
  checkResponse(example.context.response, example.http, example.context.bindings)
  next()
}

module.exports.examples = http_match_response
