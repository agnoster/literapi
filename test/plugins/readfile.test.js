var gently = global.GENTLY = new (require('gently'))
  , readfile = require('../../lib/plugins/readfile').documents
  , should = require('should')
  , fs = require('fs')

describe("readfile plugin", function() {
  it("inserts the right content into the document", function(done) {

    var doc = { filename: 'hello.txt' }

    gently.expect(fs, 'readFile', function(filename, encoding, cb) {
      filename.should.equal(doc.filename)
      encoding.should.equal('utf8')
      cb(null, "hello world")
    })

    readfile(doc, function(err) {
      should.not.exist(err)
      doc.text.should.equal("hello world")
      done()
    })
  })

  it("propagates errors correctly", function(done) {

    var doc = { filename: 'foobar.txt' }

    gently.expect(fs, 'readFile', function(filename, encoding, cb) {
      filename.should.equal(doc.filename)
      cb("What file?")
    })

    readfile(doc, function(err) {
      err.should.equal("What file?")
      done()
    })
  })

  it("skips the document if no filename given", function(done) {

    gently.expect(fs, 'readFile', 0, function(filename, encoding, cb) {
      should.not.exist("We should never reach this")
    })

    readfile({}, function(err) {
      should.not.exist(err)
      done()
    })
  })
})
