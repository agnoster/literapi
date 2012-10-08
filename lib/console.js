module.exports = {
  log: function() {
    if (!this.quiet) console.log.apply(console, arguments)
  }
}
