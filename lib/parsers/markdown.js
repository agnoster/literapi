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

        if (token.type == 'block') {
            block += token.text + "\n\n"
        } else {
            if (block) {
                // flush
                result.addBlock(block)
                block = ''
            }
            result.lastText = token.text
        }
    }
    if (block) result.addBlock(block)

    return result
}

module.exports.parse = parse
