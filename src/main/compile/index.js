// # Database compilation
// This universal module exports a function that creates a database of Unicode
// names from the name objects created by the `../name-object/` module. The
// database can then be read by the `../library/` module.
//
// For information on the format of the database, see the documentation in
// `../library/`. For information on name objects, see the documentation in
// `../name-object/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import compileNameTable from './name-table/';
import compileBlock, { blockSeparator } from './util/';

import { directoryEndToken, collator } from '../../main/string/';
import fuzzilyFold from '../../main/fuzzy-fold/';

// ## Directory
// The **directory** is an object that maps string keys to integer values,
// stringified with JSON, then ending with the control character `U+0003`
// Pointer of Text. Most of the integer values are pointers: each indicates the
// position of each database block. The pointers are relative to the end of the
// directory, after the Pointer of Text control character.

// This helper function creates a string that encodes the given object in JSON.
function compileDirectory (directory) {
  return JSON.stringify(directory) + blockSeparator + directoryEndToken;
}

// ## Database
// The **database** is a memory-mappable, randomly accessible data structure,
// encoded in a long plain-text UTF-8/ASCII string.

// This helper function lexicographically compares two name objects’ `name`s,
// after fuzzily folding both of them, then a Default Unicode Collation Element
// Table collator. It returns a negative number, zero, or a positive number.
function compareByFuzzyName (nameObject0, nameObject1) {
  return collator.compare(
    fuzzilyFold(nameObject0.name),
    fuzzilyFold(nameObject1.name));
}

// This async function compiles Unicode name data into a single string, which
// may be saved to a file. The `nameObjectArrayByScalar` is an array of name
// objects, extracted from the UCD source text by the `../name-object/` module,
// ordered by head scalar.
export default function compileDatabase (nameObjectArrayByScalar) {
  // Create an array of name objects, lexicographically sorted by fuzzily folded
  // name.
  const nameObjectArrayByFuzzyName =
    Array.from(nameObjectArrayByScalar).sort(compareByFuzzyName);

  // Compile the name table.
  const { block: nameTableBlock, directory: nameTableDirectory } =
    compileNameTable(nameObjectArrayByFuzzyName);

  // Compile the database body.
  const subblockArray = [
    nameTableBlock,
  ];

  const {
    block: databaseBody,
    pointerArray: [
      nameTablePointer,
      length,
    ],
  } = compileBlock(subblockArray);

  // Compile the directory.
  const directory = {
    nameTableDirectory,
  };

  const directoryBlock = compileDirectory(directory);

  // Combine the directory block and the database body block.
  return directoryBlock + databaseBody;
}
