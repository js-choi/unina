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
import compileBlock from '../util/';

import { fieldSeparator, getHexFromNumber } from '../../string/';

// This helper function compiles a name-entry “text” (a string that encodes data
// from a name object).
function compileNameTableText (nameObject) {
  const { headScalar, name, nameType, tailScalarArray } = nameObject;
  const uppercaseNameType = nameType?.toUpperCase();
  const tailScalarHexArray = tailScalarArray
    ?.map(getHexFromNumber)
    ?.join(fieldSeparator);
  return [ name, uppercaseNameType, tailScalarHexArray ]
    // `name` is always a string. `name` will therefore never be filtered out.
    // In contrast, `uppercaseNameType` and `tailScalarHexArray` may be
    // `undefined`, so they may be filtered out.
    .filter(field => field != null)
    .join(fieldSeparator);
}

// This helper function compiles a string that encodes a vector of fixed-length
// integers. Each integer indicates the head scalar of each entry within the
// name table. It returns an object `{ block, directory }`, where `block` is the
// string and `directory` is an object.
function compileNameTableScalarVector (nameObjectArrayByFuzzyName) {
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
  const nameTableTextArray =
    nameObjectArrayByFuzzyName.map(compileNameTableText);

  const {
    block: textSequenceBlock,
    directory: textSequenceDirectory,
  } = compileVariableSequence(nameTableTextArray);

  const {
    block: headScalarVectorBlock,
    directory: headScalarVectorDirectory,
  } = compileNameTableScalarVector(nameObjectArrayByFuzzyName);

  const subblockArray = [
    textSequenceBlock,
    headScalarVectorBlock,
  ];

  const {
    block,
    pointerArray: [
      textSequencePointer,
      headScalarVectorPointer,
    ],
  } = compileBlock(subblockArray);

  const directory = {
    numOfEntries,
    textSequencePointer, textSequenceDirectory,
    headScalarVectorPointer, headScalarVectorDirectory,
  };

  return { block, directory };
}
