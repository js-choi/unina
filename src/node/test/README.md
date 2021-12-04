# Unit test suites
This directory contains unit-test suites that can verify the behavior of
the entire package.

Most tests are contained in the top-level suite, which verifies the
observable behavior of the `main/` module. These same tests also indirectly
verify most behavior of the internal modules.

Some internal modules have behavior that cannot be fully observed when using
only the `main/` API, depending on the current particular contents of the
Unicode Character Database (UCD) and also on the database format.

By testing these internal edge cases, future updates to the UCD and to the
database format are less likely to cause observable bugs in the `main/` API
as well.

This documentation is subject to the [Mozilla Public License v2.0][MPL].
[MPL]: https://mozilla.org/MPL/2.0/
