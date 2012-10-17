// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var fs = require('fs')
  , debug = require('debug')('literapi')
  , path = require('path')
  , plugins = require('./plugins')
  , types = require('./types')
  , _ = require('underscore')

function LiterAPI(options) {
  this.options = options
  this.stack = []
  this.book = new types.book
}

LiterAPI.prototype = {}

LiterAPI.prototype.use = plugins.use

LiterAPI.prototype.run = function run(cb) {
  debug('Running plugin stack')
  plugins.run(this.stack, 0, 0, this.book, cb)
}

LiterAPI.prototype.runWithFiles = function runWithFiles(files, cb) {
  debug('runWithFiles', files)
  _.each(files, function(file) {
    this.book.addDocument({
      filename: file,
      title: file
    })
  }, this)

  return this.run(cb)
}

function literapi(options) {
  return new LiterAPI(options)
}

literapi.withDefaultPlugins = function (options) {
  var l = literapi(options)
  l.use(
    [ literapi.readfile
    , literapi.markdown_parse
    , literapi.http_parse
    , literapi.http_request({ root: options.root })
    , literapi.http_match_response
    //, literapi.default_reporter({ verbose: true })
    , literapi.mocha_reporter(options.reporter || 'dot')
    ])

  if (options.write) {
    l.use(literapi.markdown_serialize)
    l.use(literapi.writefile())
  }

  return l
}

literapi.__defineGetter__('version', function() {
  if (!LiterAPI.version) {
    var packageFile = require('path').resolve(__filename, '../../package.json')
    LiterAPI.version = JSON.parse(fs.readFileSync(packageFile)).version
  }
  return LiterAPI.version
})

literapi.plugins = {}

/**
 * Auto-load bundled plugins with getters.
 *
 * Adapted from [connect by TJ Holowaychuck]
 * https://github.com/senchalabs/connect/blob/master/lib/connect.js
 */
_.each(fs.readdirSync(__dirname + '/plugins'), function(filename){
  if (!/\.js$/.test(filename)) return
  var name = path.basename(filename, '.js')
  function load(){ return require('./plugins/' + name) }
  literapi.plugins.__defineGetter__(name, load)
  literapi.__defineGetter__(name, load)
})

module.exports = literapi
