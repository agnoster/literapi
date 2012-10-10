var server = require('./example/server')
  , literapi = require('../lib')

var port = 74123

server.listen(port)

literapi.withDefaultPlugins({ root: "http://localhost:" + port })
  .runWithFiles(['test/example/README.md'], function(err) {

    console.log('finito', arguments)

    if (err) throw err
    server.close()
})
