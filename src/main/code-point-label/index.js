// # Code-point labels
// This module exports functions that look up strings with dynamically generated
// code-point labels.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import {
  getPaddedHexFromScalar, getNumberFromHex, getCodePointsFromString,
} from '../string/';

// Code-point labels start with with a prefix denoting their type. We support
// four code-point label types: control, noncharacter, private-use, and
// surrogate. There is a fifth type (reserved) that we do not handle due to its
// instability: All reserved code points are subject to becoming actual
// characters in the future, so programs should not rely on retrieving code
// points by `reserved` code-point labels.
const controlLabelPrefix = 'CONTROL';
const privateUseLabelPrefix = 'PRIVATE-USE';
const noncharacterLabelPrefix = 'NONCHARACTER';
const surrogateLabelPrefix = 'SURROGATE';

// This helper metafunction creates a label-getter helper function, which we use
// for each type of code-point label, using the given `labelPrefix` string and
// the `isValidCodePoint` callback. `isValidCodePoint` must accept an integer
// argument and must return a boolean. The returned label-getter function in
// turn accepts an `input` string argument and returns the code-point label
// string (if any) for that string. Matching is determined using the given
// `labelPrefix` and `isValidCodePoint`. Otherwise, the returned label-getter
// function returns undefined.
function createLabelGetter (labelPrefix, isValidCodePoint) {
  return function getLabel (input) {
    if (getCodePointsFromString(input).length === 1) {
      const codePoint = input.codePointAt(0);
      if (isValidCodePoint(codePoint))
        return `${labelPrefix}-${getPaddedHexFromScalar(codePoint)}`;
    }
  }
}

// This helper metafunction creates a string-getter helper function, which we
// use for each type of code-point label, using the given `labelPrefix` string
// and the `isValidCodePoint` callback. `isValidCodePoint` must accept an
// integer argument and must return a boolean. The returned string-getter
// function in turn accepts a `fuzzyName` string argument and returns the string
// (if any) whose code-point label (if any) matches `fuzzyName`. Matching is
// determined using the given `labelPrefix` and `isValidCodePoint`. Otherwise,
// the returned string-getter function returns undefined. `fuzzyName` must be
// a fuzzily folded string (see `fuzzilyFold` from `./fuzzy-fold`).
function createStringGetter (labelPrefix, isValidCodePoint) {
  const fuzzyLabelPrefix = fuzzilyFold(labelPrefix);
  return function getString (fuzzyName) {
    if (fuzzyName.startsWith(fuzzyLabelPrefix)) {
      const codePointHex = fuzzyName.substring(fuzzyLabelPrefix.length);
      const codePoint = getNumberFromHex(codePointHex);
      if (isValidCodePoint(codePoint))
        return String.fromCodePoint(codePoint);
    }
  }
}

// ## Control labels
// There are 65 control-type code points defined in two pieces: one starting at
// `U+0000` and one starting at `U+007F`. These code points all have labels
// named `control-0000`, `control-0001`, etc. The Unicode Standard guarantees
// that no more control-type code points will be added for ever.

// This helper function takes a code-point integer and returns a boolean.
const minControlCodePointFrom0000 = 0x0000; // Inclusive minimum.
const maxControlCodePointFrom0000 = 0x0020; // Exclusive maximum.
function isControlCodePointFrom0000 (codePoint) {
  return minControlCodePointFrom0000 <= codePoint
    && codePoint < maxControlCodePointFrom0000;
}

// This helper function takes a code-point integer and returns a boolean.
const minControlCodePointFrom007F = 0x007F; // Inclusive minimum.
const maxControlCodePointFrom007F = 0x00A0; // Exclusive maximum.
function isControlCodePointFrom007F (codePoint) {
  return minControlCodePointFrom007F <= codePoint
    && codePoint < maxControlCodePointFrom007F;
}

