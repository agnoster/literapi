var debug = require('debug')('literapi:plugin:default_reporter')

module.exports = function(options) {
  options = options || {}
  var stream = options.stream || process.stdout

  function terse_reporter(example, next) {
    if (example.fail) stream.write('X')
    else if (example.ok) stream.write('.')
    next()
  }

  function verbose_reporter(example, next) {
    example.tests && example.tests.forEach(function(test) {
      console.log(test.status, test.title)
    })
    next()
  }

  var reporter = options.verbose ? verbose_reporter : terse_reporter

  return { examples: reporter }
}
