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
          run(stack, level + 1, layer, el, cb)
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

function init(plugin) {
  plugin.min_level = plugin_min_level(plugin)
  return plugin
}

module.exports =
{ run: run
, init: init
}
