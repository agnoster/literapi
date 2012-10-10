var literapi = require('./')
  , optimist = require('optimist')

function parse_args(args) {
  return optimist(args)
    .usage('Usage: $0 [-vawqhd] -r http://api.server:port/root file1 [file2 [...]]')
    .describe('r', 'Root URI for the API').alias('r', 'root')
    .describe('v', 'Return the version number').alias('v', 'version')
    .describe('a', 'Show all results, not just errors').alias('a', 'all')
    .describe('w', 'Overwrite the document with annotations about successes and failures').alias('w', 'write')
    .describe('q', 'Quiet mode').alias('q', 'quiet')
    .describe('h', 'Show this help').alias('h', 'help')
    .describe('d', 'Delay 50ms between calls (additional -d will double the delay)').alias('d', 'delay')
}

function parse_opts(opts) {

  var argv = opts.argv
  var options =
    { serial: true
    , delay: 25
    , write: false
    }

  // Options
  if (argv.w) options.write = true
  if (argv.d) options.delay *= 2
  if (argv.a) options.reporter = require('vows/lib/vows/reporters/spec')
  if (argv.r) options.root = argv.r
  if (argv.q) {
    options.quiet = true
    options.reporter = require('./reporters/quiet')
  }
  options.files = argv._

  // Actions
  if (argv.v) {
    console.log(literapi.version)
    process.exit()
  }
  if (argv.h || options.files.length === 0) {
    opts.showHelp()
    process.exit()
  }

  return options
}

function extract_options(params) {

  options = parse_opts(parse_args(params))

  // Merge config here

  return options
}

/* Run the command-line
 *
 * Takes an array of command-line arguments. If none are passed, will use the arguments from `process`.
 */
function run(params) {

  var options = extract_options(params || process.argv.slice(2))

  literapi.withDefaultPlugins(options).runWithFiles(params.files, function(results) {
    console.log('done')
    var status = 0
    if (results.broken) status += 1
    if (results.errored) status += 2
    process.exit(status)
  })
}

module.exports = run
