var Markdownstream = require('markdownstream')
  , ParseResult = require('./ParseResult.js')

function parse(markdown, cb) {
    var tokens = []
      , stream = new Markdownstream
      , result = new ParseResult()
      , block = ''
      , token, last_code, i, testname = ''

    stream.on('data', function(token) {

      tokens.push(token)

      if (token.type == 'heading' && !result.title)
        result.setTitle(token.content)

      if (token.type == 'code_block') {
        block += token.content + "\n\n"
        last_code = token
      } else {
        if (block) {
          // flush
          result.addBlock(block, last_code)
          block = ''
        }
        if (token.type == 'heading')
          result.lastText = token.content
      }
    })

    stream.on('end', function() {

      if (block) result.addBlock(block, last_code)

      result.tokens = tokens
      cb(null, result)
    })

    stream.write(markdown)
    stream.end()
}

function markdownParser(options) {
    this.options = options
    this.parse = parse
}

module.exports = markdownParser
