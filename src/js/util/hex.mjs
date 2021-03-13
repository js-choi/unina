// # Hexadecimal utilities
// This universal module exports utilities for transforming code points and
// hexadecimal-digit strings.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

// All hexes are in base 16.
export const hexBase = 16;

// This function converts the `hex` string into an integer. If the `hex` is
// invalid (e.g., `'123XYZ'`), then it returns `undefined`. The `hex` must not
// have a fractional part.
export function getInteger (hex) {
  const value = Number(`0x${hex}`);
  return !Number.isNaN(value) ? value : undefined;
}

// This function converts the `value` integer into its hex string.
// The `value` must not be negative.
export function fromInteger (value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(
      `Hex number ${ value } must be a non-negative integer.`);
  }

  return value.toString(hexBase).toUpperCase();
}

// This function converts the `value` integer into its hex string. The string
// is padded with zeroes as necessary to make it at least `minNumOfDigits`
// digits long.
const zeroDigit = '0';
export function fromIntegerWithPadding (value, minNumOfDigits) {
  return fromInteger(value).padStart(minNumOfDigits, zeroDigit);
}

// Four digits is the minimum standard length with which all code points’s
// hexes are written.
export const minNumOfCodePointHexDigits = 4;

// This function converts the `codePoint` integers into its hex string. The
// string is padded with zeroes as necessary to make it at least four digits
// long, which is the minimum standard length with which all code points’s
// hexes are written.
export function fromCodePoint (codePoint) {
  return fromIntegerWithPadding(codePoint, minNumOfCodePointHexDigits);
}
