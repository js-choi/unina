// # Compilation of database integer vectors
// This universal module exports a function that creates immutable, indexable
// vectors of unsigned integers, encoded as a string in a sequence of
// fixed-length hex strings.
//
// For information on the format of integer vectors, see the documentation in
// `../../library/integer-vector/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { hexBase, getNumOfDigits } from '../../../main/math/';
import { getPaddedHexFromNumber } from '../../../main/string/';

const defaultNumOfHexesPerEntry = 0;

// This function creates a string that encodes a vector of fixed-length unsigned
// integers. It returns an object `{ block, directory: { numOfHexesPerEntry }
// }`, where `block` is the string and `numOfHexesPerEntry` is an integer.
export default function compileIntegerVector (valueArray) {
  if (!Array.isArray(valueArray)) {
    throw new TypeError(
      `Vector input ${ valueArray } must be an array.`);
  }

  const numOfEntries = valueArray.length;

  // If `valueArray` is empty, then `Math.max` returns `-Infinity`.
  const maxValue = Math.max(...valueArray);

  const numOfHexesPerEntry = getNumOfDigits(maxValue, hexBase)
    // If `maxValue` is `-Infinity`, then `getNumOfDigits` returns `NaN`.
    || defaultNumOfHexesPerEntry;

  const directory = { numOfHexesPerEntry };

  const block = valueArray
    .map(value => getPaddedHexFromNumber(value, numOfHexesPerEntry))
    .join('');

  return { block, directory };
}
