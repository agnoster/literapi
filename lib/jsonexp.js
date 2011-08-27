var assert = require('assert')

var captureRE = /\[([A-Za-z_][A-Za-z_0-9]*)\]/g

function mergeCaptures(current, next, noOverwrite) {
    for (var key in next) {
        if (!next.hasOwnProperty(key)) continue
        if (current.hasOwnProperty(key) && noOverwrite)
            assert.deepEqual(current[key], next[key], "Got mismatching results for capture [" + key + "]")

        current[key] = next[key]
    }
    return current
}

function JSONExp(src, options) {
    var self = function() {
      return self.exec.apply(self, arguments)
    }

    self.src     = src
    self.pattern = JSONExp.parse(src)
    self.options = options || {}

    self.__proto__ = JSONExp.prototype
    self.constructor = JSONExp

    return self
}

var specials = function(obj) {
    var opts = {}

    if (obj.hasOwnProperty(specials.glob))    opts.glob    = obj[specials.glob]
    if (obj.hasOwnProperty(specials.capture)) opts.capture = obj[specials.capture]
    if (obj.hasOwnProperty(specials.any))     opts.any     = obj[specials.any]
    if (obj.hasOwnProperty(specials.many))    opts.many    = obj[specials.many]

    return opts
}

specials.glob    = "$JSONExp GLOB"
specials.capture = "$JSONExp CAPTURE"
specials.any     = "$JSONExp ANY"
specials.many    = "$JSONExp MANY"

function unicodeEscape(str) {
    var output = '', code
    for (var i = 0; i < str.length; i++) {
        code = str.charCodeAt(i).toString(16)
        while (code.length < 4) code = '0' + code
        output += '\\u' + code
    }
    return output
}

function escapeString(match, contents) {
    return '"' + unicodeEscape(contents) + '"'
}

JSONExp.preprocess = function(src) {
    return src
        .replace(/"(.*?[^\\])"/g, escapeString)
        .replace(/\*\*/g,   '{ "' + specials.many    + '": true }')
        .replace(/\*/g,     '{ "' + specials.any     + '": true }')
        .replace(/\.\.\./g,   '"' + specials.glob    + '": true')
        .replace(captureRE, '{ "' + specials.capture + '": "$1" }')
}

JSONExp.parse = function(src) {
    return JSON.parse(JSONExp.preprocess(src))
}

JSONExp.prototype = new Function

JSONExp.prototype.exec = function(obj, options) {
    try {
        var match = this.assert(obj, options)
        return match
    } catch (e) {
        if (!(e instanceof assert.AssertionError)) throw e
        return null
    }
}

JSONExp.prototype.assert = function(obj, options) {
    // tests obj for matching, throws assertion errors if mismatched
    options = options || {}
    if (!options.namespace) options.namespace = {}

    var match = this._match(this.pattern, obj, options, '/')
    
    if (options.merge) mergeCaptures(options.namespace, match, true)

    return match
}

JSONExp.prototype.test = function(obj, options) {
    return !!this.exec(obj, options)
}

JSONExp.prototype._match = function(pattern, given, options, path) {
    var match = {}

    function test(a, b, message) {
        assert.equal(a, b, "At key '" + path + "': expected " + a + ", got " + b)
    }

    if ('object' == typeof pattern && pattern) {
        if (specials(pattern).capture) {
            match[specials(pattern).capture] = given
        } else if (specials(pattern).any) {
            // anything will do
        } else {
            test(typeof pattern, typeof given)

            if (specials(pattern).glob) {
                delete pattern[specials.glob]
            } else {
                for (var key in given) {
                    if (!given.hasOwnProperty(key)) continue
                    assert.ok(pattern.hasOwnProperty(key), "At " + path + ", unexpected key \"" + key + "\": " + JSON.stringify(given[key]) )
                }
            }

            assert.ok(given, "Got null at " + path)
            assert.equal(given.constructor, pattern.constructor, "Not the same type")

            for (var key in pattern) {
                if (!pattern.hasOwnProperty(key)) continue
                assert.ok(given.hasOwnProperty(key), "At " + path + ", key '" + key + "' not found")
                var m = this._match(pattern[key], given[key], options, path + '/' + key)
                mergeCaptures(match, m)
            }
        }
    } else { // non-objects
        test(typeof pattern, typeof given)
        test(pattern, given)
    }
    return match
}

JSONExp.prototype.toString = function() {
    return '' + this.src
}

JSONExp.prototype.compile = function() {
    // precompile for better performance
    console.log("precompiling not yet implemented")

    /* Someday:
    this.exec = function() {
        // precompiled version
    }
    */
    return this
}

JSONExp.compile = function(pattern, options) {
    var exp = new JSONExp(pattern, options)
    return exp.compile()
}

module.exports = JSONExp
