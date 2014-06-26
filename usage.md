# dam(1)

## usage: dam [options] [file]
  
## options:
    
    -h, --help          show help and usage
    --no-pager          pipe to stdout instead of less
  
## examples:
  
### Reading file

```
$ dam README.md
```

### Reading from stdin

```
$ dam < README.md
```

### Disable pager

```
$ dam --no-pager < README.md
```

### Read a global module's readme

```
$ dam npm
```