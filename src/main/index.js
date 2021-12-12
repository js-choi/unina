// # Main module
// This module exports the main API of the package.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import DatabaseLibrary from './library/';
import { getCodePointLabel, getCodePointLabelEntry } from './code-point-label/';
import { getHexNameCharacter, getHexStrictNameEntry } from './hex-name/';
import { getHangulSyllable } from './hangul-syllable/';
import { compareNameEntries } from './name-entry/';
import fuzzilyFold from './fuzzy-fold/';

// This class forms the public API of the package.
export default class UninameLibrary {
  #databaseLibrary;

  // `database` is expected to be the result of the `compile` static method.
  constructor (database) {
    this.#databaseLibrary = new DatabaseLibrary(database);
  }

  // Attempts to find a character for each given name. Fuzzy name matching is
  // used. Returns a string or undefined. Throws a `TypeError` if any given
  // argument is not a string.
  get (...nameArray) {
    const joinedString = nameArray
      .map(name => {
        if (typeof name !== 'string')
          throw new TypeError(`Invalid name given to getString method (${name})`);
        const fuzzyName = fuzzilyFold(name);
        // These expressions are disjoint, and they are ordered roughly by how
        // computationally expensive they are.
        // TODO Remove getHexNameCharacter and getHangulSyllable
        return getHexNameCharacter(fuzzyName)
          || getHangulSyllable(fuzzyName)
          || this.#databaseLibrary.getFromFuzzy(fuzzyName);
      })
      .join('');

    return joinedString || undefined;
  }

  // Gets entries of all names of the given `input` character, noncharacter, or
  // surrogate string. It returns an array of name entry pairs, where each pair
  // looks like `[ name, nameType ]`.
  //
  // `name` is a name string. `nameType` is:
  // * `'CORRECTION'` when `name` is a correction alias.
  // * null when `name` is a strict Name property value.
  // * `'SEQUENCE'` when `name` signifies a named character sequence.
  // * `'CONTROL'` when `name` is a control alias.
  // * `'ALTERNATE'` when `name` is an alternate alias.
  // * `'LABEL'` when `name` is a code-point label like `'control-0000'`.
  // * `'FIGMENT'` when `name` is a figment alias.
  // * `'ABBREVIATION'` when `name` is an abbreviation alias.

  // Throws a `TypeError` if the given `character` is not a string.
  getNameEntries (input) {
    if (typeof input !== 'string')
      throw new TypeError(
        `Invalid input given to getName (${ JSON.stringify(input) })`);

    const possibleNameEntries =
      this.#databaseLibrary.getNameEntries(input);

    return possibleNameEntries
      .filter(entry => entry)
      .sort(compareNameEntries);
  }

  // Gets the preferred name of the given `input` character, noncharacter, or
  // surrogate string. Returns a name string or undefined.
  //
  // If the `input` string is a named character sequence, then that sequence’s
  // name is returned.
  //
  // If the `input` string has a correction alias, that is preferentially
  // returned instead of its strict Unicode name.
  //
  // If the `input` string has no strict Unicode name, then its first alias is
  // returned or, if it has no aliases, a code-point label like `'control-0000'`
  // is returned.
  //
  // Throws a `TypeError` if the given `input` is not a string.
  getPreferredName (input) {
    const [ firstNameEntry ] = this.getNameEntries(input);
    return firstNameEntry?.name;
  }
}
