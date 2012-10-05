var runner = require('./runner')

module.exports = function(params) {

params = params || process.argv.slice(2)

var options = { serial: true }

var usageMessage =
    "\n    literapi [-vah] http://api.server:port/root file1 [file2 [...]]" +
    "\n      -v         Show version number" +
    "\n      -a         Show all results, not just errors" +
    "\n      -d         Delay 100ms between calls (additional -d will double the delay)" +
    "\n      -w         Overwrite the document with annotations about successes and failures" +
    "\n      -h         Show this help"

while (params[0] && params[0][0] && params[0][0] == '-') { // option flag
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
                options.delay = options.delay ? (options.delay * 2) : 100
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

options.delay = options.delay || 25

if (!options.serial) {
    console.log("Unfortunately, due to the ways vows work, tests *must* be run serially for now.")
    options.serial = true
}

function usage() {
    console.log(usageMessage)
    usageMessage = "\n\nPlease specify some options"
}

if (params.length < 2) {
    usage()
    process.exit()
}

options.root = params.shift()
options.files = params.slice()

runner(options)

}
