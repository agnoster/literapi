var fs = require('fs')

var WunderAPI = function(options) {
    if ('string' == typeof options) options = { root: options }
    if (!options.compiler) options.compiler = 'vows'
    if (!options.parser) options.parser = 'markdown'
    this.options = options

    this.compiler = new (require('./compilers/' + options.compiler))(options)
    this.parser =   new (require('./parsers/'   + options.parser))  (options)
}

WunderAPI.getVersion = function() {
    var packageFile = require('path').resolve(__filename, '../../package.json')
    return JSON.parse(fs.readFileSync(packageFile)).version
}

WunderAPI.prototype = {}

WunderAPI.prototype.parse = function(src) {
    return this.parser.parse(src)
}

WunderAPI.prototype.compile = function(parsed) {
    return this.compiler.compile(parsed)
}

WunderAPI.prototype.callback = function(name, cb) {
    var self = this
    return function(err, result) {
        if (err) return cb(err)

        try {
            return cb(null, self[name](result))
        } catch (e) {
            return cb(e)
        }
    }
}

WunderAPI.prototype.parseFile = function(filename, cb) {
    fs.readFile(filename, 'utf8', this.callback('parse', cb))
}

WunderAPI.prototype.compileFile = function(filename, cb) {
    this.parseFile(filename, this.callback('compile', cb))
}

module.exports = WunderAPI
