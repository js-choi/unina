// # Unicode Character Database name objects
// This universal module exports a function that extracts name objects from
// Unicode Character Database source files.
//
// A **name object** is an object that represents the names of a contiguous
// character range. Each name object has the following properties:
// * `headScalarRangeInitial`: An integer. A head scalar is the first scalar
//   in the scalar sequence that encodes a character. A head-scalar range is
//   a range over contiguous head scalars, such as the range between `0xD800`
//   and `0xDFFF` (inclusive) for UTF-16 surrogates, which we compress into a
//   single name object. However, most head-scalar ranges are over only one head
//   scalar.
// * `headScalarRangeLength`: An integer. This property is optional; its default
//   value is `1`.
// * `nameStem`: A string.
// * `nameCounterType`: One of the name-counter type strings defined in the
//   `/src/main/name-counter` module. This property is optional. When present,
//   it defines how to derive the actual name from the `nameStem`,
//   `nameCounterInitial`, and `headScalarRangeLength`.
// * `nameCounterInitial`: The name-counter integer value of the first character
//   of the name object’s character range. This property is optional; its
//   default value is `headScalarRangeInitial`. For example, name objects whose
//   `nameCounterType` is `'HEX'` use the `headScalarRangeInitial` default
//   value, while name objects using other `nameCounterType`s like
//   `'HANGULSYLLABLE'` often use `0` or `1`.
// * `nameType`: One of the name-type values defined in the
//   `/src/main/name-type/` module. This property is optional.
// * `tailScalarArray`: An optional array of scalar integers that is present
//   only if the name object is for a named character sequence. The integers are
//   the remaining scalars that follow the character’s head scalar. This
//   property is optional; its default value is `[]`.
//
// Name objects are sorted:
// 1. First by `headScalarRangeInitial`.
// 2. Then by `headScalarRangeLength`.
// 3. Then by `tailScalarArray` (objects without `tailScalarArray`s are sorted
//    before objects that do, after which the `tailScalarArray`s are stringified
//    and compared lexicographically).
// 4. Then by `nameType` (as per the `compareNameTypes` function from the
//    `/src/main/name-type/` module).
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import {
  numOfPlanes, numOfScalarsPerPlane, getNumberFromHex,
} from '../string/';
import { toArrayAsync, mapAsync, concatAsync } from '../iterator/';
import { compareNameTypes } from '../name-type/';
import { isHexNameScalar } from '../hex-name/';
import fuzzilyFold from '../fuzzy-fold/';

// ## Source parsing

// Unicode Character Database files use space-padded semicolons as field
// delimiters.
const sourceFieldDelimiterRegExp = /\s*;\s*/;

// Unicode Character Database files use spaces to separate multiple hexes in
// sequences of scalars.
const hexDelimiter = ' ';

// Unicode Character Database files use `#` to delimit comments.
const commentRegExp = /#[^\n]*/;
function stripComment (string) {
  return string.replace(commentRegExp, '');
}

// This async generator consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines. The generator in turn outputs name
// objects. Each object is created using the `processLine` callback, which is
// repeatedly given a single line from the source file, stripped of comments and
// whitespace padding. Each non-nullish result of parseSourceLines is yielded as
// output.
async function * parseSourceLines (sourceLines, processLine) {
  for await (const line of sourceLines) {
    const preprocessedLine = stripComment(line).trim();
    if (preprocessedLine) {
      const lineData = processLine(stripComment(line).trim());
      if (lineData != null)
        yield lineData;
    }
  }
}

// ### UnicodeData.txt

// In `ucd/UnicodeData.txt`, any line with `<control>` in its second field does
// not have a strict Name value; instead, it has a `CONTROL-XXXX` label with a
// hex counter.
const unicodeDataTxtControlLabelPlaceholder = '<control>';

