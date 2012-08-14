function ParseResult() {
    this.tests = []
    this.tokens = []
    this.title = ''
    this._req = {}
}

requestRegex = /^([A-Z]+)\s+(\/.*)/
responseRegex = /^(\d\d\d)\s/

ParseResult.prototype = {}

ParseResult.prototype.setTitle = function(title) {
    this.title = title
}

ParseResult.prototype.addRequest = function(block, token) {
    var match = requestRegex.exec(block)
      , req

    if (!match) return null

    req = {}
    this._req = { req: req, label: this.lastText }
    this.tests.push(this._req)

    req.method = match[1]
    req.path = match[2]
    req.token = token

    var parts = block.split(/\n\s*\n/)
      , headers = parts.shift().split("\n")

    req.label = headers.shift()
    req.headers = headers

    if (!responseRegex.exec(parts[0]))
        req.body = parts.shift()

    if (parts.length) this.addBlock(parts.join("\n\n"))
    this.tokens.push(block)

    return req
}

ParseResult.prototype.addResponse = function(block, token) {
    var match = responseRegex.exec(block)
      , resp

    if (!match) return null

    this._req.resp = resp = {}

    resp.code = match[1]
    resp.token = token
    
    var parts = block.split(/\n\s*\n/)
      , headers = parts.shift().split("\n")

    resp.label = headers.shift()
    resp.headers = headers
    
    if (!requestRegex.exec(parts[0]))
        resp.body = parts.shift()

    if (parts.length) this.addBlock(parts.join("\n\n"))

    return resp
}

ParseResult.prototype.addBlock = function(block, token) {
    block = block.trim()

    if (requestRegex.exec(block))
        return this.addRequest(block, token)

    if (responseRegex.exec(block))
        return this.addResponse(block, token)

    if (block.length)
        console.log("Skipping something that doesn't look like anything: " + JSON.stringify(block))

    return null
}

module.exports = ParseResult
