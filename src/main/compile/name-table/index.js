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
import compileBlock, { getParentIndex } from '../util/';

import {
  fieldSeparator, getHexFromNumber, getMaxCommonPrefixLength,
} from '../../string/';

// This helper function creates an array of fixed-length integers. Each integer
// indicates the length of the longest prefix that it shares with its parent
// name entry (as determined by a binary search).
function createNamePrefixLengthArray (nameObjectArrayByFuzzyName) {
  const numOfEntries = nameObjectArrayByFuzzyName.length;
  const namePrefixLengthArray = nameObjectArrayByFuzzyName
    .map((nameObject, entryIndex) => {
      // This is `undefined` if the current entry has no parent,
      // i.e., if it is the root entry.
      const parentIndex = getParentIndex(entryIndex, numOfEntries);
      if (parentIndex != null) {
        // The current entry has a parent, i.e., it is not the root entry.
        const parentObject = nameObjectArrayByFuzzyName[parentIndex];
        return getMaxCommonPrefixLength(nameObject.name, parentObject.name);
      }
      else
        // If the current entry has no parent, i.e., it is the root entry, then
        // its parent prefix is considered to be the empty string with length 0.
        return 0;
    });

  return namePrefixLengthArray;
}

// This helper function compiles a name-entry “text” (a string that encodes data
// from a name object). It removes the beginning of the string by the given
// `namePrefixLength`.
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
    .join(fieldSeparator);
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

  const namePrefixLengthArray =
    createNamePrefixLengthArray(nameObjectArrayByFuzzyName);

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
    block: headScalarVectorBlock,
    directory: headScalarVectorDirectory,
  } = compileScalarVector(nameObjectArrayByFuzzyName);

  const subblockArray = [
    textSequenceBlock,
    namePrefixLengthVectorBlock,
    headScalarVectorBlock,
  ];

  const {
    block,
    pointerArray: [
      textSequencePointer,
      namePrefixLengthVectorPointer,
      headScalarVectorPointer,
    ],
  } = compileBlock(subblockArray);

  const directory = {
    numOfEntries,
    textSequencePointer, textSequenceDirectory,
    namePrefixLengthVectorPointer, namePrefixLengthVectorDirectory,
    headScalarVectorPointer, headScalarVectorDirectory,
  };

  return { block, directory };
}
