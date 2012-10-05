var runner = require('./runner')

var usageMessage =
    "\n    literapi [-vah] http://api.server:port/root file1 [file2 [...]]" +
    "\n      -v         Show version number" +
    "\n      -a         Show all results, not just errors" +
    "\n      -d         Delay 50ms between calls (additional -d will double the delay)" +
    "\n      -w         Overwrite the document with annotations about successes and failures" +
    "\n      -h         Show this help"

function usage() {

  console.log(usageMessage)
  usageMessage = "\n\nPlease specify some options"
}

function extract_options(params) {

  // Make a shallow copy of params, as we will be munging it
  params = params.slice()

  // Start with default options
  var options =
    { serial: true
    , delay: 25
    , write: false
    }

  // Parse option flags from params
  while (params[0] && params[0].length && params[0][0] === '-') {
    for (var opt = params.shift(); opt = opt.slice(1); ) {
      switch (opt[0]) {
        case 'w':
          options.write = true
          break
        case 'v':
          console.log(LiterAPI.getVersion())
          break
        case 'p':
          options.serial = false
          break
        case 's':
          options.serial = true
          break
        case 'd':
          options.delay = options.delay ? (options.delay * 2) : 50
          break
        case 'h':
          usage()
          break
        case 'a':
          options.reporter = require('vows/lib/vows/reporters/spec')
          break
        default:
          console.log("Unrecognized option: -" + opt[0])
      }
    }
  }

  // We require at least 2 arguments: the host and a file to run
  if (params.length < 2) {
    usage()
    process.exit()
  }

  options.root = params.shift()
  options.files = params

  return options
}

/* Run the command-line
 *
 * Takes an array of command-line arguments. If none are passed, will use the arguments from `process`.
 */
function run(params) {

  var options = extract_options(params || process.argv.slice(2))

  if (!options.serial) {
    console.log("Unfortunately, due to the ways vows work, tests *must* be run serially for now.")
    options.serial = true
  }

  runner(options).run()
}

module.exports = run