// This helper function returns a new name object or null.
function parseUnicodeDataTxtNameFieldForControlLabel (
  nameField, headScalarRangeInitial,
) {
  if (nameField === unicodeDataTxtControlLabelPlaceholder)
    // In this case, the scalar does not have a strict Name value; instead, it
    // has a `CONTROL-XXXX` label with a hex counter.
    return {
      headScalarRangeInitial,
      nameStem: 'CONTROL-', nameCounterType: 'HEX',
      nameType: 'LABEL',
    };
}

// In `ucd/UnicodeData.txt`, there are some pairs of lines whose second fields
// are respectively `<XXXX, First>` and `<XXXX, Last>`, where `XXXX` is a “range
// label” like `Plane 15 Private Use` or `Tangut Ideograph Supplement`.
const unicodeDataTxtRangeStartPlaceholderRegExp = /<([^>,]+), First>/;
const unicodeDataTxtRangeEndPlaceholderRegExp = /<([^>,]+), Last>/;

// These helper function creates a name object over a range of head scalars.
function createSurrogateRangeNameObject (
  headScalarRangeInitial, headScalarRangeLength,
) {
  return {
    headScalarRangeInitial, headScalarRangeLength,
    nameStem: 'SURROGATE-', nameCounterType: 'HEX',
    nameType: 'LABEL',
  };
}
function createPrivateUseRangeNameObject (
  headScalarRangeInitial, headScalarRangeLength,
) {
  return {
    headScalarRangeInitial, headScalarRangeLength,
    nameStem: 'PRIVATE-USE-', nameCounterType: 'HEX',
    nameType: 'LABEL',
  };
}
function createCJKUnifiedIdeographRangeNameObject (
  headScalarRangeInitial, headScalarRangeLength,
) {
  return {
    headScalarRangeInitial, headScalarRangeLength,
    nameStem: 'CJK UNIFIED IDEOGRAPH-', nameCounterType: 'HEX',
  };
}
function createTangutIdeographRangeNameObject (
  headScalarRangeInitial, headScalarRangeLength,
) {
  return {
    headScalarRangeInitial, headScalarRangeLength,
    nameStem: 'TANGUT IDEOGRAPH-', nameCounterType: 'HEX',
  };
}

// This object’s helper functions create name objects that correspond to their
// respective range labels in `ucd/UnicodeData.txt`.
const unicodeDataTxtRangeNameObjectCreator = {
  'Non Private Use High Surrogate': createSurrogateRangeNameObject,
  'Private Use High Surrogate': createSurrogateRangeNameObject,
  'Low Surrogate': createSurrogateRangeNameObject,
  'Private Use': createPrivateUseRangeNameObject,
  'Plane 15 Private Use': createPrivateUseRangeNameObject,
  'Plane 16 Private Use': createPrivateUseRangeNameObject,
  'CJK Ideograph': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension A': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension B': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension C': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension D': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension E': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension F': createCJKUnifiedIdeographRangeNameObject,
  'CJK Ideograph Extension G': createCJKUnifiedIdeographRangeNameObject,
  'Tangut Ideograph': createTangutIdeographRangeNameObject,
  'Tangut Ideograph Supplement': createTangutIdeographRangeNameObject,

  ['Hangul Syllable'] (headScalarRangeInitial, headScalarRangeLength) {
    return {
      headScalarRangeInitial, headScalarRangeLength,
      nameStem: 'HANGUL SYLLABLE ', nameCounterType: 'HANGULSYLLABLE',
      // Hangul syllables are indexed between 0 inclusive and 11172 or `0x2BA4`
      // exclusive. See `/src/main/hangul-syllable/` for more information.
      nameCounterInitial: 0,
    };
  },
};

