// # Main module
// This module exports the main API of the package.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//! Data from the Unicode Character Database are distributed under the [Unicode
//! Terms of Use][].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/
//! [Unicode Terms of Use]: https://www.unicode.org/copyright.html

import * as DBReader from '#js/db-reader';
import { compareEntries } from '#js/name';
import fuzzilyFold from '#js/fuzzy-folder';

// The database module is expected to have already been created by the [build
// script](scripts/build.mjs).
import database from '#build/database' assert { type: 'json' };

// This function attempts to find a named Unicode value for each given name.
// Fuzzy name matching is used. Returns a concatenated string or `undefined`.
//
// In addition to strict Unicode names, this function also supports name
// aliases and code-point labels like `'control-0000'` or `'surrogate-D800'`.
// (However, `'reserved-` code labels for unassigned code points are *not*
// supported.)
//
// The function throws a `TypeError` if any given argument is not a string.
export function get (...nameArray) {
  function getEach (name) {
    if (typeof name !== 'string') {
      throw new TypeError(
        `Invalid name given to UninaLibrary get (${name}).`,
      );
    }

    const fuzzyName = fuzzilyFold(name);

    // These expressions are disjoint, and they are ordered roughly by how
    // computationally expensive they are.
    return DBReader.get(database, fuzzyName);
  }

  const valueArray = nameArray.map(getEach);

  // `valueArray` is “good” only when every value is not nullish (because the
  // `get` function from the [`#js/db-reader` module][] returns `undefined`
  // values whenever it is given a “bad” name).
  //
  // [`#js/db-reader` module]: ./db-reader.mjs
  if (valueArray.every(value => value != null)) {
    // In this case, the `valueArray` is good – i.e., the database found a
    // named Unicode value for every input name. Join the values together into
    // a single result string.
    return valueArray.join('');
  }

  else {
    // In this case, the `valueArray` is bad – i.e., the database failed to
    // find a named Unicode value for at least one input name.
    return undefined;
  }
}

// This function gets entries of all names of the given string `value`. It
// returns an array of name entries, where each pair is an array `[ name,
// nameType ]`.
//
// `name` is a name string. `nameType` is:
// * `'correction'` when `name` is a correction alias.
// * `null` when `name` is a strict character name (i.e., the Name character
//   property).
// * `'sequence'` when `name` signifies a named character sequence.
// * `'control'` when `name` is a control alias.
// * `'alternate'` when `name` is an alternative alias.
// * `'label'` when `name` is a code-point label like `'CONTROL-0000'` or
//   `'SURROGATE-D800'`. (`'RESERVED-` code labels for unassigned code points
//   are *not* supported due to their instability.)
// * `'figment'` when `name` is a figment alias.
// * `'abbreviation'` when `name` is an abbreviation alias.
//
// The function throws a `TypeError` if the given `value` is not a string.
export function getNameEntries (value) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Invalid input value given to UninaLibrary getName (${ value }).`,
    );
  }

  return DBReader.getNameEntries(database, value)
    .filter(entry => entry)
    .sort(compareEntries);
}

// This function gets the preferred name of the given string `value`. It
// returns a name string or `undefined`. The name is always in uppercase and
// may contain spaces ` ` or hyphens `-`.
//
// If the string `value` is a named character sequence, then that sequence’s
// name is returned.
//
// If the string `value` has a correction alias, that is preferentially
// returned instead of its strict Unicode name.
//
// If the string `value` has no strict Unicode name but it has an alias, then
// its first alias is returned.
//
// If the string `value` has no strict Unicode name or aliases, but it does
// have a code-point label like `'CONTROL-0000'` or `'SURROGATE-D800'`, then
// that code-point label is returned. (`'RESERVED-` code labels for unassigned
// code points are *not* supported.)
//
// If the `value` is not a string, then a `TypeError` is thrown.
//
// Otherwise, `undefined` is returned.
export function getPreferredName (value) {
  const [ firstNameEntry ] = getNameEntries(value);
  return firstNameEntry?.[0];
}
