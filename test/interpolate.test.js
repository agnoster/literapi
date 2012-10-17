var interpolate = require('../lib/interpolate')
  , should = require('should')

describe('Interpolation', function () {
  var context

  beforeEach(function () {
    context = { name: "World" }
  })

  it('interpolates raw values', function () {
    interpolate("Hello, [name]!", context)
      .should.equal("Hello, World!")
  })

  describe('with json: true', function () {
    it('interpolates json-encoded values', function () {
      interpolate('{ "hello": [name] }', context, { json: true })
        .should.equal('{ "hello": "World" }')
    })

    it('interpolates raw values with {{...}}', function () {
      interpolate('{ "message": "Hello, {{name}}!" }', context, { json: true })
        .should.equal('{ "message": "Hello, World!" }')
    })
  })

  describe('with custom patterns', function () {
    it('replaces the custom patterns, and default raw patterns', function() {
      interpolate('[name] $name {{name}}', context, { patterns: ['$%'] })
        .should.equal('[name] World World')
    })

    it('json encodes the custom patterns', function () {
      interpolate('[name] $name {{name}}', context,
        { patterns: ['$%'], json: true })
        .should.equal('[name] "World" World')
    })
  })

  describe('with custom raw_patterns', function () {
    it('replaces the custom raw_patterns, and default patterns', function() {
      interpolate('[name] $name {{name}}', context,
        { raw_patterns: ['$%'], json: true })
        .should.equal('"World" World {{name}}')
    })
  })

  describe('.match', function () {
    it('tries to match the template against the string', function () {
      interpolate.match('Hello, World! It is sunny today.',
        'Hello, {{name}}! It is {{weather}} today.', context)
        .should.eql({ name: "World", weather: "sunny" })
    })

    it('matches multiple occurrences of a capture', function () {
      interpolate.match('Hello, World! It is foggy today. Was foggy yesterday, too.',
        'Hello, {{name}}! It is {{weather}} today. Was {{weather}} yesterday, too.',
        context).should.eql({ name: "World", weather: "foggy" })
    })

    it("fails if multiple occurrences don't fit", function () {
      should.not.exist(
        interpolate.match('It is sunny today. Was rainy yesterday, too.',
        'It is {{weather}} today. Was {{weather}} yesterday, too.',
        context)
        )
    })
  })
})
