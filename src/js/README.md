# Core modules’ source code
All of these modules are **universal**: they run in both web browsers and in
Node.

The *[`#js/util/`](./util/)* modules export various data utilities.

*[`#js/name`](./name.mjs)* exports utilities for sorting names and fragments of
names, as well as **name types**.

*[`#js/fuzzy-folder`](./fuzzy-folder.mjs)* exports a function that folds names
into “fuzzy names”, such that two names match each other, as defined by the
[Unicode Loose Matching Rule UAX44-LM2][UAX44-LM2], only if their fuzzy names
equal each other.

[UAX44-LM2]: https://www.unicode.org/reports/tr44/#UAX44-LM2

*[`#js/hangul-syllable`](./hangul-syllable.mjs)* exports functions that look up
the Korean Hangul syllables, which have dynamically generated names. These
algorithms are defined in The Unicode Standard, § 3.12.

*[`#js/name-counter`](./name-counter.mjs)* helps derive names from “name
counters”, which are algorithms that generate sequences of names from index
integers.

The *[`#js/name-range/`](./name-range/)* modules export functions that generate
and compare **name ranges** using data from UCD source files. A name range is
an object that represents one or more contiguous Unicode names and their named
Unicode values. (This module does not manage fetching the UCD source files; the
source files’ data have to be supplied as arguments to this module’s
functions.)

*[`#js/db-compiler`](./db-compiler.mjs)* exports a function that creates a
database of Unicode names from the name ranges created by the `name-range/`
module. The database can then be read by the `db-reader/` module. Compilation
logic is separated from the retrieval logic in `db-reader/` to make it easier
to exclude the former from applications that do not need to compile the
database.

*[`#js/db-reader`](./db-reader.mjs)* exports a class that reads the database of
Unicode names that is created by the `db-compiler/` module.

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
