module.exports = function(options) {
  options = options || {}
  var stream = options.stream || process.stdout

  function progress_reporter(example, next) {
    if (example.fail) stream.write('X')
    else if (example.ok) stream.write('.')
    next()
  }

  return { examples: progress_reporter }
}
