var fs = require('fs')

var LiterAPI = function(options) {
    if ('string' == typeof options) options = { root: options }
    if (!options.compiler) options.compiler = 'vows'
    if (!options.parser) options.parser = 'markdown'
    this.options = options

    this.compiler = new (require('./compilers/' + options.compiler))(options)
    this.parser =   new (require('./parsers/'   + options.parser))  (options)
}

LiterAPI.getVersion = function() {
    var packageFile = require('path').resolve(__filename, '../../package.json')
    return JSON.parse(fs.readFileSync(packageFile)).version
}

LiterAPI.prototype = {}

LiterAPI.prototype.parse = function(src, cb) {
    return this.parser.parse(src, cb)
}

LiterAPI.prototype.compile = function(parsed, cb) {
    return this.compiler.compile(parsed, cb)
}

LiterAPI.prototype.parseFile = function(filename, cb) {
    fs.readFile(filename, 'utf8', function(err, src) {
      if (err) cb(err)
      this.parse(src, cb)
    }.bind(this))
}

LiterAPI.prototype.compileFile = function(filename, cb) {
    this.parseFile(filename, function(err, parsed) {
      if (err) cb(err)
      this.compile(parsed, cb)
    }.bind(this))
}

module.exports = LiterAPI
