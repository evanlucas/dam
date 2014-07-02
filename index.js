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
  , marked = require('marked')
  , Renderer = marked.Renderer
  , Table = require('cli-table')

var currentTable
  , isHead = true
  , currentRow = []
  , align = []

Renderer.prototype.code = function(code, lang, escaped) {
  var splits = code.split(/\n|\r\n/)
  return splits.map(function(r) {
    return chalk.grey(r)
  }).join('\n')+'\n\n'
}

Renderer.prototype.heading = function(text, level, raw) {
  switch (level) {
    case 1:
      return chalk.green.underline.bold(text)+'\n\n'
    case 2:
      return chalk.blue.underline.bold(text)+'\n\n'
    default:
      return chalk.underline(text)+'\n\n'
  }
}

Renderer.prototype.hr = function() {
  return chalk.grey.underline('------------------------------')+'\n\n'
}

Renderer.prototype.list = function(body, ordered) {
  return '\n'+body+'\n'
}

Renderer.prototype.listitem = function(text) {
  return '▪︎ '+text+'\n'
}

Renderer.prototype.paragraph = function(text) {
  return text+'\n\n'
}

Renderer.prototype.strong = function(text) {
  return chalk.cyan.bold(text)
}

Renderer.prototype.em = function(text) {
  return chalk.italic.inverse(text)
}

Renderer.prototype.codespan = function(text) {
  return chalk.bold(text)
}

Renderer.prototype.br = function() {
  return '\n'
}

Renderer.prototype.link = function(href, title, text) {
  return chalk.underline.yellow(href)
}

Renderer.prototype.image = function(href, title, text) {
  return chalk.underline.magenta(href)
}

Renderer.prototype.tablecell = function(content, flags) {
  isHead = flags.header
  currentRow.push(content)
  if (isHead) {
    if (flags.align === 'center') flags.align = 'middle'
    align.push(flags.align || 'left')
  }
  return ''
}

Renderer.prototype.tablerow = function(content) {
  if (isHead) {
    currentTable = new Table({
      head: currentRow
    , colAligns: align
    })
    isHead = false
  } else {
    if (currentTable) {
      currentTable.push(currentRow)
    }
  }
  currentRow = []
  return ''
}

Renderer.prototype.table = function(header, body) {
  var t = currentTable.toString()+'\n\n'
  currentTable = null
  align = []
  return t
}

var pagerOpts = {
  pager: 'less'
, args: ['-R']
}

var tr = through(write, end)

var usePager = true
if (args.length && ~args.indexOf('--no-pager')) {
  usePager = false
  args.splice(args.indexOf('--no-pager'), 1)
}

if (~args.indexOf('--help') || ~args.indexOf('-h')) {
  args[0] = 'usage.md'
}

if (!args.length) {
  process.stdin.setEncoding('utf8')
  var to = usePager
    ? pager(pagerOpts)
    : process.stdout
  process.stdin
    .pipe(tr)
    .pipe(to)

} else {
  getPath(args[0], function(err, fp) {
    if (err) {
      return error(err)
    } else {
    var to = usePager
      ? pager(pagerOpts)
      : process.stdout
      fs.createReadStream(fp, { encoding: 'utf8' })
        .pipe(tr)
        .pipe(to)
    }
  })
}


function write(data) {
  if (data) {
    marked(String(data), {
      renderer: new Renderer
    , smartypants: true
    }, function(err, content) {
      if (err) {
        this.emit('error', err)
      } else {
        this.queue(content)
      }
    }.bind(this))
  }
}

function end() {
  this.queue(null)
}

function getPath(fp, cb) {
  cb = once(cb)

  var found = false

  function done(err, result) {
    if (err) return cb(err)
    found = true
    cb(null, result)
  }

  fs.exists(fp, function(e) {
    if (e) cb(null, fp)
  })

  var local = path.join(process.cwd(), 'node_modules', fp)
  fs.exists(local, function(e) {
    if (e && !found) {
      fs.readdir(local, function(err, files) {
        if (err) return cb(err)
        if (found) return
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
    if (e && !found) {
      fs.readdir(glob, function(err, files) {
        if (err) return cb(err)
        if (found) return
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

function error(err) {
  console.error('Error:', err)
  process.exit(1)
}
