var debug = require('debug')('literapi:interpolate')

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
    return new RegExp(pattern
        .replace(/([.?*+^$[\]\\(){}|-])/, "\\$1")
        .replace('%', key), 'g')
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

module.exports = interpolate

