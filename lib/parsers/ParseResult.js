function ParseResult() {
    this.tests = []
    this.title = ''
    this._req = {}
}

requestRegex = /^([A-Z]+)\s+(\/.+)/
responseRegex = /^(\d\d\d)\s/

ParseResult.prototype = {}

ParseResult.prototype.setTitle = function(title) {
    this.title = title
}

ParseResult.prototype.addRequest = function(block) {
    var match = requestRegex.exec(block)
      , req

    if (!match) return null

    req = {}
    this._req = { req: req, label: this.lastText }
    this.tests.push(this._req)

    req.method = match[1]
    req.path = match[2]

    var parts = block.split(/\n\s*\n/)
      , headers = parts[0].split("\n")

    req.label = headers.shift()
    req.headers = headers

    req.body = parts[1]

    return req
}

ParseResult.prototype.addResponse = function(block) {
    var match = responseRegex.exec(block)
      , resp

    if (!match) return null

    this._req.resp = resp = {}

    resp.code = match[1]
    
    var parts = block.split(/\n\s*\n/)
      , headers = parts[0].split("\n")

    resp.label = headers.shift()
    resp.headers = headers

    resp.body = parts[1]

    return resp
}

ParseResult.prototype.addBlock = function(block) {
    if (requestRegex.exec(block))
        return this.addRequest(block)

    if (responseRegex.exec(block))
        return this.addResponse(block)

    console.log("Skipping something that doesn't look like anything: " + block)

    return null
}

ParseResult.prototype.compile = function() {
    var str = ''
    
    // str += "var vows = require('vows'), assert = require('assert'), request = require('request')\n"
    // str += ", api = require('./lib/api'); api.root = 'http://localhost:8081'\n"

    str += "vows.describe('" + this.title + "')"

    for (var i = 0; i < this.tests.length; i++) {
        str += ".addBatch(" + compileTest(this.tests[i]) + ')'
    }

    str += ".export(module)"

    return str
}

function compileTest(test) {
    var buffer = '{\n    "' + test.label + '": { topic: api.call(' + JSON.stringify(test.req) + "),\n        "
    if (test.resp) {
        buffer += '"' + test.resp.label + '": api.match(' + JSON.stringify(test.resp) + ')'
    } else {
        buffer += '"succeeds": function(error, result) { assert.ok(result) }'
    }
    buffer += '}}'

    return buffer
}

ParseResult.prototype.dump = function() {
    console.log("Title: " + this.title)
    for (var i = 0; i < this.tests.length; i++)
        console.log(this.tests[i])
}

module.exports = ParseResult
