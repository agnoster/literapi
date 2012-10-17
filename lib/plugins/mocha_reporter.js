var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('literapi:plugin:mocha_reporter')
  , _ = require('underscore')

function Runner() {
  this.total = 0
  this.current_doc = null
}

Runner.prototype = new EventEmitter

Runner.prototype.middleware = function() {
  return [
    { examples: this.onExample.bind(this) },
    { books: this.onBook.bind(this) }
    ]
}

Runner.prototype.onBook = function(doc, next) {
  if (this.current_doc) this.emit('suite end', doc)
  this.emit('end')
  next()
}

Runner.prototype.onExample = function(example, next) {
  if (!example.tests.length) return next()

  if (this.current_doc !== example.parent) {
    // Beginning a new document
    if (this.current_doc) {
      this.emit('suite end', this.current_doc)
    } else {
      this.emit('start')
    }
    this.current_doc = example.parent
    this.emit('suite', this.current_doc)
  }

  this.emit('suite', example)
  _.each(example.tests, function(test) {
    this.emit('test', test)

    if (test.pending) this.emit('pending', test)
    else if (test.err) this.emit('fail', test, test.err)
    else this.emit('pass', test)

    this.emit('test end', test)
  }, this)
  this.emit('suite end', example)

  next()
}

module.exports = function(reporter) {

  if (typeof reporter === 'string') reporter = require('mocha/lib/reporters/' + reporter)
  debug('reporter', reporter)

  var runner = new Runner
  reporter = new reporter(runner)

  return runner.middleware()
}
