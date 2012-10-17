// Gently, see https://github.com/felixge/node-gently#gentlyhijackrealrequire
if (global.GENTLY) require = GENTLY.hijack(require)

/**
 * The debug plugin simply outputs the information on hand about each example
 */
module.exports = {
  "examples": function debug(el, next) {
    console.log(el)
    next()
  }
}
