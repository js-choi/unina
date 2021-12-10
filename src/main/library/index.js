// # Database library of explicit character names
// This universal module exports a class that reads the database of Unicode
// names that is created by the `../compile/` module.
//
// The database is a string that contains the following database blocks:
// 1. Directory (JSON object)
// 2. Name table
//
// The **directory** is an object that maps string keys to integer values,
// stringified with JSON, then ending with the control character `U+0003` Start
// of Text. Most of the integer values are pointers: each indicates the position
// of each database block. The pointers are relative to the end of the
// directory, after the Start of Text control character.
//
// The **name table** is a string that encodes an indexed, randomly accessible
// table of name data that is lexicographically sorted by name.
//
// In this package, “pointer” refers to a position inside of the database or a
// data block: an integer that is at least zero.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import NameTable from './name-table/';

import { directoryEndToken, sliceByLength } from '../string/';
import { until } from '../iterator/';

// ## Directory

// This function reads the directory block from the given `database`. It returns
// a string, excluding the `directoryEndToken`.
export function readDirectory (database) {
  return Array.from(until(database, directoryEndToken)).join('');
}

// ## Library class
// This class initializes and reads a database object. It has a similar
// interface to `UninameLibrary` in the `../` module.
export default class DatabaseLibrary {
  #nameTable;

  // `database` must be a compiled database string.
  constructor (database) {
    const directoryBlock = readDirectory(database);
    const { nameTableDirectory } = JSON.parse(directoryBlock);

    const basePointer = directoryBlock.length + directoryEndToken.length;

    // The database body currently extends to the end of the database.
    const bodyBlock = database.slice(basePointer);

    // The name table currently occupies the only block in the database body.
    this.#nameTable = new NameTable(bodyBlock, nameTableDirectory);
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `../fuzzy-fold/` module.
  // Returns a string or `undefined`.
  get (fuzzyName) {
    return this.#nameTable.get(fuzzyName);
  }

  // Gets name entries for all names of the given `input` string. It returns an
  // array of name entries (see `main/name-entry/` for more information).
  getNameEntries (input) {
    return this.#nameTable.getNameEntries(input);
  }
}
