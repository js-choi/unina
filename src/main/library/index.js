// # Database library of explicit character names
// This universal module exports a class that reads the database of Unicode
// names that is created by the `../compile/` module.
//
// The database is a JSON string encoding an array of name objects, created by
// `../name-object/`. In this case, both name-to-character lookup and
// character-to-name access require sequentially checking each line for matches.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import { compareNameTypes } from '../name-type/';

// ## Library class
// This class initializes and reads a database object. It has a similar
// interface to `UninameLibrary` in the `../` module.
export default class DatabaseLibrary {
  #nameObjectArray;

  // `database` is expected to be a compiled database string.
  constructor (database) {
    this.#nameObjectArray = JSON.parse(database);
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `../fuzzy-fold/` module.
  // Returns a string or `undefined`.
  get (fuzzyName) {
    for (const nameObject of this.#nameObjectArray) {
      const { headScalar, name, tailScalarArray = [] } = nameObject;
      if (fuzzyName === fuzzilyFold(name))
        return String.fromCodePoint(headScalar, ...tailScalarArray);
    }
  }

  // Gets name entries for all names of the given `input` string. It returns an
  // array of name entries (see `main/name-entry/` for more information).
  getNameEntries (input) {
    const nameEntries = [];
    for (const nameObject of this.#nameObjectArray) {
      const { headScalar, name, nameType, tailScalarArray = [] } = nameObject;
      const character = String.fromCodePoint(headScalar, ...tailScalarArray);

      if (input === character)
        nameEntries.push([ name, nameType ]);

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
