// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

module.exports = {
  "examples": function debug(el, next) {
    console.log('*** DEBUG ***')
    console.log(el)
    console.log('*** DEBUG ***')
    next()
  }
}
