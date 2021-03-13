# Node modules’ source code
These modules run in Node only.

*[`#node/tester`](./tester.mjs)* exports functions for automated testing.
Actual tests are in the [test directory](../../test/).

*[`#node/timer`](./timer.mjs)* measures time that elapses during function
calls.

*[`#node/extractor`](./extractor.mjs)* exports a function that extracts data
from the UCD text files that are included in the [UCD directory][], using the
[`#js/name-range/` modules][].

[UCD directory]: ../ucd/
[`#js/name-range/` modules]: ../js/name-range/README.md

Note that the [scripts directory][] also contains some executable Node scripts.

[scripts directory]: ../../scripts/

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
