# core-score

[![Build Status](https://travis-ci.org/jryans/core-score.png)](https://travis-ci.org/jryans/core-score)

# Overview

Ranks core modules by usage across all of NPM.

# Usage

First, install this package:

```sh
$ npm install -g core-score
```

You can specify several packages to explore:

```sh
$ core-score npm mkdirp
```

That will return a sorted table showing how many of the packages you specified
referenced a particular core module:

```
┌────────────────┬───────┐
│ Module         │ Usage │
├────────────────┼───────┤
│ path           │ 2     │
├────────────────┼───────┤
│ child_process  │ 1     │
├────────────────┼───────┤
│ events         │ 1     │
├────────────────┼───────┤
│ fs             │ 1     │
├────────────────┼───────┤
│ os             │ 1     │
├────────────────┼───────┤
│ tty            │ 1     │
├────────────────┼───────┤
│ util           │ 1     │
├────────────────┼───────┤
│ assert         │ 0     │
├────────────────┼───────┤
│ buffer         │ 0     │
├────────────────┼───────┤
│ cluster        │ 0     │
├────────────────┼───────┤
│ crypto         │ 0     │
├────────────────┼───────┤
│ dgram          │ 0     │
├────────────────┼───────┤
│ dns            │ 0     │
├────────────────┼───────┤
│ http           │ 0     │
├────────────────┼───────┤
│ https          │ 0     │
├────────────────┼───────┤
│ net            │ 0     │
├────────────────┼───────┤
│ punycode       │ 0     │
├────────────────┼───────┤
│ querystring    │ 0     │
├────────────────┼───────┤
│ readline       │ 0     │
├────────────────┼───────┤
│ repl           │ 0     │
├────────────────┼───────┤
│ string_decoder │ 0     │
├────────────────┼───────┤
│ tls            │ 0     │
├────────────────┼───────┤
│ url            │ 0     │
├────────────────┼───────┤
│ vm             │ 0     │
├────────────────┼───────┤
│ zlib           │ 0     │
└────────────────┴───────┘
```

You can also search through N random packages:

```sh
$ core-score -n 100
```

# Methods

## coreScore.scorePackages

```javascript
coreScore.scorePackages(array / number, callback(err, data))
```

Takes in either an array of package names or a number of packages to choose
randomly from NPM.  The callback is passed an object whose keys are the
packages and whose values are objects themselves with boolean states for each
core modules indicated whether it was referenced or not.

# License

[MIT](http://jryans.mit-license.org/)
