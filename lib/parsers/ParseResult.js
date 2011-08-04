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
      , headers = parts.shift().split("\n")

    req.label = headers.shift()
    req.headers = headers

    req.body = parts.shift()

    if (parts.length) this.addBlock(parts.join("\n\n"))

    return req
}

ParseResult.prototype.addResponse = function(block) {
    var match = responseRegex.exec(block)
      , resp

    if (!match) return null

    this._req.resp = resp = {}

    resp.code = match[1]
    
    var parts = block.split(/\n\s*\n/)
      , headers = parts.shift().split("\n")

    resp.label = headers.shift()
    resp.headers = headers

    resp.body = parts.shift()

    if (parts.length) this.addBlock(parts.join("\n\n"))

    return resp
}

ParseResult.prototype.addBlock = function(block) {
    if (requestRegex.exec(block))
        return this.addRequest(block)

    if (responseRegex.exec(block))
        return this.addResponse(block)

    if (block.length)
        console.log("Skipping something that doesn't look like anything: " + block)

    return null
}

module.exports = ParseResult
