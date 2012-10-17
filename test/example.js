var server = require('./example/server')
  , literapi = require('../lib')

var port = 74000 + Math.floor(Math.random() * 1000)

server.listen(port)

console.log('listing on port', port)

setTimeout(function(){
  literapi.withDefaultPlugins({ root: "http://localhost:" + port })
    .runWithFiles(['test/example/README.md'], function(err) {
      server.close()
      if (err) throw err
  })
}, 1000)
