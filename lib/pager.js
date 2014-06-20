//
// The majority of this file was taken from
// https://github.com/dominictarr/default-pager
//
// The original is licensed under the MIT License
//
var spawn = require('child_process').spawn

module.exports = function (opts, cb) {
  if (typeof opts === 'function') {
      cb = opts
      opts = {}
  }
  if (!opts) opts = {}

  var pager = opts.pager
    || process.env.PAGER
    || 'more'

  var ps = spawn(pager, opts.args || [], {
    stdio: ['pipe', process.stdout, process.stderr]
  })

  ps.on('exit', function (code, sig) {
      if (typeof cb === 'function') cb(code, sig)
  })
  ps.stdin.on('error', process.exit)
  return ps.stdin
}
