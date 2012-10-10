// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var Markdownstream = require('markdownstream')
  , debug = require('debug')('literapi:plugin:markdown_output')

module.exports.documents = function markdown_output(doc, next) {
  doc.text = doc.markdown.parsed.join('')
  debug("Created markdown output", doc.text)
  next()
}
