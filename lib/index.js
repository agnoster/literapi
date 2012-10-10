// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var fs = require('fs')
  , async = require('async')
  , debug = require('debug')('literapi')
  , path = require('path')

var levelName = ["books", "documents", "examples"]
var levelIdx = levelName.reduce(function(acc, name, i){
  acc[name] = i
  return acc
}, {})

function LiterAPI(options) {
  this.options = options
  this.stack = []
  this.book = { documents: [], literapi: this }
}

LiterAPI.prototype = {}

function plugin_min_level(plugin){
  for (var i = 0; i < levelName.length; i++) {
    if (plugin.hasOwnProperty(levelName[i])) return i
  }
}

LiterAPI.prototype.use = function use(plugin) {
  debug("use", plugin)
  this.stack.push(plugin)
  plugin.min_level = plugin_min_level(plugin)
  return this
}

LiterAPI.prototype.run = function run(cb) {
  this.runBook(this.book, cb)
}

LiterAPI.prototype.runBook = function runBook(book, cb) {
  debug('runBook', book)

  async.forEachSeries(book.documents, function (doc, cb) {
    doc.book = book
    doc.context = {}
    this.runLevel(levelIdx["documents"], 0, doc, cb)
  }.bind(this), cb)
}

LiterAPI.prototype.runLevel = function runLevel(level, layer, el, cb) {
  var lname = levelName[level]
  debug('runLevel', level, lname, layer, el)

  var self = this

  function next(err) {
    var plugin = self.stack[layer]

    debug("next", layer, plugin)

    // No more plugins to run
    if (!plugin || plugin.min_level < level) {
      debug('no more plugins (at this level)', level, layer)
      return cb(err, layer)
    }

    // Errors pop right up
    if (err) {
      cb(err)
    }

    try {
      if (plugin.min_level == level) {
        // Keep processing at this level
        layer++
        plugin[lname](el, next)
      } else {
        // Move one level up
        debug("up", level, plugin.min_level)
        async.mapSeries(el[levelName[level + 1]], function(el, cb) {
          self.runLevel(level + 1, layer, el, cb)
        }, function(err, results) {
          layer = results[0]
          debug("Moved back to level", level, "at layer", layer)
          next(err)
        })
      }
    } catch (err) {
      debug("Caught error", err)
      next(err)
    }
  }

  next()
}

LiterAPI.prototype.runWithFiles = function runWithFiles(files, cb) {
  debug('runWithFiles', files)
  files.forEach(function(file) {
    this.book.documents.push({
      filename: file
    })
  }.bind(this))

  return this.run(cb)
}

function literapi(options) {
  return new LiterAPI(options)
}

literapi.withDefaultPlugins = function (options) {
  return (literapi(options)
    .use(literapi.readfile)
    .use(literapi.markdown)
    .use(literapi.debug)
    .use(literapi.markdown_output))
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
fs.readdirSync(__dirname + '/plugins').forEach(function(filename){
  if (!/\.js$/.test(filename)) return
  var name = path.basename(filename, '.js')
  function load(){ return require('./plugins/' + name) }
  literapi.plugins.__defineGetter__(name, load)
  literapi.__defineGetter__(name, load)
})

module.exports = literapi
