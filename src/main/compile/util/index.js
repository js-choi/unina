// # Utilities for compilation of database
// This universal module exports utilities useful only for compiling the
// database of Unicode names. Because they are not used when reading the
// database, these utilities are not put in `../../string/`, which is imported
// by both `../` and `../../library/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { arrayOfSumsReducer } from '../../math/';
import searchAll from '../../binary-search/';

// Blocks in the name table are separated by two newlines. This is only for
// human readability; it does not affect machine lookup and access.
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

// This function finds the “ancestors” of the entry with the given `entryIndex`
// number, starting with the root entry index. It returns an array of integers.
// An ancestor entry is the median entry at each step of the binary search for
// the given entry.
//
// We use this “parent entry” concept to compress data using delta encoding.
// This function returns an empty array if the given entry has no parent,
// i.e., if the given entry is the root entry.
export function getAncestorPath (entryIndex, numOfEntries) {
  return Array.from(searchAll(numOfEntries, (currentEntryIndex, resultStack) => {
    switch (Math.sign(entryIndex - currentEntryIndex)) {
      case -1:
        // In this case, the current entry precedes the given goal entry. The
        // search callback will return a result object with an instruction to
        // next search the current entry’s preceding child back to `searchAll`.
        // In addition, the returned object (which includes the current entry’s
        // index) will be pushed into the next search step’s `resultStack`.
        return { nextDirection: 'before', value: currentEntryIndex };
      case +1:
        // In this case, the current entry precedes the given goal entry. The
        // search callback will return a result object with an instruction to
        // next search the current entry’s preceding child back to `searchAll`.
        // In addition, the returned object (which includes the current entry’s
        // index) will be pushed into the next search step’s `resultStack`.
        return { nextDirection: 'after', value: currentEntryIndex };
      case 0:
        // In this case, the current entry matches the given goal entry. The
        // search is done: the search callback will return a result object
        // stating the search is complete, with a value of the previously
        // visited parent entry index. This is `undefined` if the `resultStack`
        // is empty – i.e., if the current entry has no parent – i.e., if the
        // current entry is the root entry.
        return { value: resultStack[resultStack.length - 1]?.value };
    }
  }));
}
