// # Unit tests for `main/name-counter/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API – or which does not remain stable
// over time as the Unicode Character Database changes.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { deriveName, parseName } from '../../../main/name-counter/';

describe('deriveName', () => {
  test.todo('test deriveName');
});

describe('parseName', () => {
  describe.skip('NONCHARACTER', () => {
    test('does not match hexes with insufficient digits', () => {
      const name = 'ZFFF';
      const nameStem = name;
      expect(parseName(name)).toEqual({
        nameStem,
      });
    });

    test('matches five-digit scalar hexes ignoring leading zeroes', () => {
      const name = 'Z0FFFFF';
      const nameStem = 'Z0';
      const nameCounterType = 'HEX';
      const nameCounterValue = 0xFFFFF;
      expect(parseName(name)).toEqual({
        nameStem, nameCounterType, nameCounterValue,
      });
    });

    test('matches four-digit scalar hexes ignoring leading zeroes', () => {
      const name = 'Z0FFFF';
      const nameStem = 'Z0';
      const nameCounterType = 'HEX';
      const nameCounterValue = 0xFFFF;
      expect(parseName(name)).toEqual({
        nameStem, nameCounterType, nameCounterValue,
      });
    });

    test('matches six-digit scalar hexes', () => {
      const name = 'Z10FFFF';
      const nameStem = 'Z';
      const nameCounterType = 'HEX';
      const nameCounterValue = 0x10FFFF;
      expect(parseName(name)).toEqual({
        nameStem, nameCounterType, nameCounterValue,
      });
    });

    test('does not match hexes that exceed the maximum scalar', () => {
      const name = 'Z110000';
      const nameStem = 'Z1';
      const nameCounterType = 'HEX';
      const nameCounterValue = 0x10000;
      expect(parseName(name)).toEqual({
        nameStem, nameCounterType, nameCounterValue,
      });
    });
  });
});
