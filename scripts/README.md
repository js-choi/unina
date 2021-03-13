# Scripts
This directory contains executable scripts for various tasks. They must contain
[shebang lines][], and their file permissions must allow shells to run them.

[shebang lines]: https://en.wikipedia.org/wiki/Shebang_(Unix)

The *[build script](./build.mjs)* creates the `#build/database` module using
the [`#node/extractor` module][] – and then bundles the database and other
dependencies into the fully built main `unina` module.

[`#node/extractor` module]: ../src/node/extractor.mjs

The *[benchmark script](./benchmark.mjs)* runs several benchmark suites.

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
