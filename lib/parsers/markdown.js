var markdownstream = require('markdownstream')
  , ParseResult = require('./ParseResult.js')

function parse(markdown) {
    var tokens = markdownstream.sync(markdown)
      , result = new ParseResult()
      , block = ''
      , token, i, testname = ''

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i]

        if (token.type == 'heading' && !result.title)
            result.setTitle(token.content)

        if (token.type == 'code_block') {
            block += token.content + "\n\n"
        } else {
            if (block) {
                // flush
                result.addBlock(block)
                block = ''
            }
            if (token.type == 'heading')
                result.lastText = token.content
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
