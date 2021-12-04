# Main modules’ source code
This module (the `./index.js` file) and all of its submodules are **universal**:
they run in both web browsers and in Node.

**Code points** are integers in the Unicode code space, between `0` and
`0x1FFFF`.

**Scalars** are code points that are not UTF-16 surrogates.

**Characters** are strings made of one or more scalars.

## Data utilities
*`string/`* exports utilities for transforming strings with hexes, numbers, and
code points. **Hex strings (hexes)** are strings of digits and letters between
`A` and `F`.

*`name-type/`* exports utilities for sorting **name types**.

*`fuzzy-fold/`* exports a function that folds names into “fuzzy names”, such
that two names match each other, as defined by the [Unicode Loose Matching Rule
UAX44-LM2][UAX44-LM2], only if their fuzzy names equal each other.

[UAX44-LM2]: https://www.unicode.org/reports/tr44/#UAX44-LM2

## Database compilation
*`name-object/`* exports a function that extracts **name objects** from Unicode
Character Database source files. A name object is an object that represents a
single character name.

*`compile/`* exports a function that creates a database of Unicode names from
the name objects created by the `name-object/` module. The database can then be
read by the `library/` module. Compilation logic is separated from the retrieval
logic in `library/` to make it easier to exclude the former from applications
that do not need to compile the database.

## Database lookup
*`library/`* exports a class that reads the database of Unicode names that is
created by the `compile/` module.

## Dynamically generated names
*`code-point-label/`* exports functions that look up characters with dynamically
generated code-point labels.

*`hangul-syllable/`* exports functions that look up the Korean Hangul syllables,
which have dynamically generated names. These algorithms are defined in The
Unicode Standard, § 3.12.

*`hex-name/`* exports exports functions that look up characters with dynamically
generated strict Name values that are based on their scalars’ hex codes.

## License
This documentation is subject to the [Mozilla Public License v2.0][MPL].
[MPL]: https://mozilla.org/MPL/2.0/
