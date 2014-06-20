#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , args = process.argv.splice(2)
  , through = require('through')
  , util = require('util')
  , pager = require('./lib/pager')
  , format = util.format
  , chalk = require('chalk')
  , once = require('once')
  , strip = chalk.stripColor

var pagerOpts = {
  pager: 'less'
, args: ['-R']
}

var tr = through(write, end)

process.stderr.on('error', function(err) {
  console.log('STDIN ERR', err)
})

if (!args.length) {
  process.stdin.setEncoding('utf8')

  process.stdin
    .pipe(tr)
    .pipe(pager(pagerOpts))

} else {
  getPath(args[0], function(err, fp) {
    if (err) throw err
    fs.createReadStream(fp, { encoding: 'utf8' })
      .pipe(tr)
      .pipe(pager(pagerOpts))
  })

}

function hr() {
  return chalk.grey.underline('------------------------------')
}

function head(match, p1) {
  if (~match.indexOf('===')) {
    return chalk.green.underline.bold(strip(p1))+'\n\n'
  } else if (~match.indexOf('---')) {
    return chalk.blue.underline.bold(strip(p1))+'\n\n'
  }
  return match
}

function headatx(match, p1, p2) {
  var level = p1.length
  switch (level) {
    case 1:
      return chalk.green.underline.bold(strip(p2))+'\n\n'
    case 2:
      return chalk.blue.underline.bold(strip(p2))+'\n\n'
    default:
      return chalk.underline(strip(p2))+'\n\n'
  }
}

function strong(match, p1) {
  return chalk.cyan.bold(strip(p1))
}

function code(match, p1, p2, p3) {
  if (p1 === '```')
    return chalk.grey(strip(p3))+'\n\n'
  else
    return chalk.grey(strip(match.replace(/^[ ]{4}/gm, '')))
}

function em(match, p1, p2) {
  return chalk.italic.inverse(strip(p2))
}

function codeSingle(match, p1, p2, p3) {
  return chalk.bold(' '+strip(p3))
}

function write(data) {
  if (data) {
    data = data
      .replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm, head)
      .replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm, hr)
      .replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm, hr)
      .replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm, hr)
      .replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm, head)
      .replace(/m?(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm, headatx)
      .replace(
        /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/gm
      , code
      )
      .replace(/^( {4}[^\n]+\n*)+/gm, code)
      .replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm, codeSingle)
      .replace(/\*\*([^\*]+)\*\*/gm, strong)
      .replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, em)
      .replace(
        /\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))/gm
      , "1 - $1, 2 - $2"
      )

    this.emit('data', data)
  }
}

function end() {
  this.emit('end')
}

function getPath(fp, cb) {
  cb = once(cb)
  fs.exists(fp, function(e) {
    if (e) cb(null, fp)
  })

  var local = path.join(process.cwd(), 'node_modules', fp)
  fs.exists(local, function(e) {
    if (e) {
      fs.readdir(local, function(err, files) {
        if (err) return cb(err)
        var rme = files.reduce(function(set, file) {
          file = file.toLowerCase()
          if (set.readme) return set
          if (!set.files) set.files = []
          if (~file.indexOf('readme')) {
            set.readme = path.join(local, file)
            return set
          }
          if (~['.md', '.markdown'].indexOf(path.extname(file))) {
            set.files.push(path.join(local, file))
          }
          return set
        }, {})
        if (rme.readme) return cb(null, rme.readme)
        if (rme.files.length) return cb(null, rme.files[0])
      })
    }
  })

  var glob = process.env.NODE_PATH || '/usr/local/lib/node_modules'
  glob = path.join(glob, fp)
  fs.exists(glob, function(e) {
    if (e) {
      fs.readdir(glob, function(err, files) {
        if (err) return cb(err)
        var rme = files.reduce(function(set, file) {
          file = file.toLowerCase()
          if (set.readme) return set
          if (!set.files) set.files = []
          if (~file.indexOf('readme')) {
            set.readme = path.join(glob, file)
            return set
          }
          if (~['.md', '.markdown'].indexOf(path.extname(file))) {
            set.files.push(path.join(glob, file))
          }
          return set
        }, {})
        if (rme.readme) return cb(null, rme.readme)
        if (rme.files.length) return cb(null, rme.files[0])
      })
    }
  })

  setTimeout(function() {
    cb(new Error('Cannot find file'))
  }, 1000)
}
