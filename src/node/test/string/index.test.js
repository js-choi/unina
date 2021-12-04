// # Unit tests for `main/string/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import {
  getNumberFromHex, getHexFromNumber, getPaddedHexFromNumber,
  getPaddedHexFromCodePoint, getCodePointsFromString, collator,
} from '../../../main/string/';

test('getNumberFromHex', () => {
  expect(getNumberFromHex('')).toBeUndefined();
  expect(getNumberFromHex('X')).toBeUndefined();
  expect(getNumberFromHex('1X')).toBeUndefined();
  expect(getNumberFromHex(' 1')).toBeUndefined();
  expect(getNumberFromHex('-1')).toBeUndefined();
  expect(getNumberFromHex('1')).toBe(1);
  expect(getNumberFromHex('A1')).toBe(161);
});

test('getHexFromNumber', () => {
  expect(() => getHexFromNumber()).toThrow(TypeError);
  expect(() => getHexFromNumber({})).toThrow(TypeError);
  expect(() => getHexFromNumber('')).toThrow(TypeError);
  expect(() => getHexFromNumber(-1)).toThrow(TypeError);
  expect(getHexFromNumber(0)).toBe('0');
  expect(getHexFromNumber(1)).toBe('1');
  expect(getHexFromNumber(15)).toBe('F');
  expect(getHexFromNumber(16)).toBe('10');
});

test('getPaddedHexFromNumber', () => {
  expect(() => getPaddedHexFromNumber()).toThrow(TypeError);
  expect(() => getPaddedHexFromNumber({})).toThrow(TypeError);
  expect(() => getPaddedHexFromNumber('')).toThrow(TypeError);
  expect(() => getPaddedHexFromNumber(-1)).toThrow(TypeError);
  expect(getPaddedHexFromNumber(0)).toBe('0');
  expect(getPaddedHexFromNumber(0, 1)).toBe('0');
  expect(getPaddedHexFromNumber(0, 2)).toBe('00');
  expect(getPaddedHexFromNumber(0, 3)).toBe('000');
  expect(getPaddedHexFromNumber(1)).toBe('1');
  expect(getPaddedHexFromNumber(1, 1)).toBe('1');
  expect(getPaddedHexFromNumber(1, 2)).toBe('01');
  expect(getPaddedHexFromNumber(1, 3)).toBe('001');
  expect(getPaddedHexFromNumber(15)).toBe('F');
  expect(getPaddedHexFromNumber(15, 1)).toBe('F');
  expect(getPaddedHexFromNumber(15, 2)).toBe('0F');
  expect(getPaddedHexFromNumber(15, 3)).toBe('00F');
  expect(getPaddedHexFromNumber(16)).toBe('10');
  expect(getPaddedHexFromNumber(16, 1)).toBe('10');
  expect(getPaddedHexFromNumber(16, 2)).toBe('10');
  expect(getPaddedHexFromNumber(16, 3)).toBe('010');
});

test('getPaddedHexFromCodePoint', () => {
  expect(() => getPaddedHexFromCodePoint()).toThrow(TypeError);
  expect(() => getPaddedHexFromCodePoint({})).toThrow(TypeError);
  expect(() => getPaddedHexFromCodePoint('')).toThrow(TypeError);
  expect(() => getPaddedHexFromCodePoint(-1)).toThrow(TypeError);
  expect(getPaddedHexFromCodePoint(0)).toBe('0000');
  expect(getPaddedHexFromCodePoint(1)).toBe('0001');
  expect(getPaddedHexFromCodePoint(15)).toBe('000F');
  expect(getPaddedHexFromCodePoint(16)).toBe('0010');
  expect(getPaddedHexFromCodePoint(0xFFFF)).toBe('FFFF');
  expect(getPaddedHexFromCodePoint(0x10000)).toBe('10000');
  expect(getPaddedHexFromCodePoint(0x100000)).toBe('100000');
});

