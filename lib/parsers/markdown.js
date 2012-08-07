var marked = require('marked')
  , ParseResult = require('./ParseResult.js')

function parse(markdown) {
    var tokens = marked.lexer(markdown)
      , result = new ParseResult()
      , block = ''
      , token, i, testname = ''

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i]

        if (token.type == 'heading' && !result.title)
            result.setTitle(token.text)

        if (token.type == 'code') {
            block += token.text + "\n\n"
        } else {
            if (block) {
                // flush
                result.addBlock(block)
                block = ''
            }
            if (token.type == 'heading')
                result.lastText = token.text
        }
    }
    if (block) result.addBlock(block)

    return result
}

function markdownParser(options) {
    this.options = options
    this.parse = parse
}


module.exports = markdownParser
