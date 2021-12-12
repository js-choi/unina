// # String utilities
// This universal module exports utilities for transforming strings with hexes,
// numbers, and code points.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { hexBase } from '../math/';

export const numOfPlanes = 0x11;
export const numOfScalarsPerPlane = 0x10000;

// This predicate function returns how many UTF-16 code units are required for
// the given scalar (an integer). This is important because JavaScript’s
// substring method uses UTF-16 code units.
export function getNumOfScalarUTF16CodeUnits (scalar) {
  return scalar < numOfScalarsPerPlane ? 1 : 2;
}

// This function converts the `hex` string into an integer. If the `hex` is
// invalid (e.g., `'123XYZ'`), then it returns undefined. The `hex` must not
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

// This function converts a `scalar` integer into its hex string. The
// string is padded with zeroes as necessary to make it at least four digits
// long, which is the minimum standard length with which all code points are
// written.
const minNumOfScalarDigits = 4;
export function getPaddedHexFromScalar (scalar) {
  return getPaddedHexFromNumber(scalar, minNumOfScalarDigits);
}

// This function converts the `string` into an array of its code-point integers
// (i.e., scalar integers, none of which are UTF-16 surrogates).
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
