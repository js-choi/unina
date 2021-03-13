# Data utilities
The universal modules in this directory deal export various data utilities:

*[`#js/util/iterable`](./iterable.mjs)* exports utilities for transforming
sequential data (both synchronous iterables and asynchronous iterables).

*[`#js/util/hex`](./hex.mjs)* exports utilities for transforming strings with
hexes, numbers, and code points. **Hex strings (hexes)** are strings of digits
and letters between `A` and `F`.

*[`#js/util/iterable`](./iterable.mjs)* exports utilities for transforming
sequential data (both synchronous iterables and asynchronous iterables).

*[`#js/util/peg`](./peg.mjs)* exports utilities for creating and using [parsing
expression grammars][PEGs] to match strings. In particular, the
[`#js/hangul-syllable` module][] uses PEGs to parse the names of Hangul
syllables.

[PEGs]: https://en.m.wikipedia.org/wiki/Parsing_expression_grammar
[`#js/hangul-syllable` module]: ../hangul-syllable.mjs

*[`#js/util/random`](./random.mjs)* exports utilities for generating random
integers or randomly sampling arrays. This is especially useful for the
[benchmark script][].

[benchmark script]: ../../script/benchmark.mjs

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
