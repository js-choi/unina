// # Database library of explicit character names
// This universal module exports a class that reads the database of Unicode
// names that is created by the `../compile/` module.
//
// The database is a JSON string encoding an array of name objects, created by
// `../name-object/`. In this case, both name-to-character lookup and
// character-to-name access require sequentially checking each line for matches.
//
// Each line in the file looks like: `‹headScalarDeltaHex›:‹name›‹nameInfo›`.
// * The **`‹headScalarDeltaHex›`** is a single hex of the scalar delta from the
//   previous line’s head scalar. The head scalar delta will usually be `1` (one
//   scalar after the previous line’s) or `0` (the same head scalar as the
//   previous line’s). (For each named character sequence, if its previous line
//   was also for a named character sequence, then the delta is compared to
//   those sequences’ head scalars.)
//
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
// * The line for `U+0021` Exclamation Mark is `1:EXCLAMATION MARK`, because its
//   preceding line is for `U+0020`, and `0021` − `0020` = `1`.
// * The two lines for `U+0003`’s two aliases –
//   `END OF TRANSMISSION` (a control alias) and `EOT` (an abbreviation alias) –
//   are `1:END OF TRANSMISSION:CONTROL` and `0:EOT:ABBREVIATION`.
//   The first line’s `‹scalarDeltaHex›` is `1` because its previous line’s
//   head scalar is `0003`, and `0004` − `0003` = `1`.
//   The second line’s `‹headScalarDeltaHex›` is `0` because both it and its
//   previous line have the head scalar `U+0003`, and `0003` − `0003` = `0`.
// * The line for the named character sequence –
//   `U+0023 U+FE0F U+20E3` Keycap Number Sign –
//   is `1:KEYCAP NUMBER SIGN:SEQUENCE:FE0F:20E3`,
//   because its previous line’s head scalar is `0022`,
//   and `0023` − `0022` = `1`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import { compareNameTypes } from '../name-type/';
import { lineSeparator, fieldSeparator, getNumberFromHex } from '../string/';

// ## Helper functions
// This helper function converts line data into a character.
function getCharacterFromLineData (headScalar, tailScalarHexArray) {
  const tailScalarArray = tailScalarHexArray.map(getNumberFromHex);
  return String.fromCodePoint(headScalar, ...tailScalarArray);
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
    let previousHeadScalar = 0;

    for (const databaseLine of generateLines(this.#database)) {
      const [ headScalarDeltaHex, name, , ...tailScalarHexArray ] =
        databaseLine.split(fieldSeparator);
      const headScalar =
        previousHeadScalar + getNumberFromHex(headScalarDeltaHex);

      if (fuzzyName === fuzzilyFold(name))
        return getCharacterFromLineData(headScalar, tailScalarHexArray);
      else
        previousHeadScalar = headScalar;
    }
  }

  // Gets name entries for all names of the given `input` string. It returns an
  // array of name entries (see `main/name-entry/` for more information).
  getNameEntries (input) {
    const nameEntries = [];
    let previousHeadScalar = 0;

    for (const databaseLine of generateLines(this.#database)) {
      const [
        headScalarDeltaHex, name, uppercaseNameType, ...tailScalarHexArray
      ] = databaseLine.split(fieldSeparator);

      const headScalar =
        previousHeadScalar + getNumberFromHex(headScalarDeltaHex);
      const character =
        getCharacterFromLineData(headScalar, tailScalarHexArray);

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

      previousHeadScalar = headScalar;
    }

    return nameEntries;
  }
}
