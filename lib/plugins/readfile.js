var fs = require('fs')
  , debug = require('debug')('literapi:plugin:readfile')

/**
 * readfile is a document plugin that reads the file given in doc.filename and saves
 * the contents as doc.text
 */
module.exports.document = function(doc, next) {
  // Need a filename to load
  if (!doc.filename) return next()

  debug('reading file', doc.filename)
  fs.readFile(doc.filename, 'utf8', function(err, text) {
    if (err) return next(err)

    debug('file read.')
    doc.text = text
    next()
  })
}
