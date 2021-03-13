// # UCD name ranges
// This universal module exports a function that generates name ranges from UCD
// files (This module does not manage fetching the UCD source files; the source
// files’ data have to be supplied as arguments to this module’s functions.)
// For information on name ranges, see the [name-range readme][].
//
// [name-range readme]: ./README.md
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as NameCounter from '#js/name-counter';
import * as Name from '#js/name';
import { getInteger } from '#js/util/hex';
import * as IterableUtil from '#js/util/iterable';

// The Unicode Character Database files use space-padded semicolons as field
// delimiters.
const sourceFieldDelimiterRegExp = /\s*;\s*/;

// The Unicode Character Database files use spaces to separate multiple hexes
// in sequences of scalars.
const hexDelimiter = ' ';

// This function strips the first `#`-delimited comment from a string.
const commentRegExp = /#[^\n]*/;
function stripComment (string) {
  return string.replace(commentRegExp, '');
}

// This async generator consumes the given `sourceLines` iterable or async
// iterable, which must yield string lines, and resolves to an array of
// entries. Each entry is created using the `processLine` callback, which is
// repeatedly given an array of each line’s fields from the source file,
// stripped of comments and whitespace padding.
async function * asyncFromSourceLines (sourceLines, processLine) {
  for await (const line of sourceLines) {
    const preprocessedLine = stripComment(line).trim();
    if (preprocessedLine) {
      const fieldArray = stripComment(line)
        .trim()
        .split(sourceFieldDelimiterRegExp);
      const lineData = processLine(fieldArray);
      if (lineData) {
        yield lineData;
      }
    }
  }
}

// This async generator consumes the given `sourceLines` iterable or async
// iterable, which must yield string lines from `UnicodeData.txt` in the
// Unicode Character Database, and yields name ranges. The name ranges may
// include certain non-name labels such as `<Hangul Syllable, First>` and
// `<Hangul Syllable, Last>`; these are processed by another function,
// `asyncFromUnicodeData`.
async function * asyncFromRawUnicodeData (sourceLines) {
  yield * asyncFromSourceLines(sourceLines, fieldArray => {
    const [ scalarHex, name ] = fieldArray;
    const initialHeadPoint = getInteger(scalarHex);
    return {
      initialHeadPoint,
      nameStem: name,
    };
  });
}

// Some raw name ranges from UnicodeData.txt will have name stems such as
// `<control>` or `<CJK Ideograph Extension A, First>`. These name ranges must
// be replaced with name ranges that have actual, valid name stems.
const metaLabelPrefix = '<';
const metaLabelSuffix = '>';
const startingMetaLabelSuffix = ', First' + metaLabelSuffix;
const endingMetaLabelSuffix = ', Last' + metaLabelSuffix;

// This function creates a TypeError for an invalid name range found in
// UnicodeData.txt, e.g., when a `<Hangul Syllable, First>` name range is not
// followed by a `<Hangul Syllable, Last>` name range.
function createInvalidNameRangeError (nameRange, previousNameRange) {
  return new TypeError(
    `Invalid name label in UnicodeData.txt “${
      nameRange.nameStem
    }” following “${
      previousNameRange.nameStem
    }”.`,
  );
}

