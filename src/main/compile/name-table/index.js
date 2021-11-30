// # Compilation of database name table
// This universal module exports a function that compiles a name table. The
// **name table** is a string that encodes an indexed, randomly accessible table
// of name data that is lexicographically sorted by name.
//
// For information on the format of the name table, see the documentation in
// `../../library/name-table/`.
//
// For information on name objects, see the documentation in
// `../../name-object/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import compileIntegerVector from '../integer-vector/';
import compileVariableSequence from '../var-sequence/';
import compileBlock, { getAncestorPath } from '../util/';

import {
  fieldSeparator, getHexFromNumber, getMaxCommonPrefixLength,
} from '../../string/';

// An ancestor entry is the median entry at each step of the binary search for
// the given entry. This helper function finds the ancestor in the given
// `ancestorIndexPath` array whose name shares the longest common prefix with
// the given `nameObject`’s name. It returns an object `{ namePrefixLength,
// ancestorPathIndex }`, where `namePrefixLength` is the length of the shared
// name prefix, and `ancestorPathIndex` is the index integer of that ancestor
// within the `ancestorIndexPath` array.
function findMaxCommonAncestor (nameObject, ancestorIndexPath,
  nameObjectArrayByFuzzyName,
) {
  // This helper function is used with `ancestorIndexPath.reduce`.
  // It reduces an accumulation object `{ namePrefixLength, ancestorPathIndex }`,
  // which is described above.
  function maxCommonAncestorReducer (accumulation, ancestorIndex, ancestorPathIndex) {
    const ancestorObject = nameObjectArrayByFuzzyName[ancestorIndex];
    const namePrefixLength =
      getMaxCommonPrefixLength(nameObject.name, ancestorObject.name);
    if (namePrefixLength > accumulation.namePrefixLength)
      return { namePrefixLength, ancestorPathIndex };
    else
      return accumulation;
  }

  const initialAccumulation = { namePrefixLength: 0, ancestorPathIndex: 0 };

  return ancestorIndexPath.reduce(maxCommonAncestorReducer, initialAccumulation);
}

// This helper function creates two arrays of fixed-length integers and returns
// an object `{ namePrefixLengthArray, ancestorPathIndexArray }`. Each integer
// in `namePrefixLengthArray` indicates the length of the longest prefix that it
// shares with a certain ancestor entry (as determined by a binary search). Each
// integer in `ancestorPathIndexArray` indicates the index integer of that
// ancestor within the binary search’s path, starting from the root entry at 0.
function createAncestorData (nameObjectArrayByFuzzyName) {
  const numOfEntries = nameObjectArrayByFuzzyName.length;
  const maxAncestorResultArray = nameObjectArrayByFuzzyName
    .map((nameObject, entryIndex) => {
      const ancestorPath = getAncestorPath(entryIndex, numOfEntries);
      return findMaxCommonAncestor(nameObject, ancestorPath, nameObjectArrayByFuzzyName);
    });

  const namePrefixLengthArray = maxAncestorResultArray.map(result =>
    result.namePrefixLength);
  const ancestorPathIndexArray = maxAncestorResultArray.map(result =>
    result.ancestorPathIndex);

  return { namePrefixLengthArray, ancestorPathIndexArray };
}

// This helper function compiles a name-entry “text”
// (a string that encodes data from a name object).
// It removes the beginning of the string by the given `namePrefixLength`.
// An empty string is never returned; if the string would have been empty,
// then the string `:` is returned instead.
// If empty strings could be returned, then separation bit vectors would break,
// since their select operations cannot refer to the same text position.
const emptyText = ':';
function compileText (nameObject, namePrefixLength) {
  const { headScalar, name, nameType, tailScalarArray } = nameObject;
  const uppercaseNameType = nameType?.toUpperCase();
  const tailScalarHexArray = tailScalarArray
    ?.map(getHexFromNumber)
    ?.join(fieldSeparator);
  const nameSuffix = name.substring(namePrefixLength);
  return [ nameSuffix, uppercaseNameType, tailScalarHexArray ]
    // `nameSuffix` is always a string (although it might be the empty string if
    // its name is entirely contained within its parent entry’s name).
    // `nameSuffix` will therefore never be filtered out. `uppercaseNameType`
    // and `tailScalarHexArray` may be `undefined`, so they may be filtered
    // out.
    .filter(field => field != null)
    .join(fieldSeparator)
    || emptyText;
}

// This helper function compiles a string that encodes a vector of fixed-length
// integers. Each integer indicates the head scalar of each entry within the
// name table. It returns an object `{ block, directory }`, where `block` is the
// string and `directory` is an object.
function compileScalarVector (nameObjectArrayByFuzzyName) {
  const headScalarArray = nameObjectArrayByFuzzyName
    .map(nameObject => nameObject.headScalar);
  return compileIntegerVector(headScalarArray);
}

// This helper function compiles the name-table string. It returns an object `{
// block, directory }`. `block` is the string that encodes the name table.
// `directory` is an object with various metadata, including integer pointers to
// the string’s subblocks and their lengths. The pointers are relative to the
// start of the name-table string.
export default function compileNameTable (nameObjectArrayByFuzzyName) {
  const numOfEntries = nameObjectArrayByFuzzyName.length;

  const { namePrefixLengthArray, ancestorPathIndexArray } =
    createAncestorData(nameObjectArrayByFuzzyName);

  const nameTableTextArray =
    nameObjectArrayByFuzzyName.map((nameObject, entryIndex) =>
      compileText(nameObject, namePrefixLengthArray[entryIndex]));

  const {
    block: textSequenceBlock,
    directory: textSequenceDirectory,
  } = compileVariableSequence(nameTableTextArray);

  const {
    block: namePrefixLengthVectorBlock,
    directory: namePrefixLengthVectorDirectory,
  } = compileIntegerVector(namePrefixLengthArray);

  const {
    block: ancestorPathIndexVectorBlock,
    directory: ancestorPathIndexVectorDirectory,
  } = compileIntegerVector(ancestorPathIndexArray);

  const {
    block: headScalarVectorBlock,
    directory: headScalarVectorDirectory,
  } = compileScalarVector(nameObjectArrayByFuzzyName);

  const subblockArray = [
    textSequenceBlock,
    namePrefixLengthVectorBlock,
    ancestorPathIndexVectorBlock,
    headScalarVectorBlock,
  ];

  const {
    block,
    pointerArray: [
      textSequencePointer,
      namePrefixLengthVectorPointer,
      ancestorPathIndexVectorPointer,
      headScalarVectorPointer,
    ],
  } = compileBlock(subblockArray);

  const directory = {
    numOfEntries,
    textSequencePointer, textSequenceDirectory,
    namePrefixLengthVectorPointer, namePrefixLengthVectorDirectory,
    ancestorPathIndexVectorPointer, ancestorPathIndexVectorDirectory,
    headScalarVectorPointer, headScalarVectorDirectory,
  };

  return { block, directory };
}
