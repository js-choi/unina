// # Math utilities
// This universal module exports utilities for transforming bits and integers.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// All hexes are in base 16.
export const hexBase = 16;

// This function gets the number of digits that the given integer `value` has,
// in the given `base` number.
export function getNumOfDigits (value, base) {
  if (!Number.isInteger(base) || base < 0)
    throw new TypeError(`Invalid number base ${base}.`)
  else if (value === 0)
    return 1;
  else
    return Math.floor(Math.log2(value) / Math.log2(base)) + 1;
}

// This function sums the given `deltaNumber` with the last number in the given
// `arrayOfSums` (or `0`, if `arrayOfSums` is empty). The new sum is pushed into
// the `arrayOfSums`. It is intended for use with the `reduce` method of a
// number array.
export function arrayOfSumsReducer (arrayOfSums, deltaNumber) {
  const previousSum = arrayOfSums[arrayOfSums.length - 1] || 0;
  const nextSum = previousSum + deltaNumber;
  arrayOfSums.push(nextSum);
  return arrayOfSums;
}
