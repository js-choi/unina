// # String utilities
// This universal module exports utilities for transforming strings with hexes,
// numbers, and code points.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { hexBase } from '../math/';
import { generateRange } from '../iterator/';

// The end of the directory (and the start of the database body)
// is marked by a `U+0003` Start of Text.
// This is the location of the database’s `basePointer`.
export const directoryEndToken = '\u0003';

// Certain specific fields in the database are separated by a delimiter.
export const fieldSeparator = ':';

// This function converts the `hex` string into an integer. If the `hex` is
// invalid (e.g., `'123XYZ'`), then it returns `undefined`. The `hex` must not
// have a fractional part.
export function getNumberFromHex (hex) {
  const value = Number(`0x${hex}`);
  return !Number.isNaN(value) ? value : undefined;
}

// This function converts the `value` integer into its hex string.
// The `value` must not be negative.
export function getHexFromNumber (value) {
  if (!Number.isInteger(value) || value < 0)
    throw new TypeError(
      `Hex number ${ value } must be a non-negative integer.`);
  return value.toString(hexBase).toUpperCase();
}

// This function converts the `value` integer into its hex string. The string is
// padded with zeroes as necessary to make it at least `minNumOfDigits` digits
// long.
const zeroDigit = '0';
export function getPaddedHexFromNumber (value, minNumOfDigits) {
  return getHexFromNumber(value).padStart(minNumOfDigits, zeroDigit);
}

// This function converts the `codePoint` integers into its hex string. The
// string is padded with zeroes as necessary to make it at least four digits
// long, which is the minimum standard length with which all code points are
// written.
const minNumOfCodePointDigits = 4;
export function getPaddedHexFromCodePoint (codePoint) {
  return getPaddedHexFromNumber(codePoint, minNumOfCodePointDigits);
}

// This function converts the `string` into an array of its code-point integers.
export function getCodePointsFromString (string) {
  if (typeof string !== 'string')
    throw new TypeError(
      `Cannot get code points from non-string ${ string }.`);
  return Array.from(string).map(codePointString =>
    codePointString.codePointAt(0));
}

// This collator’s `compare` method lexicographically compares two strings,
// using a Default Unicode Collation Element Table collator, and returning a
// negative number, zero, or a positive number.
export const collator = new Intl.Collator('ducet');

// This function slices the given `data` string,
// from the given `pointer` up to the given `length`.
export function sliceByLength (data, pointer, length) {
  return data.slice(pointer, pointer + length);
}

// This function returns the length of the longest common prefix that is shared
// between the two given strings. Given `n = getLongestCommonPrefix()`, then
// `string0.substring(0, n) === string1.substring(0, n)` is guaranteed.
export function getMaxCommonPrefixLength (string0, string1) {
  const stringLength0 = string0.length;
  const stringLength1 = string1.length;
  for (const i of generateRange(0, stringLength0))
    if (i >= stringLength1 || string0.charAt(i) !== string1.charAt(i))
      return i;
  return stringLength0;
}