// This helper function takes a code-point integer and returns a boolean.
function isControlCodePoint (codePoint) {
  return isControlCodePointFrom0000(codePoint)
    || isControlCodePointFrom007F(codePoint);
}

// This helper function accepts an `input` string argument and returns the
// control-type code-point label string (if any) for that string. Matching is
// determined using the given `labelPrefix` and `isValidCodePoint`. Otherwise,
// the function returns undefined.
const getControlLabel =
  createLabelGetter(controlLabelPrefix, isControlCodePoint);

// This helper function accepts a `fuzzyName` string argument and returns the
// string (if any) whose control-type code-point label (if any) matches
// `fuzzyName`. Matching is determined using the given `labelPrefix` and
// `isValidCodePoint`. Otherwise, the returned string-getter function returns
// undefined. `fuzzyName` must be a fuzzily folded string (see `fuzzilyFold`
// from `./fuzzy-fold`).
const getControlCharacter =
  createStringGetter(controlLabelPrefix, isControlCodePoint);

// ## Private-use labels

// This helper function takes a code-point integer and returns a boolean.
const minBasicPlanePrivateUseCodePoint = 0xE000; // Inclusive minimum.
const maxBasicPlanePrivateUseCodePoint = 0xF900; // Exclusive maximum.
function isBasicPlanePrivateUseCodePoint (codePoint) {
  return minBasicPlanePrivateUseCodePoint <= codePoint
    && codePoint < maxBasicPlanePrivateUseCodePoint;
}

// This helper function takes a code-point integer and returns a boolean.
const minPlane15PrivateUseCodePoint = 0xF0000; // Inclusive minimum.
const maxPlane15PrivateUseCodePoint = 0xFFFFE; // Exclusive maximum.
function isPlane15PrivateUseCodePoint (codePoint) {
  return minPlane15PrivateUseCodePoint <= codePoint
    && codePoint < maxPlane15PrivateUseCodePoint;
}

// This helper function takes a code-point integer and returns a boolean.
const minPlane16PrivateUseCodePoint = 0x100000; // Inclusive minimum.
const maxPlane16PrivateUseCodePoint = 0x10FFFE; // Exclusive maximum.
function isPlane16PrivateUseCodePoint (codePoint) {
  return minPlane16PrivateUseCodePoint <= codePoint
    && codePoint < maxPlane16PrivateUseCodePoint;
}

// This helper function takes a code-point integer and returns a boolean.
function isPrivateUseCodePoint (codePoint) {
  return isBasicPlanePrivateUseCodePoint(codePoint)
    || isPlane15PrivateUseCodePoint(codePoint)
    || isPlane16PrivateUseCodePoint(codePoint);
}

// This helper function accepts an `input` string argument and returns the
// private-use-type code-point label string (if any) for that string. Matching
// is determined using the given `labelPrefix` and `isValidCodePoint`.
// Otherwise, the function returns undefined.
const getPrivateUseLabel =
  createLabelGetter(privateUseLabelPrefix, isPrivateUseCodePoint);

// This helper function accepts a `fuzzyName` string argument and returns the
// string (if any) whose private-use-type code-point label (if any) matches
// `fuzzyName`. Matching is determined using the given `labelPrefix` and
// `isValidCodePoint`. Otherwise, the returned string-getter function returns
// undefined. `fuzzyName` must be a fuzzily folded string (see `fuzzilyFold`
// from `./fuzzy-fold`).
const getPrivateUseCharacter =
  createStringGetter(privateUseLabelPrefix, isPrivateUseCodePoint);

// ## Noncharacter labels

// This helper function takes a code-point integer and returns a boolean.
const minNoncharacterCodePointFromFDD0 = 0xFDD0; // Inclusive minimum.
const maxNoncharacterCodePointFromFDD0 = 0xFDFF; // Exclusive maximum.
function isNoncharacterCodePointFromFDD0 (codePoint) {
  return minNoncharacterCodePointFromFDD0 <= codePoint
    && codePoint < maxNoncharacterCodePointFromFDD0;
}

