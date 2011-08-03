var mdparse = require('./parsers/markdown.js')
  , fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , api = require('./api')

var wunderapi = {}

wunderapi.parse = function(src) {
    return mdparse.parse(src)
}

wunderapi.parseFile = function(filename, cb) {
    fs.readFile(filename, 'utf8', function(err, result) {
        if (err) return cb(err)
        try {
            return cb(null, mdparse.parse(result))
        } catch (e) {
            return cb(e)
        }
    })
}

wunderapi.runFile = function(filename, cb) {
    wunderapi.parseFile(filename, function(err, test) {
        if (err) return cb(err)

        try {
            var src = test.compile()
            var code = eval(src)
            return cb(null, code)
        } catch (e) {
            return cb(e)
        }
    })
}

wunderapi.setRoot = function(url) {
    api.root = url
}

module.exports = wunderapi
