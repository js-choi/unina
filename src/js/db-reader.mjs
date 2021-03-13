// # Database compilation
// This universal module exports a class that reads the database of Unicode
// names that is created by the [`#js/db-compiler` module][].
//
// The database is a plain JavaScript array of name ranges, created by the
// [`#js/name-range/` modules][]. In this case, both name-to-character lookup
// and character-to-name access require sequentially checking each line for
// matches.
//
// [`#js/db-compiler` module]: ./db-compiler.mjs
// [`#js/name-range/` modules]: ./name-range/README.md
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '#js/fuzzy-folder';
import * as NameCounter from '#js/name-counter';

// This function attempts to find a character (or UTF-16 surrogate) with the
// given `fuzzyName` in the given `database` string. The `fuzzyName` must
// already have been fuzzily folded with the [`#js/fuzzy-folder` module][].
// The function returns a string (the character or surrogate) or `undefined`.
//
// [`#js/fuzzy-folder` module]: ./fuzzy-folder.mjs
export function get (database, fuzzyName) {
  // We rename the argument variable `inputFuzzyName` to distinguish it from
  // database name ranges’ name stems. (We generally avoid giving redundant
  // words like “input” to argument names.)
  const inputFuzzyName = fuzzyName;

  const nameRangeArray = database;

  for (const nameRange of nameRangeArray) {
    const {
      initialHeadPoint,
      length = 1,
      nameStem,
      nameCounterType,
      tailScalarArray = [],
    } = nameRange;

    // The name range’s name stem is not stored in a fuzzy form. This is
    // because the `getNameEntries` function needs to be able to return the
    // its original names.
    const fuzzyNameStem = fuzzilyFold(nameStem);

    if (inputFuzzyName.startsWith(fuzzyNameStem)) {
      // In this case, the name range might match the `inputFuzzyName`. The
      // name range’s `nameStem` fuzzily matches the `inputFuzzyName` as a
      // prefix. The remaining characters in the `inputFuzzyName` are extracted
      // into a **name counter**.
      const fuzzyNameCounter = inputFuzzyName.substring(fuzzyNameStem.length);

      const headPoint = NameCounter.parse(
        fuzzyNameCounter,
        nameCounterType,
        initialHeadPoint,
        length,
      );

      if (headPoint != null) {
        // In this case, we successfully obtained a `headPoint` from the
        // `inputFuzzyName`’s `fuzzyNameCounter` and the name range. We combine
        // that `headPoint` with any tail scalars the name range has, and we
        // return the resulting character string.
        return String.fromCodePoint(headPoint, ...tailScalarArray);
      }

      else {
        // In this case, the `inputFuzzyName` matched the `fuzzyNameStem`, but
        // the `fuzzyNameCounter` that was left over from the `inputFuzzyName`
        // did not match the name range. The loop continues onto the next name
        // range.
      }
    }

    else {
      // In this case, the `inputFuzzyName` does not even fuzzily start with
      // the name range’s name stem, and therefore the `inputFuzzyName` cannot
      // match the name range. The loop continues onto the next range.
    }
  }

  // In this case, there was no match with any name range in the database.
  return undefined;
}

// This function gets name entries for all names of the given `value` string
// from the given `database` object. If `value` is a named Unicode value, then
// this function returns an array of name entries (see the [`#js/name-entry`
// module][] for more information); otherwise, the function returns an empty
// array.
//
// [`#js/name-entry` module]: ./name-entry.mjs
export function getNameEntries (database, value) {
  const nameRangeArray = database;
  const inputHeadPoint = value.codePointAt(0);
  const inputHead = String.fromCodePoint(inputHeadPoint);
  const inputTail = value.substring(inputHead.length);

  const nameEntryArray = [];

  for (const nameRange of nameRangeArray) {
    const {
      initialHeadPoint,
      length = 1,
      nameType = null,
      nameStem,
      nameCounterType,
      tailScalarArray = [],
    } = nameRange;

    const headPointExclusiveMax = initialHeadPoint + length;
    const tail = String.fromCodePoint(...tailScalarArray);
    const valueMatchesNameRange =
      initialHeadPoint <= inputHeadPoint
      && inputHeadPoint < headPointExclusiveMax
      && inputTail === tail;

    if (valueMatchesNameRange) {
      // In this case, the input `value` matches the name range, and therefore
      // we add a corresponding name entry to the array of result name entries.
      const nameCounter = NameCounter.derive(inputHeadPoint, nameCounterType);
      const name = nameStem + nameCounter;
      const nameEntry = [ name, nameType ];
      nameEntryArray.push(nameEntry);
    }
  }

  return nameEntryArray;
}
