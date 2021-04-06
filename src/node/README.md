# Node modules’ source code
These modules run in Node only.

* *`extract/`* exports a function that extracts data from the UCD text files
  that are included in `../ucd/`, using the `../main/name-object/` modul).
* *`compile/`* exports a function that uses `extract` to compiles a database of
  character names. That database can be used to construct `Uniname` objects (see
  the `../main/` module).
* *`build/`* is a script that actually creates a database file.
* *`test/`* is a Jest test suite.

This documentation is subject to the [Mozilla Public License v2.0][MPL].
[MPL]: https://mozilla.org/MPL/2.0/
