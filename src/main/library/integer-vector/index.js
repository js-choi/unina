// # Database-library integer vector
// This universal module exports a class of immutable, indexable vectors of
// unsigned integers, encoded as a string in a sequence of fixed-length hex
// strings.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { getNumberFromHex, sliceByLength } from '../../string/';

export default class IntegerVector {
  // The string that stores the vector’s data.
  #block;
  // The number of hex digits per entry.
  #numOfHexesPerEntry;

  // This static method is a convenience constructor. It slices data out of the
  // `containingData` string, starting at the given `slicePointer` relative to
  // the beginning of `containingData`, and using the given `numOfEntries` and
  // the vector `directory` to get the slice’s length. It then constructs and
  // returns a vector using that slice as its data.
  static fromSlice (containingData, numOfEntries, slicePointer, directory) {
    const lengthOfSlice = numOfEntries * directory.numOfHexesPerEntry;
    const data = sliceByLength(containingData, slicePointer, lengthOfSlice);
    return new IntegerVector(data, directory);
  }

  // `block` must be a string. The `directory` must be an object with a
  // `numOfHexesPerEntry` integer property. The length of `block` must be an
  // integer multiple of `numOfHexesPerEntry`.
  constructor (block, directory) {
    this.#block = block;
    this.#numOfHexesPerEntry = directory.numOfHexesPerEntry;
  }

  // This method gets the integer value for a given `entryIndex`. If there is no
  // such value, then this method returns `undefined`.
  get (entryIndex) {
    const entryStartingPointer = this.#numOfHexesPerEntry * entryIndex;
    const entryHex =
      sliceByLength(this.#block, entryStartingPointer, this.#numOfHexesPerEntry);
    return getNumberFromHex(entryHex);
  }
}
