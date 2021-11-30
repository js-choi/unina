// # Database-library bit vector
// This universal module exports a class of immutable, indexable vectors
// of bits, encoded as hex strings.

import { numOfBitsPerHex, popCount, selectInInteger } from '../../math/';
import { getNumberFromHex, sliceByLength } from '../../string/';

export default class BitVector {
  // The string that stores the vector’s data.
  #block;

  // `block` must be a string.
  // The `directory` must be an object with a `numOfDigitsPerEntry` integer property.
  // The length of `block` must be an integer multiple of `numOfDigitsPerEntry`.
  constructor (block, directory) {
    this.#block = block;
  }

  // This helper method gets the index of the integer in `#block`
  // that contains the first true bit whose true-rank is the given `trueRankValue`.
  // It returns an object `{ integerValue, integerIndex, integerRankValue }`;
  // `integerRankValue` is the true-rank of the first bit in the integer.
  // If there is no such integer, then this method returns `undefined`.
  #findInteger (trueRankValue) {
    let totalPopCount = 0;

    for (let integerIndex = 0; integerIndex < this.#block.length; integerIndex++) {
      const hex = this.#block.charAt(integerIndex);
      const integerValue = getNumberFromHex(hex);
      const integerPopCount = popCount(integerValue);
      const totalPopCountAfterInteger = totalPopCount + integerPopCount;

      if (totalPopCountAfterInteger <= trueRankValue) {
        totalPopCount = totalPopCountAfterInteger;
      }

      else {
        return { integerValue, integerIndex, integerRankValue: totalPopCount };
      }
    }
  }

  // This method gets the index of the first bit that has the given `trueRankValue`.
  // `trueRankValue` must be an unsigned integer.
  // If there is no such bit, then this method returns `undefined`.
  select (trueRankValue) {
    const { integerValue, integerIndex, integerRankValue } =
      this.#findInteger(trueRankValue);

    if (integerIndex ?? false) {
      const bitIndex = selectInInteger(integerValue, trueRankValue - integerRankValue);
      return integerIndex * numOfBitsPerHex + bitIndex;
    }
  }
}