// Certain pairs of meta-labels from UnicodeData.txt denote special name
// ranges, such as `<CJK Ideograph Extension A, First>` and `<CJK Ideograph
// Extension A, Last>`. This function creates such special name ranges. It
// always returns a new consolidated name range, or it throws a TypeError if
// the previous raw name range did not begin the given ending name range.
function processUnicodeDataMetalabelPair ({
  startingNameRange,
  endingNameRange,
  nameStem,
  nameCounterType,
  nameType,
  expectedStartingNameRangeLabel,
}) {
  if (startingNameRange?.nameStem === expectedStartingNameRangeLabel) {
    // In this case, the `startingNameRange`’s name stem is the given expected
    // starting label (e.g., `'<CJK Ideograph, First>'`), so the special name
    // range is a complete pair.
    const { initialHeadPoint } = startingNameRange;
    const finalHeadPoint = endingNameRange.initialHeadPoint;
    const length = finalHeadPoint - initialHeadPoint + 1;

    if (nameType != null) {
      // In this case, the `nameType` is not nullish (i.e., it has a special
      // name type like `Name.correctionType`), and therefore the new name
      // range should include it.
      return { initialHeadPoint, length, nameCounterType, nameStem, nameType };
    }

    else {
      // In this case, the `nameType` is nullish (i.e., it is a strict
      // character name), and therefore the new name range should not contain a
      // `nameType` property.
      return { initialHeadPoint, length, nameCounterType, nameStem };
    }
  }

  else {
    // In this case, there no preceding name range, or if the preceding name
    // range is not the expected starting line of this ending line’s special
    // name range. This is an error; the UnicodeData.txt file should never have
    // mismatching special-name-range lines.
    throw createInvalidNameRangeError(endingNameRange, startingNameRange);
  }
}

// Raw name ranges from UnicodeData.txt with the meta-label `<control>` must be
// replaced by name ranges for the corresponding hyphenated-hex code-point
// label, like “CONTROL-0000” for `U+0000`.
const controlMetaLabel =
  metaLabelPrefix + 'control' + metaLabelSuffix;

// Raw name ranges from UnicodeData.txt with meta-labels resembling `<CJK
// Ideograph Extension A, First>` and `CJK Ideograph Extension A, Last` must be
// replaced by name ranges for the corresponding hyphenated-hex strict
// character names, like “CJK UNIFIED IDEOGRAPH-4E00” for `U+4E00`. Because new
// CJK Ideograph Extension ranges will likely continue to be added with new
// letters, we will replace all of them with generic meta-labels.

const cjkIdeographExtensionMetaLabelPrefix =
  metaLabelPrefix + 'CJK Ideograph Extension';

const cjkIdeographExtensionGenericStartingMetaLabel =
  cjkIdeographExtensionMetaLabelPrefix + ' ?' + startingMetaLabelSuffix;

const cjkIdeographExtensionGenericEndingMetaLabel =
  cjkIdeographExtensionMetaLabelPrefix + ' ?' + endingMetaLabelSuffix;

// This function converts a meta-label that ends a special name range to the
// corresponding meta-label that would have started the special name range.
export function getStartingMetaLabel (endingMetaLabel) {
  return endingMetaLabel.slice(0, -endingMetaLabelSuffix.length)
    + startingMetaLabelSuffix;
}

