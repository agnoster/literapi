var LiterAPI = require('literapi')
  , vows = require('vows')
  , util = require('util')
  , fs = require('fs')
  , console = require('./console')

// Return the output markup for the suite after it has been run. This will be
// used to over-write the file with the "fail" or "ok" tags for code blocks.
function markup(suite) {

  var batch, token, tags

  for (var i = 0; i < suite.batches.length; i++) {

    batch = suite.batches[i]
    token = batch.tests._token
    if (!token) continue

    token.tags = 'ok'
    if (batch.broken || batch.errored) token.tags = 'fail'
    if (batch.pending) token.tags = 'pending'

    token.refresh()
  }

  return suite.tokens.join('')
}

// Overwrite the outfile with the updated markup from the suite after it has
// been run.
function dumpMarkup(suite, outfile) {

  var file = fs.writeFileSync(outfile, markup(suite))
}

function Runner(options) {

  this.options = options || {}

  // Track how many processes are running currently
  this.running = 0

  // Collect the results for the end output
  this.results =
    { honored: 0
    , broken:  0
    , errored: 0
    , pending: 0
    , total:   0
    , time:    0
    };

  this.vows_options = {}
  if (this.options.reporter) {
    this.vows_options.reporter = this.options.reporter
  }

  if (this.options.quiet) {
    console.quiet = true
  }

  this.files = options.files

  this.suiteCallback = (this.suiteCallback).bind(this)
}

Runner.prototype = {}

Runner.prototype.suiteCallback = function(suite, result, infile) {

  this.running--

  Object.keys(result).forEach(function (k) {
    this.results[k] += result[k]
  }.bind(this))

  if (this.options.write) dumpMarkup(suite, infile)

  if (this.options.serial) this.next()
  this.checkIfDone()
}

Runner.prototype.runSuite = function(suite, infile) {

  if (!suite.batches.length) {
    return this.next()
  }

  suite.reporter.print(suite.filename + "\t")
  suite.run(this.vows_options, function(result) {
    this.suiteCallback(suite, result, infile)
  }.bind(this))

  if (!this.options.serial) this.next()
}

Runner.prototype.next = function() {

  var api = new LiterAPI(this.options)

  if (this.files.length < 1) {
    this.checkIfDone()
    return
  }

  this.running++

  vows.reporter.reset();

  var infile = this.files.shift()

  api.compileFile(infile, function(err, suite) {

    if (err) throw(err)
    this.runSuite(suite, infile)
  }.bind(this))
}

// If there are no more tests to run, exit with an appropriate error status.
// The status code is a bit-mask:
//
// 0 - ok
// 1 - broken tests
// 2 - errored tests
Runner.prototype.checkIfDone = function checkIfDone() {
  if (this.running <= 0) {
    var status = 0
    if (this.results.broken) status += 1
    if (this.results.errored) status += 2
    process.exit(status)
  }
}

Runner.prototype.run = function run() {
  return this.next()
}

// Run the tests as decribed by options. See cli.js for how the options are
// constructed.
function run(options) {
  return new Runner(options)
}

module.exports = run
