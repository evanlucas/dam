# dam(1)

Port of [mad](https://github.com/visionmedia/mad) to node. Man for markdown.

## Install

```bash
$ npm install -g dam
```

## Usage

Read from stdin

```bash
$ cat README.md | dam
```

Pass file as argument

```bash
$ dam README.md
```

Pass a package name

```bash
$ dam npm
```

When passing a package name, it will search the following:

- <pwd>/node_modules/<package>/<readme>
- /usr/local/lib/node_modules/<package>/<readme>

If no readme is found, then it will show the first markdown file it finds. If no markdown files are found, then `dam` will exit 

## Example

![Example](https://raw.githubusercontent.com/evanlucas/dam/master/screenshot.png)

## Credits

- [TJ Holowaychuk](https://github.com/visionmedia) for [mad](https://github.com/visionmedia/mad)
- [Domonic Tarr](https://github.com/dominictarr) for [default-pager](https://github.com/dominictarr/default-pager)
  - `dam` uses a slightly modified version of `default-pager`

## TODO

- Fix nested list indentation
- Support color configuration
- Possibly render images to terminal (Not sure if less would support such a thing?)
- Add path configuration

## Author

Evan Lucas

## License

MIT (See `LICENSE` for more info)
