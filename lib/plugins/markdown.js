// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var Markdownstream = require('markdownstream')
  , debug = require('debug')('literapi:plugin:markdown')

function parse(markdown, cb) {

    var stream = new Markdownstream
      , tokens = []

    stream.on('error', function(err) {
      cb(err)
    })

    stream.on('data', function(token) {
      tokens.push(token)
    })

    stream.on('end', function() {
      cb(null, tokens)
    })

    stream.end(markdown)
}

function examples(tokens) {

  var examples = []

  tokens.forEach(function(token) {
    if (token.type == 'code_block') {
      tags = token.tags || ''
      examples.push(
        { text: token.content
        , pending: !!tags.match(/\bpending\b/)
        , markdown: { token: token }
      })
    }
  })

  return examples
}

module.exports.document = function(doc, next) {
  debug('parsing text')
  parse(doc.text, function(err, parsed) {
    if (err) return next(err)

    debug('parsed:', parsed)
    doc.markdown = { parsed: parsed }
    doc.examples = examples(parsed)
    debug('examples:', doc.examples)

    next()
  })
}