// This object checks for specific meta-labels that raw name ranges from
// UnicodeData.txt may have. Each of its keys is a known special label (like
// `<CJK Ideograph Extension A, First>`), and each of its values is a
// name-range processing function with parameters `nameRange` and
// `previousNameRange`, which may return a processed name range or undefined.
const unicodeDataMetalabelDispatcher = {
  // In this case, the current raw name range is a singleton for a control
  // character with a hyphenated-hex control label, like “CONTROL-0000” for
  // `U+0000`.
  [controlMetaLabel] (nameRange) {
    const { initialHeadPoint } = nameRange;
    return {
      initialHeadPoint,
      nameCounterType: NameCounter.hyphenHexType,
      nameStem: NameCounter.controlNameStem,
      nameType: Name.labelType,
    };
  },

  // This range starts at `U+4E00`.
  ['<CJK Ideograph, First>'] () {
    return;
  },

  // This range ends at `U+9FFC`.
  ['<CJK Ideograph, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.cjkUnifiedNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      expectedStartingNameRangeLabel: '<CJK Ideograph, First>',
    });
  },

  // In this case, the current raw name range starts a name range that covers
  // CJK Unified Ideograph characters with hyphenated-hex strict character
  // names, like “CJK UNIFIED IDEOGRAPH-4E00” for `U+4E00`.
  [cjkIdeographExtensionGenericStartingMetaLabel] () {
    return;
  },

  // In this case, the current raw name range ends a name range that covers CJK
  // Unified Ideograph extension characters with hyphenated-hex strict
  // character names.
  [cjkIdeographExtensionGenericEndingMetaLabel] (
    nameRange,
    previousNameRange,
  ) {
    const expectedStartingNameRangeLabel =
      getStartingMetaLabel(nameRange.nameStem);

    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.cjkUnifiedNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      expectedStartingNameRangeLabel,
    });
  },

  // This range starts at `U+AC00`.
  ['<Hangul Syllable, First>'] () {
    return;
  },

  // This range ends at `U+D7A3`.
  ['<Hangul Syllable, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.hangulSyllableNameStem,
      nameCounterType: NameCounter.hangulSyllableType,
      expectedStartingNameRangeLabel: '<Hangul Syllable, First>',
    });
  },

  // This range starts at `U+D800`.
  ['<Non Private Use High Surrogate, First>'] () {
    return;
  },

  // This range ends at `U+DB7F`.
  ['<Non Private Use High Surrogate, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.surrogateNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel:
        '<Non Private Use High Surrogate, First>',
    });
  },

  // This range starts at `U+DB80`.
  ['<Private Use High Surrogate, First>'] () {
    return;
  },

  // This range ends at `U+DBFF`.
  ['<Private Use High Surrogate, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.surrogateNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel: '<Private Use High Surrogate, First>',
    });
  },

  // This range starts at `U+DC00`.
  ['<Low Surrogate, First>'] () {
    return;
  },

  // This range ends at `U+DFFF`.
  ['<Low Surrogate, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.surrogateNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel: '<Low Surrogate, First>',
    });
  },

  // This range starts at `U+E000`.
  ['<Private Use, First>'] () {
    return;
  },

  // This range ends at `U+F8FF`.
  ['<Private Use, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.privateUseNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel: '<Private Use, First>',
    });
  },

  // This range starts at `U+17000`.
  ['<Tangut Ideograph, First>'] () {
    return;
  },

  // This range’s ending is not stable over time.
  ['<Tangut Ideograph, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.tangutNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      expectedStartingNameRangeLabel: '<Tangut Ideograph, First>',
    });
  },

  // This range starts at `U+18D00`.
  ['<Tangut Ideograph Supplement, First>'] () {
    return;
  },

  // This range’s ending is not stable over time.
  ['<Tangut Ideograph Supplement, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.tangutNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      expectedStartingNameRangeLabel: '<Tangut Ideograph Supplement, First>',
    });
  },

  // This range starts at `U+F0000`.
  ['<Plane 15 Private Use, First>'] () {
    return;
  },

  // This range ends at `U+FFFFD`.
  ['<Plane 15 Private Use, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.privateUseNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel: '<Plane 15 Private Use, First>',
    });
  },

  // This range starts at `U+100000`.
  ['<Plane 16 Private Use, First>'] () {
    return;
  },

  // This range ends at `U+10FFFD`.
  ['<Plane 16 Private Use, Last>'] (nameRange, previousNameRange) {
    return processUnicodeDataMetalabelPair({
      startingNameRange: previousNameRange,
      endingNameRange: nameRange,
      nameStem: NameCounter.privateUseNameStem,
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
      expectedStartingNameRangeLabel: '<Plane 16 Private Use, First>',
    });
  },
};

// This function returns the function from `unicodeDataMetaLabelDispatcher`
// that is appropriate for the given `nameStem` – or undefined, if the given
// `nameStem` is not a recognized meta-label.
function getUnicodeDataMetaLabelProcessor (nameStem) {
  if (nameStem.startsWith(cjkIdeographExtensionMetaLabelPrefix)) {
    // In this case, the given `nameStem` is a meta-label for one of the CJK
    // Ideograph Extension special ranges.
    if (nameStem.endsWith(startingMetaLabelSuffix)) {
      // In this case, the meta-label starts the CJK Ideograph Extension
      // special name range.
      return unicodeDataMetalabelDispatcher[
        cjkIdeographExtensionGenericStartingMetaLabel
      ];
    }

    else if (nameStem.endsWith(endingMetaLabelSuffix)) {
      // In this case, the meta-label ends the CJK Ideograph Extension special
      // name range.
      return unicodeDataMetalabelDispatcher[
        cjkIdeographExtensionGenericEndingMetaLabel
      ];
    }

    else {
      // In this case, the meta-label neither starts nor ends the CJK Ideograph
      // Extension special name range, and the meta-label is therefore invalid.
      // The `processNameRange` function will throw an error.
      return undefined;
    }
  }

  else {
    // In this case, the given `nameStem` is either another meta-label or it is
    // an ordinary name stem.
    return (
      unicodeDataMetalabelDispatcher[nameStem]
      ?? processOrdinaryUnicodeDataName
    );
  }
}

