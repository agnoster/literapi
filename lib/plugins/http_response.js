// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

function http_response(example, next) {

  if (!example.http || !example.http.response) return next()

  function assertion(name, fn) {
  }
}

module.exports.examples = http_response