// This helper function returns null or undefined, or it throws a TypeError. It
// may also mutate the given `parserState` object (whose initial value is
// defined in `readUnicodeData`). This function treats null differently than
// undefined. Null specifically indicates that we have a match and we should not
// try other alternative parsings for this `nameField`.
function parseUnicodeDataTxtNameFieldForRangeStart (
  nameField, headScalar, parserState,
) {
  const nameFieldRangeStartMatch =
    unicodeDataTxtRangeStartPlaceholderRegExp.exec(nameField);

  if (nameFieldRangeStartMatch != null) {
    // In this case, `nameField` is a placeholder for the start of a range.
    const [ , headScalarRangeLabel ] = nameFieldRangeStartMatch;

    // The current line’s head scalar indicates the first head scalar of the
    // range.
    const headScalarRangeInitial = headScalar;

    // The `parserState` is mutated…
    parserState.range = {
      headScalarRangeInitial,
      headScalarRangeLabel,
    };
    // …and no name object will be created yet (a name object will be created
    // for the range’s end-placeholder line). Instead, we return null rather
    // than undefined to specifically indicate that we have a match and we
    // should not try other alternative parsings for this `nameField`.
    return null;
  }
}

// This helper function returns a new name object or null, or it throws a
// TypeError. It may also mutate the given `parserState` object (whose initial
// value is defined in `readUnicodeData`).
function parseUnicodeDataTxtNameFieldForRangeEnd (
  nameField, headScalar, parserState,
) {
  const nameFieldRangeEndMatch =
    unicodeDataTxtRangeEndPlaceholderRegExp.exec(nameField);

  if (nameFieldRangeEndMatch != null) {
    // In this case, `nameField` is a placeholder for the end of a range.
    const [ , headScalarRangeLabel ] = nameFieldRangeEndMatch;

    // The current line’s head scalar indicates the final head scalar of the
    // range.
    const headScalarRangeFinal = headScalar;

    // The previous line must have been a range-start placeholder, and
    // `parserState.range` must have been set to a new object.
    const { headScalarRangeInitial } = parserState.range;

    // Because the `headScalarRangeEnd` is an inclusive maximum, we must add
    // one to its difference in order to get the correct range length.
    const headScalarRangeLength =
      headScalarRangeFinal - headScalarRangeInitial + 1;

    // We make a sanity check for whether the `parserState`’s range label
    // matches the current line’s range label. For example, a `<Private Use,
    // Last>` line must immediately follow a `<Private Use, First>` line.
    if (headScalarRangeLabel !== parserState.range.headScalarRangeLabel)
      throw new TypeError(
        `Mismatching ranges in UnicodeData.txt: ${
          JSON.stringify(headScalarRangeLabel)
        } and ${
          JSON.stringify(parserState.range.headScalarRangeLabel)
        }.`);

    // The `parserState` is reset…
    parserState.range = null;

    // …and a name object will be created corresponding to the
    // `headScalarRangeLabel`.
    const unicodeDataTxtRangeNameObject =
      unicodeDataTxtRangeNameObjectCreator[headScalarRangeLabel]
        ?.(headScalarRangeInitial, headScalarRangeLength);

    if (unicodeDataTxtRangeNameObject)
      return unicodeDataTxtRangeNameObject;
    else
      // If no such name object can be created (e.g., the Unicode Consortium
      // added a new `headScalarRangeLabel` that this program cannot yet
      // handle), then a TypeError will be thrown.
      throw new TypeError(
        `Unhandled range label ${
          JSON.stringify(headScalarRangeLabel)
        } found in UnicodeData.txt.`);
  }
}

// This helper function returns a new name object or null.
function parseUnicodeDataTxtNameFieldForSingleStrictName (
  nameField, headScalarRangeInitial,
) {
  if (nameField === unicodeDataTxtControlLabelPlaceholder)
    // In this case, `nameField` is a valid Unicode strict name, so it gets a
    // new name object.

    // Before returning, we make a sanity check for whether the `parserState`
    // has no active range. For example, a `<Private Use, Last>` line must
    // immediately follow a `<Private Use, First>` line; if a line with a single
    // strict name follows the `<Private Use, First>` line, then that is an
    // error.
    if (parserState.range)
      throw new TypeError(
        `Mismatching ranges in UnicodeData.txt: ${
          JSON.stringify(headScalarRangeLabel)
        } and ${
          JSON.stringify(parser.range.headScalarRangeLabel)
        }.`);

    return {
      headScalarRangeInitial,
      nameStem: nameField,
    };
}

