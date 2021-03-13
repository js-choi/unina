# Unina
This is a JavaScript library and CLI app for retrieving Unicode characters and
code points by their Unicode names (aka `uname`s) – and vice versa.

It supports not only strict Unicode names but also name aliases, named
character sequences, and code-point labels. Additionally, it [fuzzily matches
names][UAX44-LM2]: it is case insensitive, and it ignores spaces, underscores,
and medial hyphens.

[UAX44-LM2]: https://www.unicode.org/reports/tr44/#UAX44-LM2

## Use the CLI app
The CLI app requires Node v18 or later and NPM v8 or later. The most convenient
way to use the CLI app is to use NPM’s [`npx`][] command, which automatically
downloads and installs the CLI app on your device.

```fish
npx unina --version
npx unina --help
npx unina pilcrow-sign
```

[`npx`]: https://docs.npmjs.com/cli/v8/commands/npx

Alternatively, you can install the app directly into your shell’s commands:

```fish
npm install --global unina
unina --version
unina --help
unina -i pilcrow-sign
```

By default, the app will look up characters by their names from stdin and print
out those characters to stdout, followed by a newline (U+000A Line Feed).

```fish

grep --ignore-case arabic input_names.txt | unina
```

Instead of using stdin, you can specify files directly as arguments.

```fish
unina input_names.txt
```

And you can specify names in the command itself with the `-i` or `--input`
option:

```fish
unina -i "Tamil Consonant K" ox LF arabic-letter-feh Arabic_letter_yeh arc
```

This can be especially useful to copy to the system clipboard:

```fish
# On Linux (with xsel installed):
unina -i 'Combining Enclosing Circle' | xsel -ib

# On macOS:
unina -i 'Combining Enclosing Circle' | pbcopy

# On Windows:
unina -i 'Combining Enclosing Circle' | clip
```

To do reverse lookup (accessing names by their characters), use the
`-p`/`--preferred-names`, `-s`/`--strict-names`, or `-a`/`--all-names` options.

```fish
unina --preferred-names "க்🐂في⧿"
unina --strict-names "க்🐂في⧿"
unina --all-names "க்🐂في⧿"
```

For more details on how to use the CLI app, see its [manpage][] (available only
after using `npm install --global unina`):

```fish
man unina
```

[manpage]: man.1

## Install the library in a Node server
When running in a Node server, we require Node v16 or later and NPM v8 or
later. In your server package’s directory, assuming Node and NPM are installed,
run this command:

```fish
npm install unina
```

…and then import the module into your own JavaScript code:

```js
// An example server.mjs module.
import * as Unina from 'unina';
```

## Install the library in a web app
When running in a web app, we require modern web browsers that support ES2021,
which include the latest versions of Firefox, Safari, Chrome, and Edge.

For hobby projects, you can conveniently use the module directly from the
free, best-effort [`unpkg` CDN][]:

```js
// An example app.js module.
import * as Unina from '//unpkg.com/unina@1';
```

[`unpkg` CDN]: https://unpkg.com/

If you use a bundler like [esbuild][], you can use NPM to install the library:

```fish
~> npm install unina
```

…import it into your web application:

```js
// An example app.js module.
import * as Unina from 'unina';
```

…and then bundle it into a single module resource:

```fish
~> npx esbuild src/app.js --bundle --outfile build/app.js
```

[esbuild]: https://esbuild.github.io/getting-started/

## Use the library API
The `unina` module exports three functions: `get`, `getPreferredNames`, and `getNameEntries`.

### `Unina.get`
```js
value = Unina.get(...names);
```

This function attempts to find a named Unicode value for each given name.
[Fuzzy name matching][UAX44-LM2] is used. Returns a concatenated string or
`undefined`.

For example, `Unina.get('space')` returns `' '` (i.e., `'\x20'`), and
`Unina.get('Latin capital letter A', 'combining right harpoon above')`
returns `'A⃑'` (i.e., `'\x41\u20D1'`).

In addition to strict Unicode names, this function also supports name aliases
and code-point labels like `'control-0000'` or `'SURROGATE-D800'`. (However,
`'RESERVED-` code labels for unassigned code points are *not* supported.)

The function throws a `TypeError` if any given argument is not a string.

### `Unina.getPreferredNames`
```js
names = Unina.getPreferredNames(value);
```

This function gets the preferred name(s) of the given string `value`. It
returns a name string or `undefined`. The name is always in upper case and may
contain spaces ` ` or hyphens `-`.

For example, `Unina.getPreferredNames('\x20')` returns `'SPACE'`, and
`Unina.getPreferredNames('\x41\u20D1')` returns `[ 'LATIN CAPITAL LETTER A',
'COMBINING RIGHT HARPOON ABOVE' ])`.

If the string `value` is a named character sequence, then that sequence’s
name is returned.

If the string `value` has a correction alias, that is preferentially
returned instead of its strict Unicode name.

If the string `value` has no strict Unicode name but it has an alias, then
its first alias is returned.

If the string `value` has no strict Unicode name or aliases, but it does
have a code-point label like `'CONTROL-0000'` or `'SURROGATE-D800'`, then
that code-point label is returned. (`'RESERVED-` code labels for unassigned
code points are *not* supported.)

If the `value` is not a string, then a `TypeError` is thrown.

Otherwise, `undefined` is returned.

### `Unina.getNameEntries`
```js
nameEntries = Unina.getNameEntries(value);
```

This function gets entries of all names of the given string `value`. It
returns an array of name entries, where each pair is an array `[ name,
nameType ]`.

`name` is a name string. `nameType` is:
* `'correction'` when `name` is a correction alias.
* `null` when `name` is a strict character name (i.e., the Name character
  property).
* `'sequence'` when `name` signifies a named character sequence.
* `'control'` when `name` is a control alias.
* `'alternate'` when `name` is an alternative alias.
* `'label'` when `name` is a code-point label like `'CONTROL-0000'` or
  `'SURROGATE-D800'`. (`'RESERVED-` code labels for unassigned code points are
  *not* supported due to their instability.)
* `'figment'` when `name` is a figment alias.
* `'abbreviation'` when `name` is an abbreviation alias.

The function throws a `TypeError` if the given `value` is not a string.

## Rebuilding
Most users of this package will not need to rebuild this library. For
developers working on the package itself, use these commands:

*[`npm install`][]* installs the package’s dependencies into a `node_modules/`
directory. This command must be run before `npm build` or any other of the
following commands, or else Node will complain that there are missing
dependencies.

*`npm run build`* builds the module once. This must be run before `npm test` or
`npm run benchmark`. See also the documentation in the [build script][].

[build script]: ./script/build.mjs

*`npm test`* runs the entire test suite. This includes the [complete
integration suite][], which tests the module on every single existing Unicode
name and may take several hours to finish. To exclude the complete integration
suite, use `npm test --ignore test/node/complete.mjs`, which will run quickly
but will not be as thorough.

[complete integration suite]: ./test/node/complete.mjs

*`npm run watch`* runs `npm run build` and `npm test --ignore
test/node/complete.mjs` every time you change a file anywhere in the package
directory. This is useful for continual development.

*`npm run benchmark`* runs several performance-benchmark suites. See also the
documentation in the [benchmark script][].

## License
This project’s source code and documentation are subject to the [Mozilla Public
License v2.0][MPL], with the exception of files in [`src/ucd/`](./src/ucd/).

[MPL]: https://mozilla.org/MPL/2.0/
