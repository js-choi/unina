// # Database library of explicit character names
// This universal module exports a class that reads the database of Unicode
// names that is created by the `/src/main/compile/` module.
//
// The database is a JSON string encoding an array of name objects, created by
// `/src/main/name-object/`. In this case, both name→character lookup and
// character→name access require sequentially checking each line for matches.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import { compareNameTypes } from '../name-type/';
import { parseName, deriveName } from '../name-counter/';
import { getNumOfScalarUTF16CodeUnits } from '../string/';

// ## Library class
// This class initializes and reads a database object. It has a similar
// interface to `UninameLibrary` in the `/src/main/` module.

export default class DatabaseLibrary {
  #nameObjectArray;

  // `database` is expected to be a compiled database string.
  constructor (database) {
    this.#nameObjectArray = JSON.parse(database);
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `/src/main/fuzzy-fold/`
  // module. Returns a string or undefined.
  getFromFuzzy (inputFuzzyName) {
    // These data extracted from the input name will be used to check each name
    // object for a match with the input name.
    const {
      // This is a substring of the `inputFuzzyName`.
      nameStem: inputFuzzyNameStem,
      // This is either a string (like `'HEX'`) or null.
      nameCounterType: inputNameCounterType = null,
      // This is a non-negative integer or undefined.
      nameCounterValue: inputNameCounterValue,
    } = parseName(inputFuzzyName);

    // Check each name object in the library for a match with the input name.
    for (const nameObject of this.#nameObjectArray) {
      const {
        headScalarRangeInitial, headScalarRangeLength = 1,
        nameStem, nameCounterType = null,
        nameCounterInitial = headScalarRangeInitial,
        tailScalarArray = [],
      } = nameObject;

      // If the name object has a non-nullish name counter (like `'HEX'`), then
      // the name object’s name-counter range (like between `0` inclusive and
      // `5` exclusive or between `0xFFFE` inclusive and `0x10000` exclusive) is
      // defined by its `nameCounterInitial` and its `headScalarRangeLength`.
      const nameCounterEnd =
        nameCounterInitial + headScalarRangeLength;

      // In order to match the input name…
      const nameObjectMatchesInput =
        // …the name object must share the same fuzzily folded name stem as the
        // input name…
        inputFuzzyNameStem === fuzzilyFold(nameStem, nameCounterType)
        // …and the name object must also share the same name counter, like
        // null or `'HEX'`, with the input name…
        && inputNameCounterType === nameCounterType
        // …and, if the input name has a non-nullish name counter (like
        // `'HEX'`), then the name object must have a name-counter range (like
        // between `0` and `5` or `FFFE` and `FFFF`) that contains the input
        // name’s counter index.
        && (inputNameCounterType == null || (
          nameCounterInitial <= inputNameCounterValue
          && inputNameCounterValue < nameCounterEnd
        ));

      if (nameObjectMatchesInput) {
        // If the name object matches the input name, then its head scalar is
        // defined by the name object’s `headScalarRangeInitial` and the input
        // name’s `inputNameCounterValue`.
        const headScalar = headScalarRangeInitial;

        return String.fromCodePoint(headScalar, ...tailScalarArray);
      }
    }
  }

  // Gets name entries for all names of the given `input` string. It returns an
  // array of name entries (see `main/name-entry/` for more information).
  getNameEntries (input) {
    const inputHeadScalar = input.codePointAt(0);

    // `inputTail` is usually an empty string (whenever the input string is made
    // of one code point). `inputTail` is not empty when the input is a named
    // character sequence.
    const inputTailUTF16Index = getNumOfScalarUTF16CodeUnits(inputHeadScalar);
    const inputTailString = input.substring(inputTailUTF16Index);

    // This array will be the returned result.
    const nameEntries = [];

    for (const nameObject of this.#nameObjectArray) {
      const {
        headScalarRangeInitial, headScalarRangeLength = 1,
        nameStem, nameCounterType = null,
        nameCounterInitial = headScalarRangeInitial,
        nameType = null, tailScalarArray = []
      } = nameObject;

      const headScalarRangeEnd =
        headScalarRangeInitial + headScalarRangeLength;

      const inputHeadScalarIsWithinNameObjectRange =
        headScalarRangeInitial <= inputHeadScalar
        && inputHeadScalar < headScalarRangeEnd;

      if (inputHeadScalarIsWithinNameObjectRange) {
        const tailString = String.fromCodePoint(...tailScalarArray);

        if (inputTailString === tailString) {
          // In this case, a matching character has been found.

          // Get the value of the name counter, which is the offset of the
          // `inputHeadScalar` from the matching name object – plus the
          // `nameCounterInitial` from the matching name object.
          //
          // If `nameCounterInitial` is the default value of
          // `headScalarRangeInitial`, then they will cancel each other out and
          // the `nameCounterValue` is simply the `inputHeadScalar` (e.g., this
          // occurs when `nameCounterType` is `'HEX'`.)
          //
          // If `nameCounterInitial` is something like `0` or `1`, then the the
          // `nameCounterValue` is `nameCounterInitial` plus the offset (e.g.,
          // this occurs when `nameCounterType` is `HANGULSYLLABLE`.)
          const nameCounterValue = nameCounterInitial
            + inputHeadScalar - headScalarRangeInitial;

          const name =
            deriveName({ nameStem, nameCounterType, nameCounterValue });

          // Create a name entry and add it to the result array.
          nameEntries.push({ name, nameType });
        }
      }

      // This optimization causes the loop to break if a line fails to match
      // after the previous line(s) did match. This works because the
      // database’s name objects are sorted by `headScalarRangeInitial`, which
      // guarantees that there will be no matches if the input head scalar
      // exceeds the current head-scalar range’s maximum.
      else if (inputHeadScalar < headScalarRangeInitial)
        break;
    }

    return nameEntries;
  }
}
