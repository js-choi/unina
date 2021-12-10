// # Utilities for compilation of database
// This universal module exports utilities useful only for compiling the
// database of Unicode names. Because they are not used when reading the
// database, these utilities are not put in `../../string/`, which is imported
// by both `../` and `../../library/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { arrayOfSumsReducer } from '../../math/';

// Blocks in the name table are separated by two newlines. This is only for
// humanly readability; it does not affect machine lookup and access.
export const blockSeparator = '\n\n';

// The end of the directory (and the start of the database body) is marked by a
// `U+0003` Start of Text. This is the location of the database’s `basePointer`.
export const directoryEndToken = '\u0003';

// Certain specific fields in the database are separated by a delimiter.
export const fieldSeparator = ':';

// Blocks are strings. This function compiles a block from a given array of
// subblocks, separated by a block separator. It returns an object `{ block,
// pointerArray }`, where `block` is the single combined block, and
// `pointerArray` is an array of integer pointers to each subblock.
export default function compileBlock (subblockArray) {
  const pointerArray = subblockArray
    .map(block => block.length + blockSeparator.length)
    .reduce(arrayOfSumsReducer, [ 0 ]);

  const block = subblockArray.join(blockSeparator);

  return { block, pointerArray };
}
