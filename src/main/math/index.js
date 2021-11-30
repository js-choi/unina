// # Math utilities
// This universal module exports utilities for transforming bits and integers.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// All bits are in base 2.
export const bitBase = 2;

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

// All hexes are made of 4 bits;
// they are equivalent to nibbles or half-bytes.
export const numOfBitsPerHex = getNumOfDigits(hexBase, 2);

// This function counts how many true bits there are in the given 32-bit integer `input`.
// If `input` is greater than 32 bits long, then the more-significant bits are discarded.
// The function returns an unsigned integer.
// It was adapted from [code by Sean Eron Anderson][].
export function popCount (input) {
    const value0 = input - ((input >> 1) & 0x55555555);
    const value1 = (value0 & 0x33333333) + ((value0 >> 2) & 0x33333333);
    return ((value1 + (value1 >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}

// This function gets the index of the first bit that has the given `trueRankValue`
// in the given 32-bit `packedInteger`.
// If `input` is greater than 32 bits long, then the more-significant bits are discarded.
// The function returns an integer between 0 and 32.
export function selectInInteger (packedInteger, trueRankValue) {
  let currentRankValue = -1;

  for (let bitIndex = 0; bitIndex < numOfBitsPerHex; bitIndex++) {
    const bitMaskInteger = Number(true) << bitIndex;
    const bitIsTrue = Boolean(packedInteger & bitMaskInteger);

    if (bitIsTrue)
      currentRankValue++;

    if (currentRankValue >= trueRankValue)
      return bitIndex;
  }
}

// This function sums the given `deltaNumber`
// with the last number in the given `arrayOfSums`
// (or `0`, if `arrayOfSums` is empty).
// The new sum is pushed into the `arrayOfSums`.
// It is intended for use with the `reduce` method of a number array.
export function arrayOfSumsReducer (arrayOfSums, deltaNumber) {
  const previousSum = arrayOfSums[arrayOfSums.length - 1] || 0;
  const nextSum = previousSum + deltaNumber;
  arrayOfSums.push(nextSum);
  return arrayOfSums;
}

// [code by Sean Eron Anderson]: https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
