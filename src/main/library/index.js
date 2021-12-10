// # Database library of explicit character names
// This universal module exports a class that reads the database of Unicode
// names that is created by the `../compile/` module.
//
// The database is a JSON string encoding an array of name objects, created by
// `../name-object/`. In this case, both name-to-character lookup and
// character-to-name access require sequentially checking each line for matches.
//
// Each line in the file looks like: `‹headScalarHex›:‹name›‹nameInfo›`.
// * The **`‹headScalarHex›`** is a single scalar hex, stripped of leading `0`s.
//   (For named character sequences, this is the first scalar’s hex.)
// * The **`‹name›`** is a character name, in all caps, and using spaces
//   and `-`.
// * The **`‹nameInfo›`** is one of the following.
//     * For **strict** Name property values: an empty string.
//     * For name **aliases**: `:CORRECTION` for corrections,
//       `:CONTROL` for controls, `:ALTERNATE` for alternates,
//       `:FIGMENT` for figments, or `:ABBREVIATION` for abbreviations.
//     * For named character **sequences**: `:SEQUENCE` followed by a sequence
//       of hexes for the remaining scalar hexes that follow the head scalar.
//       Each hex is also preceded by `:` and is stripped of leading `0`s.
//
// For example:
// * The line for `U+0021` Exclamation Mark is `21:EXCLAMATION MARK`.
// * The two lines for `U+0000`’s two aliases `NULL` (a control alias)
//   and `NUL` (an abbreviation alias) are `0:NULL:CONTROL`
//   and `0:NUL:ABBREVIATION`.
// * The line for the named character sequence `U+0023 U+FE0F U+20E3` Keycap
//   Number Sign is `23:KEYCAP NUMBER SIGN:SEQUENCE:FE0F:20E3`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import { compareNameTypes } from '../name-type/';
import { lineSeparator, fieldSeparator, getNumberFromHex } from '../string/';

// ## Helper functions
// This helper function converts scalar hexes into a character.
function getStringFromHexes (...scalarHexes) {
  return String.fromCodePoint(...scalarHexes.map(getNumberFromHex));
}

// This generator yields lines from the given `database`, which must be a
// string.
function * generateLines (database) {
  let line = '';
  for (const character of database) {
    if (character !== lineSeparator)
      line += character;
    else {
      yield line;
      line = '';
    }
  }
  yield line;
}

// ## Library class
// This class initializes and reads a database object. It has a similar
// interface to `UninameLibrary` in the `../` module.
export default class DatabaseLibrary {
  #database;

  // `database` is expected to be a compiled database string.
  constructor (database) {
    this.#database = database;
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `../fuzzy-fold/` module.
  // Returns a string or `undefined`.
  get (fuzzyName) {
    for (const databaseLine of generateLines(this.#database)) {
      const [ headScalarHex, name, , ...tailScalarHexArray ] =
        databaseLine.split(fieldSeparator);
      if (fuzzyName === fuzzilyFold(name))
        return getStringFromHexes(headScalarHex, ...tailScalarHexArray);
    }
  }

  // Gets name entries for all names of the given `input` string. It returns an
  // array of name entries (see `main/name-entry/` for more information).
  getNameEntries (input) {
    const nameEntries = [];
    for (const databaseLine of generateLines(this.#database)) {
      const [ headScalarHex, name, uppercaseNameType, ...tailScalarHexArray ] =
        databaseLine.split(fieldSeparator);
      const character = getStringFromHexes(
        headScalarHex, ...tailScalarHexArray);

      if (character === input) {
        const nameType = uppercaseNameType?.toLowerCase() || null;
        nameEntries.push([ name, nameType ]);
      }

      // This optimization causes the loop to break if a line fails to match
      // after the previous line(s) did match. This works because the database’s
      // lines are sorted so that all lines with identical characters are
      // grouped together.
      else if (nameEntries.length)
        break;
    }
    return nameEntries;
  }
}
