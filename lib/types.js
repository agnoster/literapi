var _ = require('underscore')

function Element(properties) {
  properties && _.extend(this, properties)
  this.context = this.context || new Context
}

Element.prototype = {}

Element.prototype.fullTitle = function fullTitle() {
  return this.title
  var parentTitle = this.parent && this.parent.fullTitle()
  if (parentTitle) return parentTitle + "\n     " + this.title
  return this.title
}

function Context(properties) {
  properties && _.extend(this, properties)
  this.bindings = this.bindings || {}
}

function Book(properties) {
  properties && _.extend(this, properties)
  this.documents = this.documents || []
  this.context = this.context || new Context
}

Book.prototype.__proto__ = Element.prototype

Book.prototype.addDocument = function addDocument(properties) {
  var doc = new Document(properties)
  doc.parent = this
  this.documents.push(doc)
  return doc
}

function Document(properties) {
  properties && _.extend(this, properties)
  this.examples = this.examples || []
  this.context = this.context || new Context
}

Document.prototype.__proto__ = Element.prototype

Document.prototype.addExample = function addExample(properties) {
  var example = new Example(properties)
  example.context = this.context
  example.parent = this
  this.examples.push(example)
  return example
}

function Example(properties) {
  properties && _.extend(this, properties)
  this.tests = this.test || []
}

Example.prototype.__proto__ = Element.prototype

Example.prototype.addTest = function addTest(properties) {
  var test = new Test(properties)
  test.context = this.context
  test.pending = this.pending
  test.parent = this
  this.tests.push(test)
  return test
}

function Test(properties) {
  properties && _.extend(this, properties)
  this._slow = 76
}

Test.prototype.__proto__ = Element.prototype

Test.prototype.ok = function ok() {
  this.status = 'ok'
}

Test.prototype.fail = function fail(e) {
  this.err = e
  this.status = 'fail'
}

Test.prototype.slow = function(ms){
  if (0 === arguments.length) return this._slow
  if ('string' == typeof ms) ms = milliseconds(ms)
  debug('timeout %d', ms)
  this._slow = ms
  return this
}

module.exports =
{ context: Context
, book: Book
, document: Document
, example: Example
, test: Test
}
