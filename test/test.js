var server = require('./server')
  , wunderapi = require('wunderapi')

var port = 74123
wunderapi.setRoot("http://localhost:" + port)

server.listen(port)
wunderapi.runFile('test/sample.md', function(err, vows) {
    if (err) throw(err)

    vows.reporter = require('vows/lib/vows/reporters/spec')
    vows.run(null, function(results) {
        server.close()
    })
})