// This helper function takes a code-point integer and returns a boolean.
const sizeOfPlane = 0x10000;
const planeNoncharacterCodePointSuffix0 = 0xFFFE;
const planeNoncharacterCodePointSuffix1 = 0xFFFF;
function isNoncharacterCodePointAtEndOfPlane (codePoint) {
  const codePointPlaneModulo = codePoint % sizeOfPlane;
  return codePointPlaneModulo === planeNoncharacterCodePointSuffix0
    || codePointPlaneModulo === planeNoncharacterCodePointSuffix1;
}

// This helper function takes a code-point integer and returns a boolean.
function isNoncharacterCodePoint (codePoint) {
  return isNoncharacterCodePointFromFDD0(codePoint)
    || isNoncharacterCodePointAtEndOfPlane(codePoint);
}

// This helper function accepts an `input` string argument and returns the
// noncharacter-type code-point label string (if any) for that string. Matching
// is determined using the given `labelPrefix` and `isValidCodePoint`.
// Otherwise, the returned string-label-getter function returns undefined.
const getNoncharacterLabel =
  createLabelGetter(noncharacterLabelPrefix, isNoncharacterCodePoint);

// This helper function accepts a `fuzzyName` string argument and returns the
// string (if any) whose noncharacter-type code-point label (if any) matches
// `fuzzyName`. Matching is determined using the given `labelPrefix` and
// `isValidCodePoint`. Otherwise, the returned string-getter function returns
// undefined. `fuzzyName` must be a fuzzily folded string (see `fuzzilyFold`
// from `./fuzzy-fold`).
const getNoncharacter =
  createStringGetter(noncharacterLabelPrefix, isNoncharacterCodePoint);

// ## Surrogate labels

// This helper function takes a code-point integer and returns a boolean.
const minSurrogateCodePoint = 0xD800; // Inclusive minimum.
const maxSurrogateCodePoint = 0xE000; // Exclusive maximum.
function isSurrogateCodePoint (codePoint) {
  return minSurrogateCodePoint <= codePoint
    && codePoint < maxSurrogateCodePoint;
}

// This helper function accepts an `input` string argument and returns the
// surrogate-type code-point label string (if any) for that string. Matching is
// determined using the given `labelPrefix` and `isValidCodePoint`. Otherwise,
// the function returns undefined.
const getSurrogateLabel =
  createLabelGetter(surrogateLabelPrefix, isSurrogateCodePoint);

// This helper function accepts a `fuzzyName` string argument and returns the
// string (if any) whose surrogate-type code-point label (if any) matches
// `fuzzyName`. Matching is determined using the given `labelPrefix` and
// `isValidCodePoint`. Otherwise, the returned string-getter function returns
// undefined. `fuzzyName` must be a fuzzily folded string (see `fuzzilyFold`
// from `./fuzzy-fold`).
const getSurrogate =
  createStringGetter(surrogateLabelPrefix, isSurrogateCodePoint);

// ## Exports

// This function accepts an `input` string argument and returns a name entry for
// the code-point label string (if any) for that string. Matching is determined
// using the given `labelPrefix` and `isValidCodePoint`. Otherwise, the function
// returns undefined.
export function getCodePointLabelEntry (input) {
  const label = getPrivateUseLabel(input)
    || getSurrogateLabel(input);
  if (label)
    return { name: label, nameType: 'LABEL' };
}

// This function accepts a `fuzzyName` string argument and returns the string
// (if any) whose code-point label (if any) matches `fuzzyName`. `fuzzyName`
// must be a fuzzily folded string (see `fuzzilyFold` from `./fuzzy-fold`).
export function getCodePointLabel (fuzzyName) {
  return getPrivateUseCharacter(fuzzyName)
    || getSurrogate(fuzzyName);
}

