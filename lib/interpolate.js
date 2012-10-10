var debug = require('debug')('literapi:interpolate')

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

  options = options || {}

  var json = options.json
    , patterns = options.patterns || ['[%]']
    , raw_patterns = options.raw_patterns || ['{{%}}']

  function replace(pattern, key, json) {
    var val = context[key]
      , re = makePattern(pattern, key)
    if (json) val = JSON.stringify(val)
    template = template.replace(re, val)
  }

  // escape special regex characters and insert key name
  function makePattern(pattern, key) {
    return new RegExp(regexSafe(pattern).replace('%', key), 'g')
  }

  for (var key in context) {
    if (!context.hasOwnProperty(key)) continue

    patterns.forEach(function(pattern) {
      replace(pattern, key, json)
    })

    raw_patterns.forEach(function(pattern) {
      replace(pattern, key)
    })
  }

  return template
}

interpolate.match = function match(string, template, context, options) {

  template = regexSafe(interpolate(template, context, options))

  options = options || {}

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

  variables.forEach(function(name, i) {
    bindings[name] = match[i + 1]
  })
  return bindings
}

module.exports = interpolate