test('getCodePointsFromString', () => {
  expect(() => getCodePointsFromString()).toThrow(TypeError);
  expect(() => getCodePointsFromString({})).toThrow(TypeError);
  expect(() => getCodePointsFromString(0)).toThrow(TypeError);
  expect(getCodePointsFromString('')).toEqual([]);
  expect(getCodePointsFromString('\u0000')).toEqual([ 0 ]);
  expect(getCodePointsFromString('\u{10000}')).toEqual([ 0x10000 ]);
  expect(getCodePointsFromString('\u0000\u{10000}')).toEqual([ 0, 0x10000 ]);
  expect(getCodePointsFromString('\u{10000}\u0000')).toEqual([ 0x10000, 0 ]);
});

test('collator', () => {
  expect(collator.compare('', '')).toBe(0);
  expect(collator.compare('', ' ')).toBe(-1);
  expect(collator.compare('', '  ')).toBe(-1);
  expect(collator.compare('', ' -')).toBe(-1);
  expect(collator.compare('', ' 0')).toBe(-1);
  expect(collator.compare('', ' A')).toBe(-1);
  expect(collator.compare('', '-')).toBe(-1);
  expect(collator.compare('', ' -')).toBe(-1);
  expect(collator.compare('', '--')).toBe(-1);
  expect(collator.compare('', '-0')).toBe(-1);
  expect(collator.compare('', '-A')).toBe(-1);
  expect(collator.compare('', '0')).toBe(-1);
  expect(collator.compare('', ' -')).toBe(-1);
  expect(collator.compare('', '0-')).toBe(-1);
  expect(collator.compare('', '00')).toBe(-1);
  expect(collator.compare('', '0A')).toBe(-1);
  expect(collator.compare('', 'A')).toBe(-1);
  expect(collator.compare('', ' -')).toBe(-1);
  expect(collator.compare('', 'A-')).toBe(-1);
  expect(collator.compare('', 'A0')).toBe(-1);
  expect(collator.compare('', 'AA')).toBe(-1);

  expect(collator.compare(' ', '')).toBe(+1);
  expect(collator.compare(' ', ' ')).toBe(0);
  expect(collator.compare(' ', '  ')).toBe(-1);
  expect(collator.compare(' ', ' -')).toBe(-1);
  expect(collator.compare(' ', ' 0')).toBe(-1);
  expect(collator.compare(' ', ' A')).toBe(-1);
  expect(collator.compare(' ', '-')).toBe(-1);
  expect(collator.compare(' ', '- ')).toBe(-1);
  expect(collator.compare(' ', '--')).toBe(-1);
  expect(collator.compare(' ', '-0')).toBe(-1);
  expect(collator.compare(' ', '-A')).toBe(-1);
  expect(collator.compare(' ', '0')).toBe(-1);
  expect(collator.compare(' ', '0 ')).toBe(-1);
  expect(collator.compare(' ', '0-')).toBe(-1);
  expect(collator.compare(' ', '00')).toBe(-1);
  expect(collator.compare(' ', '0A')).toBe(-1);
  expect(collator.compare(' ', 'A')).toBe(-1);
  expect(collator.compare(' ', 'A ')).toBe(-1);
  expect(collator.compare(' ', 'A-')).toBe(-1);
  expect(collator.compare(' ', 'A0')).toBe(-1);
  expect(collator.compare('  ', 'AA')).toBe(-1);

  expect(collator.compare(' -', '')).toBe(+1);
  expect(collator.compare(' -', ' ')).toBe(+1);
  expect(collator.compare(' -', '  ')).toBe(+1);
  expect(collator.compare(' -', ' -')).toBe(0);
  expect(collator.compare(' -', ' 0')).toBe(-1);
  expect(collator.compare(' -', ' A')).toBe(-1);
  expect(collator.compare(' -', '-')).toBe(-1);
  expect(collator.compare(' -', '- ')).toBe(-1);
  expect(collator.compare(' -', '--')).toBe(-1);
  expect(collator.compare(' -', '-0')).toBe(-1);
  expect(collator.compare(' -', '-A')).toBe(-1);
  expect(collator.compare(' -', '0')).toBe(-1);
  expect(collator.compare(' -', '0 ')).toBe(-1);
  expect(collator.compare(' -', '0-')).toBe(-1);
  expect(collator.compare(' -', '00')).toBe(-1);
  expect(collator.compare(' -', '0A')).toBe(-1);
  expect(collator.compare(' -', 'A')).toBe(-1);
  expect(collator.compare(' -', 'A ')).toBe(-1);
  expect(collator.compare(' -', 'A-')).toBe(-1);
  expect(collator.compare(' -', 'A0')).toBe(-1);
  expect(collator.compare(' -', 'AA')).toBe(-1);

  expect(collator.compare(' 0', '')).toBe(+1);
  expect(collator.compare(' 0', ' ')).toBe(+1);
  expect(collator.compare(' 0', '  ')).toBe(+1);
  expect(collator.compare(' 0', ' -')).toBe(+1);
  expect(collator.compare(' 0', ' 0')).toBe(0);
  expect(collator.compare(' 0', ' A')).toBe(-1);
  expect(collator.compare(' 0', '-')).toBe(-1);
  expect(collator.compare(' 0', '- ')).toBe(-1);
  expect(collator.compare(' 0', '--')).toBe(-1);
  expect(collator.compare(' 0', '-0')).toBe(-1);
  expect(collator.compare(' 0', '-A')).toBe(-1);
  expect(collator.compare(' 0', '0')).toBe(-1);
  expect(collator.compare(' 0', '0 ')).toBe(-1);
  expect(collator.compare(' 0', '0-')).toBe(-1);
  expect(collator.compare(' 0', '00')).toBe(-1);
  expect(collator.compare(' 0', '0A')).toBe(-1);
  expect(collator.compare(' 0', 'A')).toBe(-1);
  expect(collator.compare(' 0', 'A ')).toBe(-1);
  expect(collator.compare(' 0', 'A-')).toBe(-1);
  expect(collator.compare(' 0', 'A0')).toBe(-1);
  expect(collator.compare(' 0', 'AA')).toBe(-1);

  expect(collator.compare(' A', '')).toBe(+1);
  expect(collator.compare(' A', ' ')).toBe(+1);
  expect(collator.compare(' A', '  ')).toBe(+1);
  expect(collator.compare(' A', ' -')).toBe(+1);
  expect(collator.compare(' A', ' 0')).toBe(+1);
  expect(collator.compare(' A', ' A')).toBe(0);
  expect(collator.compare(' A', '-')).toBe(-1);
  expect(collator.compare(' A', '- ')).toBe(-1);
  expect(collator.compare(' A', '--')).toBe(-1);
  expect(collator.compare(' A', '-0')).toBe(-1);
  expect(collator.compare(' A', '-A')).toBe(-1);
  expect(collator.compare(' A', '0')).toBe(-1);
  expect(collator.compare(' A', '0 ')).toBe(-1);
  expect(collator.compare(' A', '0-')).toBe(-1);
  expect(collator.compare(' A', '00')).toBe(-1);
  expect(collator.compare(' A', '0A')).toBe(-1);
  expect(collator.compare(' A', 'A')).toBe(-1);
  expect(collator.compare(' A', 'A ')).toBe(-1);
  expect(collator.compare(' A', 'A-')).toBe(-1);
  expect(collator.compare(' A', 'A0')).toBe(-1);
  expect(collator.compare(' A', 'AA')).toBe(-1);

  expect(collator.compare('-', '')).toBe(+1);
  expect(collator.compare('-', ' ')).toBe(+1);
  expect(collator.compare('-', '  ')).toBe(+1);
  expect(collator.compare('-', ' -')).toBe(+1);
  expect(collator.compare('-', ' 0')).toBe(+1);
  expect(collator.compare('-', ' A')).toBe(+1);
  expect(collator.compare('-', '-')).toBe(0);
  expect(collator.compare('-', '- ')).toBe(-1);
  expect(collator.compare('-', '--')).toBe(-1);
  expect(collator.compare('-', '-0')).toBe(-1);
  expect(collator.compare('-', '-A')).toBe(-1);
  expect(collator.compare('-', '0')).toBe(-1);
  expect(collator.compare('-', '0 ')).toBe(-1);
  expect(collator.compare('-', '0-')).toBe(-1);
  expect(collator.compare('-', '00')).toBe(-1);
  expect(collator.compare('-', '0A')).toBe(-1);
  expect(collator.compare('-', 'A')).toBe(-1);
  expect(collator.compare('-', 'A ')).toBe(-1);
  expect(collator.compare('-', 'A-')).toBe(-1);
  expect(collator.compare('-', 'A0')).toBe(-1);
  expect(collator.compare('-', 'AA')).toBe(-1);

  expect(collator.compare('0', '')).toBe(+1);
  expect(collator.compare('0', ' ')).toBe(+1);
  expect(collator.compare('0', '  ')).toBe(+1);
  expect(collator.compare('0', ' -')).toBe(+1);
  expect(collator.compare('0', ' 0')).toBe(+1);
  expect(collator.compare('0', ' A')).toBe(+1);
  expect(collator.compare('0', '-')).toBe(+1);
  expect(collator.compare('0', '- ')).toBe(+1);
  expect(collator.compare('0', '--')).toBe(+1);
  expect(collator.compare('0', '-0')).toBe(+1);
  expect(collator.compare('0', '-A')).toBe(+1);
  expect(collator.compare('0', '0')).toBe(0);
  expect(collator.compare('0', '0 ')).toBe(-1);
  expect(collator.compare('0', '0-')).toBe(-1);
  expect(collator.compare('0', '00')).toBe(-1);
  expect(collator.compare('0', '0A')).toBe(-1);
  expect(collator.compare('0', 'A')).toBe(-1);
  expect(collator.compare('0', 'A ')).toBe(-1);
  expect(collator.compare('0', 'A-')).toBe(-1);
  expect(collator.compare('0', 'A0')).toBe(-1);
  expect(collator.compare('0', 'AA')).toBe(-1);

  expect(collator.compare('A', '')).toBe(+1);
  expect(collator.compare('A', ' ')).toBe(+1);
  expect(collator.compare('A', '  ')).toBe(+1);
  expect(collator.compare('A', ' -')).toBe(+1);
  expect(collator.compare('A', ' 0')).toBe(+1);
  expect(collator.compare('A', ' A')).toBe(+1);
  expect(collator.compare('A', '-')).toBe(+1);
  expect(collator.compare('A', '- ')).toBe(+1);
  expect(collator.compare('A', '--')).toBe(+1);
  expect(collator.compare('A', '-0')).toBe(+1);
  expect(collator.compare('A', '-A')).toBe(+1);
  expect(collator.compare('A', '-0')).toBe(+1);
  expect(collator.compare('A', '0')).toBe(+1);
  expect(collator.compare('A', '00')).toBe(+1);
  expect(collator.compare('A', '0 ')).toBe(+1);
  expect(collator.compare('A', '0-')).toBe(+1);
  expect(collator.compare('A', '0A')).toBe(+1);
  expect(collator.compare('A', 'A')).toBe(0);
  expect(collator.compare('A', 'A ')).toBe(-1);
  expect(collator.compare('A', 'A-')).toBe(-1);
  expect(collator.compare('A', 'A0')).toBe(-1);
  expect(collator.compare('A', 'AA')).toBe(-1);
});
