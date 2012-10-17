// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var Markdownstream = require('markdownstream')
  , debug = require('debug')('literapi:plugin:markdown:serialize')

function markdown_serialize_example(example, next) {
  if (!example.pending && example.tests.length) {
    example.markdown.token.tags = example.fail ? 'fail' : 'ok'
    example.markdown.token.refresh()
  }
  next()
}

function markdown_serialize_document(doc, next) {
  doc.text = doc.markdown.parsed.join('')
  debug("Created markdown output", doc.text)
  next()
}

module.exports =
[ { examples: markdown_serialize_example }
, { documents: markdown_serialize_document }
]