// All Unicode name values, as given by the Unicode Character Database, properly
// contain only ASCII uppercase alphanumeric characters, spaces, and hyphens;
// they also must start with an ASCII letter.
const unicodeNameRegExp = /A-Z[A-Z0-9 ]*/;

// This helper function returns null or throws a new TypeError.
function parseUnicodeDataTxtNameFieldForUnhandledPlaceholder (nameField) {
  if (!unicodeNameRegExp.exec(nameField))
    // In this case, the Name value is not blank – yet it is also not a valid
    // Unicode name. The Unicode Consortium may have added a new kind of name
    // placeholder that this program cannot yet handle.
    throw new Error(
      `Unhandled name placeholder ${
        JSON.stringify(nameField)
      } in UnicodeData.txt.`);
}

// This helper function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `UnicodeData.txt` in the Unicode
// Character Database. It outputs name objects.
async function readUnicodeData (sourceLines) {
  const parserState = {
    // Whenever a pair of `<>`-delimited lines indicating a name range occurs in
    // the source, this variable will be set to their range label, after which it
    // will be set back to null.
    range: null,
  };

  return parseSourceLines(sourceLines, line => {
    const [ scalarHex, nameField ] = line.split(sourceFieldDelimiterRegExp);
    const headScalarRangeInitial = getNumberFromHex(scalarHex);

    // This function treats null differently than undefined. Null specifically
    // indicates that we have a match and we should not try other alternative
    // parsings for this `nameField`.
    const rangeStartParseResult =
      parseUnicodeDataTxtNameFieldForRangeStart(
        nameField, headScalarRangeInitial, parserState);
    if (rangeStartParseResult === null)
      return rangeStartParseResult;
    else
      return (
        parseUnicodeDataTxtNameFieldForRangeEnd(
          nameField, headScalarRangeInitial, parserState)

        ?? parseUnicodeDataTxtNameFieldForControlLabel(
          nameField, headScalarRangeInitial)

        ?? parseUnicodeDataTxtNameFieldForSingleStrictName(
          nameField, headScalarRangeInitial)

        ?? parseUnicodeDataTxtNameFieldForUnhandledPlaceholder(
          nameField)

        // If the name field is blank, then it gets no new name object.
        ?? null);
  });
}

// ### NameAliases.txt

// This helper function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `NameAliases.txt` in the Unicode
// Character Database. It outputs name objects.
async function readNameAliases (sourceLines) {
  return parseSourceLines(sourceLines, line => {
    const [ scalarHex, nameStem, lowerCaseNameType ] =
      line.split(sourceFieldDelimiterRegExp);
    const headScalarRangeInitial = getNumberFromHex(scalarHex);
    const nameType = lowerCaseNameType.toUpperCase();
    return {
      headScalarRangeInitial,
      nameStem,
      nameType,
    };
  });
}

// ### NamedSequences.txt

// This async function consumes the given `sourceLines` iterator or async
// iterator, which must yield string lines from `NamedSequences.txt` in the
// Unicode Character Database. It outputs name objects. Figment-type aliases are
// skipped, as they were never actually approved in any standard.
async function readNamedSequences (sourceLines) {
  return parseSourceLines(sourceLines, line => {
    const [ nameStem, scalarHexes ] = line.split(sourceFieldDelimiterRegExp);
    const [ headScalarRangeInitial, ...tailScalarArray ] = scalarHexes
      .split(hexDelimiter)
      .map(getNumberFromHex);
    return {
      headScalarRangeInitial, nameStem,
      nameType: 'SEQUENCE', tailScalarArray,
    };
  });
}

// ## Noncharacters

