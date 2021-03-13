// # Unit tests for parsing and deriving name counters
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as NameCounter from '#js/name-counter';
import * as HangulSyllable from '#js/hangul-syllable';
import * as Hex from '#js/util/hex';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('parsing without name-counter type', () => {
  it('returns initial head when input counter is empty', () => {
    const nameCounterType = undefined;
    const initialNameCounterValue = 0;

    const expectedCounterValue = initialNameCounterValue;
    const inputFuzzyNameCounter = '';

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
      ),
      expectedCounterValue,
    );
  });

  it('returns `undefined` when input counter is not empty', () => {
    const nameCounterType = undefined;
    const initialNameCounterValue = 0;

    // When a name’s counter is not empty for a certain name range, then that
    // means the name did not completely match that name range’s name stem.
    const inputFuzzyNameCounter = 'EXTRANEOUS';

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
      ),
      undefined,
    );
  });
});

describe('parsing hyphen–hex counters', () => {
  it('does not match hexes with insufficient digits', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xFFF;
    const length = 1;

    // This is `'FFF'`, which is *not* a valid fuzzy hyphen–hex counter; it
    // should be `'0FFF'` instead in order to match the `0xFFF` code point.
    // (`Hex.fromInteger` does *not* pad zeroes, unlike `Hex.fromCodePoint`.)
    const inputFuzzyNameCounter = Hex.fromInteger(initialNameCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      undefined,
    );
  });

  it('matches four-digit scalar hexes with leading zeroes', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xFFF;
    const length = 1;

    const expectedCounterValue = initialNameCounterValue;
    // This is `'0FFF'`, which is a valid fuzzy hyphen–hex counter. Note that
    // there does not have to be a hyphen at the beginning, because any hyphen
    // at the beginning of a hyphen–hex counter would be a medial hyphen, which
    // fuzzy folding would always remove.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedCounterValue,
    );
  });

  it('matches four-digit scalar hexes without leading zeroes', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xFFFF;
    const length = 1;

    const expectedCounterValue = initialNameCounterValue;
    // This is `'FFFF'`, which is a valid fuzzy hyphen–hex counter. Note that
    // there does not have to be a hyphen at the beginning, because any hyphen
    // at the beginning of a hyphen–hex counter would be a medial hyphen, which
    // fuzzy folding would always remove.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedCounterValue);
    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedCounterValue,
    );
  });

  it('matches five-digit scalar hexes without leading zeroes', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xF_FFFF;
    const length = 1;

    const expectedCounterValue = initialNameCounterValue;
    // This is `'FFFFF'`, which is a valid fuzzy hyphen–hex counter. Note that
    // there does not have to be a hyphen at the beginning, because any hyphen
    // at the beginning of a hyphen–hex counter would be a medial hyphen, which
    // fuzzy folding would always remove.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedCounterValue,
    );
  });

  it('does not match 5-digit scalar hexes with leading 0s', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xFFFF;
    const length = 1;

    // This is `'0FFFF'`, which is *not* a valid fuzzy hyphen–hex counter; it
    // should be `'FFFF'` instead in order to match the `0xFFFF` code point.
    const inputFuzzyNameCounter =
      '0' + Hex.fromCodePoint(initialNameCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      undefined,
    );
  });

  it('matches six-digit scalar hexes without leading zeros', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0x10_FFFF;
    const length = 1;

    const expectedCounterValue = initialNameCounterValue;
    // This is `'10FFFF'`, which is a valid fuzzy hyphen–hex counter. Note that
    // there does not have to be a hyphen at the beginning, because any hyphen
    // at the beginning of a hyphen–hex counter would be a medial hyphen, which
    // fuzzy folding would always remove.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedCounterValue,
    );
  });

  it('matches hexes that in the middle of ranges', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0x1000;
    const length = 3;

    const expectedCounterValue = initialNameCounterValue + 1;
    // This is `'1001'`, which is within the range.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedCounterValue,
    );
  });

  it('matches hexes that at the ends of ranges', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0x1000;
    const length = 3;

    const expectedNameCounterValue = initialNameCounterValue + length - 1;
    // This is `'1002'`, which is within the range.
    const inputFuzzyNameCounter = Hex.fromCodePoint(expectedNameCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedNameCounterValue,
    );
  });

  it('does not match hexes that are beyond ranges’ lengths', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0x1000;
    const length = 3;

    // This is `'1003'`, which is *not* within the previously defined range.
    const inputFuzzyNameCounter =
      Hex.fromCodePoint(initialNameCounterValue + length);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      undefined,
    );
  });

  it('does not match hexes before ranges’ initial heads', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0x1000;
    const length = 3;

    // This is `'0FFF'`, which is *not* within the previously defined range.
    const inputFuzzyNameCounter =
      Hex.fromCodePoint(initialNameCounterValue - 1);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      undefined,
    );
  });

  it('does not match hexes containing invalid characters', () => {
    const nameCounterType = NameCounter.hyphenHexType;
    const initialNameCounterValue = 0xFFFF;
    const length = 1;

    // This is `'ZFFFF'`, which contains an invalid hex character.
    const inputFuzzyNameCounter =
      'Z' + Hex.fromCodePoint(initialNameCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      undefined,
    );
  });
});

