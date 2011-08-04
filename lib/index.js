var markdownParser = require('./parsers/markdown.js')
  , fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , vowsCompiler = require('./compilers/vows.js')

var wunderapi = {}

wunderapi.getVersion = function() {
    var packageFile = require('path').resolve(__filename, '../../package.json')
    return JSON.parse(fs.readFileSync(packageFile)).version
}

wunderapi.parse = function(src) {
    return markdownParser.parse(src)
}

wunderapi.parseFile = function(filename, cb) {
    fs.readFile(filename, 'utf8', function(err, result) {
        if (err) return cb(err)
        try {
            return cb(null, markdownParser.parse(result))
        } catch (e) {
            return cb(e)
        }
    })
}

wunderapi.runFile = function(filename, cb) {
    wunderapi.parseFile(filename, function(err, test) {
        if (err) return cb(err)

        try {
            var suite = vowsCompiler.compile(test)
            return cb(null, suite)
        } catch (e) {
            return cb(e)
        }
    })
}

wunderapi.setRoot = function(url) {
    vowsCompiler.root = url
}

module.exports = wunderapi