// This helper generator yields all noncharacter scalars, i.e., 0xFDD0, 0xFDD1,
// …, 0xFDEF – then 0xFFFE, 0xFFFF, 0x1FFFE, 0x1FFFF, …, 0x10FFFE, 0x10FFFF.
function * generateNoncharacters () {
  // Yield 0xFDD0, 0xFDD1, …, 0xFDEF.
  const noncharacterInitialScalar = 0xFDD0;
  const numOfFDD0Noncharacters = 0x20;
  for (let index = 0; index < numOfFDD0Noncharacters; index ++)
    yield noncharacterInitialScalar + index;

  // Yield 0xFFFE, 0xFFFF, 0x1FFFE, 0x1FFFF, …, 0x10FFFE, 0x10FFFF.
  for (let planeIndex = 0; planeIndex < numOfPlanes; planeIndex ++) {
    // For Plane 0, this will be 0x10000. For Plane 1, this will be 0x20000.
    const scalarLimit = (planeIndex + 1) * numOfScalarsPerPlane;
    // For Plane 0, this will be 0xFFFE. For Plane 1, this will be 0x1FFFE.
    yield scalarLimit - 2;
    // For Plane 0, this will be 0xFFFF. For Plane 1, this will be 0x1FFFF.
    yield scalarLimit - 1;
  }
}

// This helper generator yields a name object for each noncharacter, such as:
// ```js
// { headScalarRangeInitial: 0xFFFE,
//   nameStem: 'noncharacter-', nameType: 'LABEL', suffixType: 'hex' }
// ```
function * generateNoncharacterNameObjects () {
  for (const noncharacterScalar of generateNoncharacters())
    yield {
      headScalarRangeInitial: noncharacterScalar,
      nameStem: 'NONCHARACTER-', nameCounterType: 'HEX',
      nameType: 'LABEL',
    };
}

// ## Stemming and countering

// This helper function takes an `inputNameObject` and, if it does not already
// have a `nameCounterType`, parses its name using the given `parseName`
// function (see TODO) and attempts to separate it into a name stem and a name
// counter. It returns either a new name object or the unmodified original
// `inputNameObject`.
function parseNameObjectName (inputNameObject, parseName) {
  const {
    headScalarRangeInitial,
    nameStem: inputNameStem,
    nameCounterType: inputNameCounterType,
  } = inputNameObject;

  if (inputNameCounterType == null) {
    // In this case, the `inputNameObject` does not already have a
    // `nameCounterType` property, so we will check if we can add a new one.
    const { nameStem, nameCounterType, nameCounterValue } =
      parseName(inputNameStem);

    if (nameCounterType != null) {
      // In this case, the `inputNameStem` was successfully parsed such that
      // a `nameCounterType` (like `'HEX'`) was found; the parsing split the
      // `inputNameStem` into a new `nameStem` and a `nameCounterValue`.

      if (nameCounterValue === headScalarRangeInitial)
        // A new name object is returned. In this case, the parsed
        // `nameCounterValue` is the same as the name object’s
        // `headScalarRangeInitial`; it would be redundant to include both.
        return {
          ...inputNameObject, nameStem, nameCounterType,
        };

      else
        // In this case, the parsed `nameCounterValue` is not the same as the
        // name object’s `headScalarRangeInitial`, so both are in the returned
        // new name object.
        return {
          ...inputNameObject, nameStem, nameCounterType, nameCounterValue,
        };
    }

    else {
      // In this case, the `inputNameObject` already does have a
      // `nameCounterType` property, so we will not attempt to find a new one.
      // In this case, we expect that the `inputNameObject`’s actual names
      // actually would parse identically to how they have already been split in
      // the `inputNameObject`.
      // TODO

      return inputNameObject;
    }
  }

  else
    return inputNameObject;
}

// ## Sorting

