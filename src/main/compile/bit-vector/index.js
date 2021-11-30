// # Compilation of database bit vectors
// This universal module exports a function that creates immutable, indexable vectors
// of bits, encoded as hex strings.
//
// For information on the format of integer vectors, see the documentation in
// `../../library/bit-vector/`.

import { hexBase, numOfBitsPerHex } from '../../../main/math/';
import { getHexFromNumber } from '../../../main/string/';

// This helper function turns on a bit to true,
// at `trueIndex` in the given `integerArray`.
// It mutates the `integerArray` and returns it.
function integerReducer (integerArray, trueIndex) {
  const integerIndex = Math.floor(trueIndex / numOfBitsPerHex);
  const bitIndex = trueIndex % numOfBitsPerHex;
  const trueMask = Number(true) << bitIndex;

  integerArray[integerIndex] |= trueMask;

  return integerArray;
}

// This function creates a string that encodes
// a vector of fixed-length bits.
// It returns an object `{ block }`, where `block` is the string.
// `trueIndexArray` must be an array of integers that denote the positions of true bits.
// All other bits are considered false bits.
export default function compileBitVector (trueIndexArray) {
  // Each integer is a 4-bit nibble (half of a byte), encodable by a single hex.
  const numOfIntegers = Math.ceil(Math.max(...trueIndexArray) / numOfBitsPerHex);
  const emptyInteger = 0;

  const integerArray = new Array(numOfIntegers);
  integerArray.fill(emptyInteger);

  trueIndexArray.reduce(integerReducer, integerArray);

  const block = integerArray
    .map(value => getHexFromNumber(value))
    .join('');
  return { block };
}
