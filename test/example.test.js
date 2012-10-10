var server = require('./example/server')
  , literapi = require('../lib')

describe('Literapi', function() {
  var port = 74000 + Math.floor(Math.random() * 1000)

  before(function(done) {
    server.listen(port)
    setTimeout(done, 1000)
  })

  after(function() {
    server.close()
  })

  it("runs the example case succesfully", function(done){
    literapi.withDefaultPlugins({ root: "http://localhost:" + port })
      //.use(literapi.writefile({ ext: '.new' }))
      .runWithFiles(['test/example/README.md'], function(err) {
        if (err) throw err
        done()
    })
  })
})
