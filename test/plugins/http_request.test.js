var gently = global.GENTLY = new (require('gently'))
  , http_request = require('../../lib/plugins/http_request')
  , should = require('should')
  , request = require('request')

describe("http_request plugin", function() {
  var example
  var plugin

  beforeEach(function(){
    example =
      { http:
        { method: 'POST'
        , path: '/hello'
        , headers: { 'content-type': 'application/json' }
        , body: '{ "hello": "world" }'
        , request: true
        }
      }

    plugin = http_request({ root: "http://localhost" }).examples
  })

  it("sends requests correctly", function(done) {

    gently.expect(request, 'make', function(options, cb) {
      options.should.eql(
        { uri: "http://localhost/hello"
        , method: 'POST'
        , headers: { 'content-type': 'application/json' }
        , body: '{ "hello": "world" }'
        })
      cb(null, "RESPONSE")
    })

    plugin(example, function(err) {
      should.not.exist(err)
      example.response.should.eql("RESPONSE")
      done()
    })
  })

  it("interpolates context", function(done) {

    example.context = { id: 2, auth: "sesame", name: "world" }
    example.http.path = '/hello/[id]'
    example.http.headers.authorization = 'Bearer [auth]'
    example.http.headers['content-type'] = 'application/json'
    example.http.body = '{ "hello": [name] }'

    gently.expect(request, 'make', function(options, cb) {
      options.should.eql(
        { uri: "http://localhost/hello/2"
        , method: 'POST'
        , headers:
          { 'content-type': 'application/json'
          , 'authorization': 'Bearer sesame'
          }
        , body: '{ "hello": "world" }'
        })
      cb(null, "RESPONSE")
    })

    plugin(example, function(err) {
      should.not.exist(err)
      example.response.should.eql("RESPONSE")
      done()
    })
  })

  it("ignores examples with no http request", function(done) {

    example.http.request = false

    gently.expect(request, 'make', 0, function(options, cb) {
      should.not.exist("We should never get here")
    })

    plugin(example, function(err) {
      should.not.exist(err)
      should.not.exist(example.response)
      done()
    })

  })
})
