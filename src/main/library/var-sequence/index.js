// # Database-library variable-length sequence
// This universal module exports a class of immutable, indexable sequences of
// variable-length strings, itself encoded as a block of **values**.
//
// The sequence contains the following blocks:
// 1. Values (concatenation of variable-length values)
// 2. Separation vector (fixed-length integer vector)
//
// There is one separation integer for each pair of values, and the values are
// lexicographically ordered by their character names. The integers are
// pointers: each indicates the position between each pair of values from the
// values block. The pointers are relative to the beginning of the values block.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import IntegerVector from '../integer-vector/';

export default class VariableSequence {
  // The string that stores the string values’ data.
  #valuesBlock;
  // The integer vector that stores pointers to the separations between the
  // string values.
  #separationVector;

  // `block` must be a string. The `directory` must be an object `{
  // separationVectorPointer, separationVector }`.
  constructor (block, directory) {
    const { separationVectorPointer, separationVectorDirectory } = directory;

    this.#valuesBlock = block.slice(0, separationVectorPointer);

    const separationVectorBlock = block.slice(separationVectorPointer);

    this.#separationVector =
      new IntegerVector(separationVectorBlock, separationVectorDirectory);
  }

  // This method gets the string value for a given `entryIndex`. If there is no
  // such value, then this method returns `undefined`.
  get (entryIndex) {
    // The index of the starting value separation is one less than the entry
    // index. This is because the separation vector does not include the
    // separation preceding the zeroth value.
    const valueMinPointer =
      entryIndex === 0 ? 0 : this.#separationVector.get(entryIndex - 1);
    const valueMaxPointer =
      this.#separationVector.get(entryIndex);
    return this.#valuesBlock.slice(valueMinPointer, valueMaxPointer);
  }
}
