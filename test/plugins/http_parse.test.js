var gently = global.GENTLY = new (require('gently'))
  , http_parse = require('../../lib/plugins/http_parse').examples
  , should = require('should')

describe("http_parse plugin", function() {
  it("parses http requests", function(done) {

    var example = { text: "POST /hello\nContent-type: text/plain\n\nHello World" }

    http_parse(example, function(err) {
      should.not.exist(err)
      example.http.should.eql(
        { method: 'POST'
        , path: '/hello'
        , headers: { 'content-type': 'text/plain' }
        , body: "Hello World"
        , request: true
        , title: 'POST /hello'
        })
      done()
    })
  })

  it("parses http responses", function(done) {

    var example = { text: "200 OK\nContent-type: text/plain\n\nHello World" }

    http_parse(example, function(err) {
      should.not.exist(err)
      example.http.should.eql(
        { code: 200
        , statusText: 'OK'
        , headers: { 'content-type': 'text/plain' }
        , body: "Hello World"
        , response: true
        , title: '200 OK'
        })
      done()
    })
  })

  it("silently ignores something that doesn't look like http", function(done) {

    var example = { text: 'HELLO /world, are you there?' }

    http_parse(example, function(err) {
      should.not.exist(err)
      should.not.exist(example.http)
      done()
    })
  })

  it("skips the example if no text given", function(done) {

    var example = {}

    http_parse(example, function(err) {
      should.not.exist(err)
      should.not.exist(example.http)
      done()
    })
  })
})

