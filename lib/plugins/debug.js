// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

module.exports = {
  "document": function(doc, next) {
    console("Document: ", doc)
  }
}