// This helper function simplify stringifies the two optional arrays and then
// lexicographically compares them. Because of this, if exactly one of the
// optional arrays is nullish, then it precedes the other array.
function compareArrays (array0, array1) {
  return String(array0).localeCompare(String(array1));
}

// This helper function determines how name objects are sorted. It compares two
// name objects and returns a negative number, `0`, or a positive number. See
// the overview of this module for more information on the sorting definition.
function compareNameObjects (nameObject0, nameObject1) {
  return nameObject0.headScalarRangeInitial - nameObject1.headScalarRangeInitial
    || compareArrays(
      nameObject0.tailScalarArray,
      nameObject1.tailScalarArray)
    || compareNameTypes(
      nameObject0.nameType,
      nameObject1.nameType);
}

// ## Validation

// This helper function checks that every single name object in the given array
// fulfills the name-counter identity invariant for the given `deriveName` and
// `parseName` functions:
//
// For every `nameObject` in an array, the following invariant must hold:
// `parseName(fuzzilyFold(deriveName(nameObject)))` will evaluate to a name
// object that is equivalent to the original `nameObject`.
//
// If any name object in the given array breaks the name-counter identity
// invariant, then this function throws an error whose message mentions
// “invariant”.
//
// For more information on the name-counter identity invariant, see its
// documentation in `main/name-object/`.
function validateNameCounterIdentityInvariant (
  nameRangeArray, deriveName, parseName,
) {
  for (const nameRange of nameRangeArray) {
    // We need to validate every single name that the name range covers. This
    // will usually be only one name, but some name ranges cover many names.
    const {
      headScalarRangeLength, nameStem, nameCounterType,
      nameCounterInitial = headScalarRangeLength,
    } = nameRange;
    for (let rangeIndex = 0; rangeIndex < headScalarRangeLength; rangeIndex ++) {
      const originalNameObject = {
        nameStem, nameCounterType,
        nameCounterValue: nameCounterInitial + rangeIndex,
      };
      const fuzzilyFoldedDerivedName =
        fuzzilyFold(deriveName(originalNameObject));
      const fuzzilyFoldedDerivedNameObject =
        parseName(fuzzilyFoldedDerivedName);
      const nameObjectsAreEquivalent =
        fuzzilyFold(originalNameObject.nameStem, true)
          === fuzzilyFoldedDerivedNameObject.nameStem
        && originalNameObject.nameCounterType
          === fuzzilyFoldedDerivedNameObject.nameCounterType
        && originalNameObject.nameCounterValue
          === fuzzilyFoldedDerivedNameObject.nameCounterValue;
      if (!nameObjectsAreEquivalent)
        throw new Error(
          `Violation of name-counter identity invariant for name object ${
            JSON.stringify(originalNameObject)
          }, which has fuzzily folded derived name “${
            fuzzilyFoldedDerivedName
          }”, which in turn parses into mismatching name object ${
            JSON.stringify(fuzzilyFoldedDerivedNameObject)
          }.`);
    }
  }
}

// ## Consolidation

// This function parses Unicode name data into a sorted array of name objects.
// `unicodeDataLines`, `nameAliasesLines`, and `namedSequencesLines` must be
// iterator or async iterators that yield string lines from their respective
// Unicode Character Database source-text files. `parseName` must be TODO.
//
// Name objects for noncharacters are also included in the returned array.
export default async function parseNameObjects ({
  unicodeDataLines, nameAliasesLines, namedSequencesLines,
  deriveName, parseName,
}) {
  const nameObjectArray = await toArrayAsync(
    mapAsync(
      concatAsync(
        readUnicodeData(unicodeDataLines),
        readNameAliases(nameAliasesLines),
        readNamedSequences(namedSequencesLines),
        generateNoncharacterNameObjects(),
      ),
      nameObject => parseNameObjectName(nameObject, parseName),
    ),
  );
  nameObjectArray.sort(compareNameObjects);
  validateNameCounterIdentityInvariant(nameObjectArray, deriveName, parseName);
  return nameObjectArray;
}
