// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

var fs = require('fs')
  , debug = require('debug')('literapi:plugin:writefile')

/**
 * writefile is a document plugin that saves the the contents in doc.text to the file
 * given by doc.filename
 * the contents as doc.text
 */
module.exports = function(options){
  options = options || {}

  function writefile(doc, next) {
    // Need a filename to write to
    if (!doc.filename) return next()

    var filename = doc.filename
    if (options.ext) filename += options.ext

    debug('writing file', filename)
    fs.writeFile(filename, doc.text, 'utf8', function(err) {
      if (err) return next(err)

      debug('file written')
      next()
    })
  }

  return { "documents": writefile }
}