// This function asserts that the given `previousNameRange` is not the start of
// a special UnicodeData.txt name range – e.g., it is not a `<Hangul Syllable,
// First>` name range. Otherwise, it will throw a TypeError.
function assertPreviousNameRangeIsNotRangeStart (previousNameRange) {
  if (previousNameRange?.nameStem?.endsWith(startingMetaLabelSuffix)) {
    throw new TypeError(`Invalid name label in UnicodeData.txt; line with “${
      previousNameRange.nameStem
    }” is not followed by an ending line.`);
  }
}

// This function asserts that the given ordinary `nameRange` does not have a
// unrecognized meta-label.
function assertNameRangeDoesNotHaveInvalidLabel (nameRange) {
  if (nameRange.nameStem.startsWith(metaLabelPrefix)) {
    throw new TypeError(`Unknown name label in UnicodeData.txt “${
      nameRange.nameStem
    }”.`);
  }
}

// This function processes an ordinary name range from UnicodeData.txt that
// does not have any meta-label. It asserts that the previous name range is not
// a meta-label that invalidly starts a special name range. (It would be an
// error if the previous name range was something like `<Hangul Syllable,
// First>` when its following name range were just an ordinary name range that
// did not close it.)
function processOrdinaryUnicodeDataName (nameRange, previousNameRange) {
  assertPreviousNameRangeIsNotRangeStart(previousNameRange);
  assertNameRangeDoesNotHaveInvalidLabel(nameRange);
  return nameRange;
}

// This async generator consumes the given `sourceLines` iterable or async
// iterable, which must yield string lines from `UnicodeData.txt` in the
// Unicode Character Database, and yields name ranges.
export async function * asyncFromUnicodeData (sourceLines) {
  let previousNameRange;

  for await (const nameRange of asyncFromRawUnicodeData(sourceLines)) {
    const processor = getUnicodeDataMetaLabelProcessor(nameRange.nameStem);
    const processResult = processor(nameRange, previousNameRange);
    if (processResult) {
      yield processResult;
    }
    previousNameRange = nameRange;
  }

  // Assert that the final name range was not an invalid name-range start. It
  // would be an error if UnicodeData.txt ends with something like `<Hangul
  // Syllable, First>`.
  assertPreviousNameRangeIsNotRangeStart(previousNameRange);
}

// This async generator consumes the given `sourceLines` iterable or async
// iterable, which must yield string lines from `NameAliases.txt` in the
// Unicode Character Database, and yields name ranges.
export async function * asyncFromNameAliases (sourceLines) {
  yield * asyncFromSourceLines(sourceLines, fieldArray => {
    const [ scalarHex, name, nameType ] = fieldArray;
    const initialHeadPoint = getInteger(scalarHex);
    const nameStem = name;
    return {
      initialHeadPoint,
      nameStem: name,
      nameType,
    };
  });
}

// This async generator consumes the given `sourceLines` iterable or async
// iterable, which must yield string lines from `NamedSequences.txt` in the
// Unicode Character Database, and yields name ranges.
export async function * asyncFromNamedSequences (sourceLines) {
  yield * asyncFromSourceLines(sourceLines, fieldArray => {
    const [ name, scalarHexes ] = fieldArray;
    const [ initialHeadPoint, ...tailScalarArray ] = scalarHexes
      .split(hexDelimiter)
      .map(getInteger);
    return {
      initialHeadPoint,
      nameStem: name,
      nameType: Name.sequenceType,
      tailScalarArray,
    };
  });
}
