// # Unit tests for `main/math/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { hexBase, getNumOfDigits } from '../../../main/math/';

describe('getNumOfDigits', () => {
  test('with invalid base', () => {
    expect(() => getNumOfDigits(0, null)).toThrow(TypeError);
    expect(() => getNumOfDigits(0, {})).toThrow(TypeError);
    expect(() => getNumOfDigits(0, -1)).toThrow(TypeError);
  });

  test('with hexBase', () => {
    expect(getNumOfDigits(0, hexBase)).toBe(1);
    expect(getNumOfDigits(1, hexBase)).toBe(1);
    expect(getNumOfDigits(2, hexBase)).toBe(1);
    expect(getNumOfDigits(3, hexBase)).toBe(1);
    expect(getNumOfDigits(4, hexBase)).toBe(1);
    expect(getNumOfDigits(5, hexBase)).toBe(1);
    expect(getNumOfDigits(6, hexBase)).toBe(1);
    expect(getNumOfDigits(7, hexBase)).toBe(1);
    expect(getNumOfDigits(8, hexBase)).toBe(1);
    expect(getNumOfDigits(9, hexBase)).toBe(1);
    expect(getNumOfDigits(10, hexBase)).toBe(1);
    expect(getNumOfDigits(11, hexBase)).toBe(1);
    expect(getNumOfDigits(12, hexBase)).toBe(1);
    expect(getNumOfDigits(13, hexBase)).toBe(1);
    expect(getNumOfDigits(14, hexBase)).toBe(1);
    expect(getNumOfDigits(15, hexBase)).toBe(1);

    expect(getNumOfDigits(16, hexBase)).toBe(2);
    expect(getNumOfDigits(17, hexBase)).toBe(2);
    expect(getNumOfDigits(255, hexBase)).toBe(2);

    expect(getNumOfDigits(256, hexBase)).toBe(3);
    expect(getNumOfDigits(257, hexBase)).toBe(3);
    expect(getNumOfDigits(4095, hexBase)).toBe(3);
  });
});
