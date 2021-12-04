// # Unicode Character Database name objects
// This universal module exports a function that extracts name objects from
// Unicode Character Database source files.
//
// A **name object** is an object that represents a single character name. Each
// name object has the following keys:
// * `headScalar`: An integer. (For a named character sequence, this is its
//    first scalar.)
// * `name`: A string.
// * `nameType`: One of the name-type values defined in the `../name-type/`
//   module.
// * `tailScalarArray`: An optional array of scalar integers that is present
//   only if the name entry is for a named character sequence. The integers are
//   the remaining scalars that follow the `headScalar`.
//
// Name objects are sorted first by `headScalar`, then by `tailScalarArray`
// (objects without `tailScalarArray`s are sorted before objects that do,
// after which the `tailScalarArray`s are stringified and compared
// lexicographically), then by `nameType` (as per the `compareNameTypes`
// function from the '../name-type/' module).
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { getNumberFromHex } from '../string/';
import { compareNameTypes } from '../name-type/';
import { isHexNameScalar } from '../hex-name/';

// The Unicode Character Database files use space-padded semicolons as field
// delimiters.
const sourceFieldDelimiterRegExp = /\s*;\s*/;

// The Unicode Character Database files use spaces to separate multiple hexes in
// sequences of scalars.
const hexDelimiter = ' ';

// This function strips the first `#`-delimited comment from a string.
const commentRegExp = /#[^\n]*/;
function stripComment (string) {
  return string.replace(commentRegExp, '');
}

// This async function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines, and resolves to an array of entries.
// Each entry is created using the `processLine` callback, which is repeatedly
// given a single line from the source file, stripped of comments and whitespace
// padding.
async function parseSourceLines (sourceLines, processLine) {
  const data = [];
  for await (const line of sourceLines) {
    const preprocessedLine = stripComment(line).trim();
    if (preprocessedLine) {
      const lineData = processLine(stripComment(line).trim());
      if (lineData)
        data.push(lineData);
    }
  }
  return data;
}

// In `ucd/UnicodeData.txt`, some entries in the second field are ignorable
// labels like `<control>`, rather than actual character names.
const scalarLabelDelimiter = '<';
function isIgnorableScalarLabel (string) {
  return string.startsWith(scalarLabelDelimiter);
}

// This async function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `UnicodeData.txt` in the Unicode
// Character Database, and resolves to a sorted array of character entries: `[
// scalarHex, name, null ]`. The first two fields are strings.
async function readUnicodeData (sourceLines) {
  return parseSourceLines(sourceLines, line => {
    const [ scalarHex, name ] = line.split(sourceFieldDelimiterRegExp);
    const headScalar = getNumberFromHex(scalarHex);
    if (name && !isIgnorableScalarLabel(name) && !isHexNameScalar(headScalar))
      return { headScalar, name, nameType: null };
  });
}

// This async function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `NameAliases.txt` in the Unicode
// Character Database, and resolves to a sorted array of character entries: `[
// scalarHex, name, nameType ]`. The first two fields are strings; the
// `nameType` field is `'correction'`, `'control'`, `'alternate'`,
// `'abbreviation'`, `'figment'`, or null.
async function readNameAliases (sourceLines) {
  return parseSourceLines(sourceLines, line => {
    const [ scalarHex, name, nameType ] = line.split(sourceFieldDelimiterRegExp);
    const headScalar = getNumberFromHex(scalarHex);
    return { headScalar, name, nameType };
  });
}

// This async function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `NamedSequences.txt` in the
// Unicode Character Database, and resolves to a sorted array of character
// entries: `[ scalarHexes, name, null ]`. The first two fields are strings; the
// `scalarHexes` field contains two or more hexadecimal digits separated by the
// hex delimiter. Figment-type aliases are skipped, as they were never actually
// approved in any standard.
async function readNamedSequences (sourceLines) {
  return parseSourceLines(sourceLines, line => {
    const [ name, scalarHexes ] = line.split(sourceFieldDelimiterRegExp);
    const [ headScalar, ...tailScalarArray ] = scalarHexes
      .split(hexDelimiter)
      .map(getNumberFromHex);
    return { headScalar, name, nameType: 'sequence', tailScalarArray };
  });
}

// This helper function simplify stringifies the two optional arrays and then
// lexicographically compares them. Because of this, if exactly one of the
// optional arrays is nullish, then it precedes the other array.
function compareArrays (array0, array1) {
  return String(array0).localeCompare(String(array1));
}

// This helper function determines how character entries in the database are
// sorted. It compares two name objects and returns a negative number, `0`, or a
// positive number. See the overview of this module for more information on the
// sorting algorithm.
function compareCharacterEntries (characterEntry0, characterEntry1) {
  return characterEntry0.headScalar - characterEntry1.headScalar
    || compareArrays(
      characterEntry0.tailScalarArray,
      characterEntry1.tailScalarArray)
    || compareNameTypes(
      characterEntry0.nameType,
      characterEntry1.nameType);
}

// Parse Unicode name data into an array of name entries, sorted by
// `headScalar`. `unicodeDataLines`, `nameAliasesLines`, and
// `namedSequencesLines` must be iterator or async iterators that yield string
// lines from their respective Unicode Character Database source-text files.
export default async function parseNameObjects (
  { unicodeDataLines, nameAliasesLines, namedSequencesLines },
) {
  const unicodeDataEntries = await readUnicodeData(unicodeDataLines);
  const nameAliasesEntries = await readNameAliases(nameAliasesLines);
  const namedSequencesEntries = await readNamedSequences(namedSequencesLines);
  const consolidatedEntries = [
    ...unicodeDataEntries, ...nameAliasesEntries, ...namedSequencesEntries,
  ];
  consolidatedEntries.sort(compareCharacterEntries);
  return consolidatedEntries;
}
