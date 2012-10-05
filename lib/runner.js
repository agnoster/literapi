var LiterAPI = require('literapi')
  , vows = require('vows')
  , util = require('util')
  , fs = require('fs')

module.exports = function(options) {

var vowsoptions = {}
if (options.reporter) vowsoptions.reporter = options.reporter
var running = 0
var results = {
    honored: 0,
    broken:  0,
    errored: 0,
    pending: 0,
    total:   0,
    time:    0
};

function markup(suite) {

    var batch, token, tags

    for (var i = 0; i < suite.batches.length; i++) {

        batch = suite.batches[i]
        token = batch.tests._token
        if (!token) continue

        if (batch.broken || batch.errored) token.tags = 'fail'
        else token.tags = 'ok'

        token.refresh()
    }
    return suite.tokens.join('')
}

function dumpMarkup(suite, outfile) {

    var file = fs.writeFileSync(outfile, markup(suite))
}

function runNext() {
    var api = new LiterAPI(options)
    if (options.files.length < 1) {
        checkIfDone()
        return
    }
    running++

    vows.reporter.reset();

    (function(infile) {

        api.compileFile(infile, function(err, suite) {

            if (err) throw(err)

            if (options.serial) {
                suite.run(vowsoptions, function(result) {
                    running--

                    Object.keys(result).forEach(function (k) {
                        results[k] += result[k]
                    })

                    if (options.write) dumpMarkup(suite, infile)

                    runNext()
                    checkIfDone()
                })
            } else {
                suite.run(vowsoptions, function(result) {
                    running--
                    Object.keys(result).forEach(function (k) {
                        results[k] += result[k]
                    })
                    checkIfDone()
                })
                runNext()
            }
        })
    })(options.files.shift())
}

function checkIfDone() {
    if (running <= 0) {
        var status = 0
        if (results.broken) status += 1
        if (results.errored) status += 2
        process.exit(status)
    }
}

runNext()

}
