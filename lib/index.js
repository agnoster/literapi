var fs = require('fs')
  , async = require('async')
  , debug = require('debug')('literapi')
  , path = require('path')

function LiterAPI(options) {
  this.options = options
  this.stack = []
  this.book = { documents: [], literapi: this }
}

LiterAPI.prototype = {}

LiterAPI.prototype.use = function use(plugin) {
  this.stack.push(plugin)
  return this
}

LiterAPI.prototype.run = function run(cb) {
  this.runBook(this.book, cb)
}

LiterAPI.prototype.runBook = function runBook(book, cb) {
  debug('runBook', book)

  async.mapSeries(book.documents, function (doc, cb) {
    doc.book = book
    this.runDocument(doc, cb)
  }.bind(this), cb)
}

LiterAPI.prototype.runDocument = function runDocument(doc, cb) {
  debug('runDocument', doc)

  var stack = this.stack
    , layer = 0

  function next(err) {
    var plugin = stack[layer++]

    // No more plugins to run
    if (!plugin) {
      debug('no more plugins', layer)
      return cb(err, doc)
    }

    if (err) {
      next(err)
    } else {
      try {
        plugin.document(doc, next)
      } catch (e) {
        next(err)
      }
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
  return literapi(options).use(literapi.readfile).use(literapi.markdown)
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
