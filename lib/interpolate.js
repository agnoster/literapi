var debug = require('debug')('literapi:interpolate')
  , _ = require('underscore')

function regexSafe(string) {
  return string.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
}

/**
 * Internal: interpolate values, like templating
 *
 * template - a String template to interpolate into
 * context - an Object of variable bindings
 * json - a Boolean, whether to interpret the template as JSON
 *
 * Returns a String
 */
function interpolate(template, context, options) {

  template = template || ''
  options = options || {}
  context = context || {}

  var json = options.json
    , patterns = options.patterns || ['[%]']
    , raw_patterns = options.raw_patterns || ['{{%}}']

  function replace(pattern, key, json) {
    var val = context[key]
      , re = makePattern(pattern, key)

    template = template.replace(re, function() {
      return json ? JSON.stringify(val) : val
    })
  }

  // escape special regex characters and insert key name
  function makePattern(pattern, key) {
    return new RegExp(regexSafe(pattern).replace('%', key), 'g')
  }

  for (var key in context) {
    if (!context.hasOwnProperty(key)) continue

    _.each(patterns, function(pattern) {
      replace(pattern, key, json)
    })

    _.each(raw_patterns, function(pattern) {
      replace(pattern, key)
    })
  }

  return template
}

interpolate.match = function match(string, template, context, options) {

  template = regexSafe(interpolate(template, context, options))

  options = options || {}
  context = context || {}

  var patterns = options.patterns || ['[%]', '{{%}}']

  var captureRE = new RegExp(patterns.map(function(pattern) {
    return regexSafe(regexSafe(pattern)).replace('%', '(.*?)')
  }).join('|'), 'g')

  var variables = []
  template = template.replace(captureRE, function() {
    var name
    for (var i = 1; i < arguments.length && !name; i++) {
      name = arguments[i]
    }
    var idx = variables.indexOf(name) + 1
    if (idx) {
      return '\\' + idx
    } else {
      variables.push(name)
      return '(.*)'
    }
  })

  template = new RegExp('^' + template + '$')

  var bindings = context
  if (options.hasOwnProperty('merge') && !options.merge) bindings = {}

  var match = template.exec(string)
  if (!match) return

  _.each(variables, function(name, i) {
    bindings[name] = match[i + 1]
  })
  return bindings
}

module.exports = interpolate