describe('parsing Hangul-syllable counters', () => {
  it('does not match invalid syllable sounds', () => {
    const nameCounterType = NameCounter.hangulSyllableType;

    // “Z” is not a valid Hangul-syllable sound.
    const inputFuzzyNameCounter = 'Z';

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
      ),
      undefined,
    );
  });

  it('matches valid syllable sounds', () => {
    const nameCounterType = NameCounter.hangulSyllableType;
    // This is `0xAC00`, the zeroth Hangul-syllable code point.
    const initialNameCounterValue = HangulSyllable.basePoint;
    const length = HangulSyllable.numOfSyllables;

    // This is `0xAC00`, the zeroth Hangul-syllable code point.
    const expectedNameCounterValue = initialNameCounterValue;
    // This is `'GA'`, the zeroth Hangul-syllable sound.
    const inputFuzzyNameCounter =
      HangulSyllable.deriveSound(expectedNameCounterValue);

    assert.equal(
      NameCounter.parse(
        inputFuzzyNameCounter,
        nameCounterType,
        initialNameCounterValue,
        length,
      ),
      expectedNameCounterValue,
    );
  });
});

describe('deriving without name-counter type', () => {
  it('returns empty name counter', () => {
    const nameCounterType = undefined;

    const headPoint = 0;
    const expectedNameCounter = '';

    assert.equal(
      NameCounter.derive(headPoint, nameCounterType),
      expectedNameCounter,
    );
  });
});

describe('deriving hyphen–hex counters', () => {
  it('creates hyphen then hex', () => {
    const nameCounterType = NameCounter.hyphenHexType;

    const headPoint = 0x89AB;
    // This is `'-89AB'`.
    const expectedNameCounter = '-' + Hex.fromCodePoint(headPoint);

    assert.equal(
      NameCounter.derive(headPoint, nameCounterType),
      expectedNameCounter,
    );
  });
});

// Hangul syllables’ standard name counters start with spaces – e.g., ` GA` in
// `HANGUL SYLLABLE GA`, the zeroth Hangul-syllable name.
describe('deriving Hangul syllable counters', () => {
  it('creates space then syllable sound', () => {
    const nameCounterType = NameCounter.hangulSyllableType;

    // This is `0xAC00`, the zeroth Hangul-syllable code point.
    const inputHeadPoint = HangulSyllable.basePoint;
    // This is ` GA`, the zeroth Hangul-syllable standard name counter.
    const expectedNameCounter =
      ' ' + HangulSyllable.deriveSound(inputHeadPoint);

    assert.equal(
      NameCounter.derive(inputHeadPoint, nameCounterType),
      expectedNameCounter,
    );
  });
});
