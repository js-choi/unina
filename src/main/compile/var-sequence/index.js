// # Compilation of database variable-length sequences
// This universal module exports a function that compiles immutable, indexable
// collections of variable-length sequences.
//
// For information on the format of variable-length sequences, see the
// documentation in `../../library/var-sequence/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import compileIntegerVector from '../integer-vector/';

import { arrayOfSumsReducer } from '../../math/';
import compileBlock from '../util/';

// This helper function compiles a string that encodes a vector of fixed-length
// unsigned integers. Each integer indicates the position between each pair of
// values within the values block. The vector includes neither the separation
// preceding the zeroth value nor the separation following the final value. The
// function returns an object: `{ block, directory }`, where `block` is the
// string and `directory` is an object.
function compileSeparationVector (valueArray) {
  const separationPointerArray = valueArray
    .map(text => text.length)
    .reduce(arrayOfSumsReducer, []);
  return compileIntegerVector(separationPointerArray);
}

// This function compiles a string that encodes a sequence of variable-length
// strings. It returns an object: `{ block, directory: { pointers,
// separationVector }`, where `block` is the string and `pointers` and
// `separations` are objects.
export default function compileVariableSequence (valueArray) {
  const valuesBlock = valueArray.join('');

  const {
    block: separationVectorBlock,
    directory: separationVectorDirectory,
  } = compileSeparationVector(valueArray);

  const subblockArray = [
    valuesBlock,
    separationVectorBlock,
  ];

  const {
    block,
    pointerArray: [
      valuesPointer,
      separationVectorPointer,
      length,
    ],
  } = compileBlock(subblockArray);

  const directory = {
    valuesPointer,
    separationVectorPointer, separationVectorDirectory,
    length,
  };

  return { block, directory };
}
