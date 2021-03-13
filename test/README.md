# Test suites
This directory contains test suites that can verify the behavior of the entire
package.

Most tests are contained in the [complete integration-test suite][], which
verifies the observable behavior of the (fully [built][]) [main `unina`
API][]. These same tests also indirectly verify most behavior of the internal
modules. This suite expects that the library has already been [built][] with
`npm run build`.

[complete integration-test suite]: ./node/complete.mjs
[built]: ../script/build.mjs
[main `unina` API]: ../src/js/main.mjs

Some internal modules have behavior that cannot be fully observed when using
only the [main `unina` API][], depending on the current particular contents
of the Unicode Character Database (UCD) and also on the database format.

By checking these internal edge cases with unit tests, future updates to the
UCD and to the database’s format are less likely to cause observable bugs in
the main `unina` API as well.

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
