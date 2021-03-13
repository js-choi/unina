// # Unit tests for name fuzzy folding
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '#js/fuzzy-folder';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('folding most names', () => {
  it('folds lowercase to upper case', () => {
    assert.equal(fuzzilyFold('Test'), 'TEST');
  });

  it('preserves alphanumeric characters', () => {
    assert.equal(fuzzilyFold('TEST'), 'TEST');
  });

  // Spaces.

  it('removes single leading “ ”s', () => {
    assert.equal(fuzzilyFold(' TEST'), 'TEST');
  });

  it('removes multiple leading “ ”s', () => {
    assert.equal(fuzzilyFold('  TEST'), 'TEST');
  });

  it('removes single medial “ ”s', () => {
    assert.equal(fuzzilyFold('T EST'), 'TEST');
  });

  it('removes multiple medial “ ”s', () => {
    assert.equal(fuzzilyFold('T  EST'), 'TEST');
  });

  it('removes single trailing “ ”s', () => {
    assert.equal(fuzzilyFold('TEST '), 'TEST');
  });

  it('removes multiple trailing “ ”s', () => {
    assert.equal(fuzzilyFold('TEST  '), 'TEST');
  });

  // Underscores.

  it('removes single leading _s', () => {
    assert.equal(fuzzilyFold('_TEST'), 'TEST');
  });

  it('removes multiple leading _s', () => {
    assert.equal(fuzzilyFold('__TEST'), 'TEST');
  });

  it('removes single medial _s', () => {
    assert.equal(fuzzilyFold('T_EST'), 'TEST');
  });

  it('removes multiple medial _s', () => {
    assert.equal(fuzzilyFold('T__EST'), 'TEST');
  });

  it('removes single trailing _s', () => {
    assert.equal(fuzzilyFold('TEST_'), 'TEST');
  });

  it('removes multiple trailing _s', () => {
    assert.equal(fuzzilyFold('TEST__'), 'TEST');
  });

  // Medial hyphens.

  it('removes “-”s between two letters', () => {
    assert.equal(fuzzilyFold('T-EST'), 'TEST');
  });

  it('removes “-”s between letter then digit', () => {
    assert.equal(fuzzilyFold('TEST-0'), 'TEST0');
  });

  it('removes “-”s between digit then letter', () => {
    assert.equal(fuzzilyFold('0-TEST'), '0TEST');
  });

  it('preserves double “-”s', () => {
    assert.equal(fuzzilyFold('T--EST'), 'T--EST');
  });

  // Hyphens with spaces.

  it('preserves “-”s between two “ ”s', () => {
    assert.equal(fuzzilyFold('T - EST'), 'T-EST');
  });

  it('preserves “-”s between start then “ ”', () => {
    assert.equal(fuzzilyFold(' -TEST'), '-TEST');
  });

  it('preserves “-”s between “ ” then end', () => {
    assert.equal(fuzzilyFold('TEST- '), 'TEST-');
  });

  it('preserves “-”s between letter then “ ”', () => {
    assert.equal(fuzzilyFold('T- EST'), 'T-EST');
  });

  it('preserves “-”s between “ ” then letter', () => {
    assert.equal(fuzzilyFold('T -EST'), 'T-EST');
  });

  it('preserves “-”s between number then “ ”', () => {
    assert.equal(fuzzilyFold('0- TEST'), '0-TEST');
  });

  it('preserves “-”s between “ ” then number', () => {
    assert.equal(fuzzilyFold('TEST -0'), 'TEST-0');
  });

  // Hyphens with underscores.

  it('preserves “-”s between two _s', () => {
    assert.equal(fuzzilyFold('T_-_EST'), 'T-EST');
  });

  it('preserves “-”s between start then _', () => {
    assert.equal(fuzzilyFold('_-TEST'), '-TEST');
  });

  it('preserves “-”s between _ then end', () => {
    assert.equal(fuzzilyFold('TEST-_'), 'TEST-');
  });

  it('preserves “-”s between letter then _', () => {
    assert.equal(fuzzilyFold('T-_EST'), 'T-EST');
  });

  it('preserves “-”s between _ then letter', () => {
    assert.equal(fuzzilyFold('T_-EST'), 'T-EST');
  });

  it('preserves “-”s between number then _', () => {
    assert.equal(fuzzilyFold('0-_TEST'), '0-TEST');
  });

  it('preserves “-”s between _ then number', () => {
    assert.equal(fuzzilyFold('TEST_-0'), 'TEST-0');
  });
});

describe('folding Hangul jungseong names', () => {
  it('removes ignorables in ordinary Hangul jungseong names', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG A'), 'HANGULJUNGSEONGA');
  });

  it('remove ignorables in Hangul Jungseong OE’s prefix', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG OE'), 'HANGULJUNGSEONGOE');
  });

  it('remove “ ”s in Hangul Jungseong OE’s OE', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O E'), 'HANGULJUNGSEONGOE');
  });

  it('removes “_”s in Hangul Jungseong OE’s OE', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O_E'), 'HANGULJUNGSEONGOE');
  });

  it('preserves “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O-E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “ ” before “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O- E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “ ” after “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O -E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “ ”s around “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O - E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “_” before “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O_-E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “_” after “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O-_E'), 'HANGULJUNGSEONGO-E');
  });

  it('strips “_”s around “-” in Hangul Junseong O-E’s O-E', () => {
    assert.equal(fuzzilyFold('HANGUL JUNGSEONG O_-_E'), 'HANGULJUNGSEONGO-E');
  });
});
