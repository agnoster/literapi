// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var async = require('async')
  , debug = require('debug')('literapi:plugins')

var levelName = ["books", "documents", "examples"]
var levelIdx = levelName.reduce(function(acc, name, i){
  acc[name] = i
  return acc
}, {})

function plugin_min_level(plugin){
  for (var i = 0; i < levelName.length; i++) {
    if (plugin.hasOwnProperty(levelName[i])) return i
  }
}

function run(stack, level, layer, el, cb) {

  var lname = levelName[level]
  debug('runLevel', level, lname, layer, el)

  function next(err) {
    var plugin = stack[layer]

    debug("next", layer, plugin)

    // No more plugins to run
    if (!plugin || plugin.min_level < level) {
      debug('no more plugins (at this level)', level, layer)
      return cb(err, layer)
    }

    // Errors pop right up
    if (err) return cb(err, layer)

    try {
      if (plugin.min_level == level) {
        // Keep processing at this level
        layer++
        debug('running plugin')
        plugin[lname](el, next)
      } else {
        // Move one level up
        debug("up", level, plugin.min_level)
        var map = async.mapSeries
        //if (lname == 'books') map = async.map
        map(el[levelName[level + 1]], function(child, cb) {
          run(stack, level + 1, layer, child, cb)
        }, function(err, results) {
          if (err) return cb(err)
          layer = results[0]
          debug("Moved back to level", level, "at layer", layer)
          next()
        })
      }
    } catch (err) {
      debug("Caught error", err)
      cb(err)
    }
  }

  next()
}

function init(plugin) {
  plugin.min_level = plugin_min_level(plugin)
  return plugin
}

function use(plugin) {
  if (plugin instanceof Array) {
    debug("use array", plugin)
    plugin.forEach(function(p) {
      this.use(p)
    }.bind(this))
    return
  }
  debug("use", plugin)
  this.stack.push(init(plugin))
  return this
}

module.exports =
{ run: run
, init: init
, use: use
}
