// # Unit tests for `main/name-entry/`
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

import fuzzilyFold from '../../../main/fuzzy-fold/';

test('case folding', () => {
  expect(fuzzilyFold('Test')).toBe('TEST');
});

describe('without following name counter', () => {
  test('non-special names without non-medial hyphens', () => {
    expect(fuzzilyFold('TEST')).toBe('TEST');
    expect(fuzzilyFold('T EST')).toBe('TEST');
    expect(fuzzilyFold('T_EST')).toBe('TEST');
    expect(fuzzilyFold('TEST ')).toBe('TEST');
    expect(fuzzilyFold('TEST  ')).toBe('TEST');
    expect(fuzzilyFold('TEST_')).toBe('TEST');
    expect(fuzzilyFold('TEST__')).toBe('TEST');
    expect(fuzzilyFold('T-EST')).toBe('TEST');
  });

  test('non-special names with non-medial hyphens', () => {
    expect(fuzzilyFold('TEST-')).toBe('TEST-');
    expect(fuzzilyFold('TEST-0')).toBe('TEST0');
    expect(fuzzilyFold('TEST -')).toBe('TEST-');
    expect(fuzzilyFold('TEST_-')).toBe('TEST-');
    expect(fuzzilyFold('TEST_-')).toBe('TEST-');
    expect(fuzzilyFold('TEST - ')).toBe('TEST-');
    expect(fuzzilyFold('TEST_-_')).toBe('TEST-');
    expect(fuzzilyFold('TEST--')).toBe('TEST--');
    expect(fuzzilyFold('TEST- -')).toBe('TEST--');
    expect(fuzzilyFold('TEST-_-')).toBe('TEST--');
    expect(fuzzilyFold(' TEST')).toBe('TEST');
    expect(fuzzilyFold('_TEST')).toBe('TEST');
    expect(fuzzilyFold('  TEST')).toBe('TEST');
    expect(fuzzilyFold('__TEST')).toBe('TEST');
    expect(fuzzilyFold('-TEST')).toBe('-TEST');
    expect(fuzzilyFold('0-TEST')).toBe('0TEST');
    expect(fuzzilyFold('- TEST')).toBe('-TEST');
    expect(fuzzilyFold('-_TEST')).toBe('-TEST');
    expect(fuzzilyFold(' - TEST')).toBe('-TEST');
    expect(fuzzilyFold('_-_TEST')).toBe('-TEST');
    expect(fuzzilyFold('--TEST')).toBe('--TEST');
    expect(fuzzilyFold('- -TEST')).toBe('--TEST');
    expect(fuzzilyFold('-_-TEST')).toBe('--TEST');
    expect(fuzzilyFold('T--EST')).toBe('T--EST');
    expect(fuzzilyFold('T- EST')).toBe('T-EST');
    expect(fuzzilyFold('T-_EST')).toBe('T-EST');
    expect(fuzzilyFold('T -EST')).toBe('T-EST');
    expect(fuzzilyFold('T_-EST')).toBe('T-EST');
    expect(fuzzilyFold('T - EST')).toBe('T-EST');
    expect(fuzzilyFold('T_-_EST')).toBe('T-EST');
  });

  test('Hangul jungseong names', () => {
    expect(fuzzilyFold('HANGUL JUNGSEONG A')).toBe('HANGULJUNGSEONGA');
    expect(fuzzilyFold('HANGUL JUNGSEONG OE')).toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O E')).toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_E')).toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O-E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O- E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O-_E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O -E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_-E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O - E')).toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_-_E')).toBe('HANGULJUNGSEONGO-E');
  });
});

describe('with following name counter', () => {
  test('non-special names without non-medial hyphens', () => {
    expect(fuzzilyFold('TEST', true)).toBe('TEST');
    expect(fuzzilyFold('T EST', true)).toBe('TEST');
    expect(fuzzilyFold('T_EST', true)).toBe('TEST');
    expect(fuzzilyFold('TEST ', true)).toBe('TEST');
    expect(fuzzilyFold('TEST  ', true)).toBe('TEST');
    expect(fuzzilyFold('TEST_', true)).toBe('TEST');
    expect(fuzzilyFold('TEST__', true)).toBe('TEST');
    expect(fuzzilyFold('T-EST', true)).toBe('TEST');
  });

  test('non-special names with non-medial hyphens', () => {
    expect(fuzzilyFold('TEST-', true)).toBe('TEST');
    expect(fuzzilyFold('TEST-0', true)).toBe('TEST0');
    expect(fuzzilyFold('TEST -', true)).toBe('TEST-');
    expect(fuzzilyFold('TEST_-', true)).toBe('TEST-');
    expect(fuzzilyFold('TEST_-', true)).toBe('TEST-');
    expect(fuzzilyFold('TEST - ', true)).toBe('TEST-');
    expect(fuzzilyFold('TEST_-_', true)).toBe('TEST-');
    expect(fuzzilyFold('TEST--', true)).toBe('TEST--');
    expect(fuzzilyFold('TEST- -', true)).toBe('TEST--');
    expect(fuzzilyFold('TEST-_-', true)).toBe('TEST--');
    expect(fuzzilyFold(' TEST', true)).toBe('TEST');
    expect(fuzzilyFold('_TEST', true)).toBe('TEST');
    expect(fuzzilyFold('  TEST', true)).toBe('TEST');
    expect(fuzzilyFold('__TEST', true)).toBe('TEST');
    expect(fuzzilyFold('-TEST', true)).toBe('-TEST');
    expect(fuzzilyFold('0-TEST', true)).toBe('0TEST');
    expect(fuzzilyFold('- TEST', true)).toBe('-TEST');
    expect(fuzzilyFold('-_TEST', true)).toBe('-TEST');
    expect(fuzzilyFold(' - TEST', true)).toBe('-TEST');
    expect(fuzzilyFold('_-_TEST', true)).toBe('-TEST');
    expect(fuzzilyFold('--TEST', true)).toBe('--TEST');
    expect(fuzzilyFold('- -TEST', true)).toBe('--TEST');
    expect(fuzzilyFold('-_-TEST', true)).toBe('--TEST');
    expect(fuzzilyFold('T--EST', true)).toBe('T--EST');
    expect(fuzzilyFold('T- EST', true)).toBe('T-EST');
    expect(fuzzilyFold('T-_EST', true)).toBe('T-EST');
    expect(fuzzilyFold('T -EST', true)).toBe('T-EST');
    expect(fuzzilyFold('T_-EST', true)).toBe('T-EST');
    expect(fuzzilyFold('T - EST', true)).toBe('T-EST');
    expect(fuzzilyFold('T_-_EST', true)).toBe('T-EST');
  });

  test('Hangul jungseong names', () => {
    expect(fuzzilyFold('HANGUL JUNGSEONG A', true))
      .toBe('HANGULJUNGSEONGA');
    expect(fuzzilyFold('HANGUL JUNGSEONG OE', true))
      .toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O E', true))
      .toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_E', true))
      .toBe('HANGULJUNGSEONGOE');
    expect(fuzzilyFold('HANGUL JUNGSEONG O-E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O- E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O-_E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O -E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_-E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O - E', true))
      .toBe('HANGULJUNGSEONGO-E');
    expect(fuzzilyFold('HANGUL JUNGSEONG O_-_E', true))
      .toBe('HANGULJUNGSEONGO-E');
  });
});
