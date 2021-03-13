// # Unit tests for hexadecimal-digit utilities
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as Hex from '#js/util/hex';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('getting hexes → integers', () => {
  it('returns undefined when input is blank', () => {
    assert.equal(Hex.getInteger(''), undefined);
  });

  it('returns undefined when input has initial non-hex char', () => {
    assert.equal(Hex.getInteger('X'), undefined);
  });

  it('returns undefined when input has non-init non-hex char', () => {
    assert.equal(Hex.getInteger('1X'), undefined);
  });

  it('returns undefined when input starts with space', () => {
    assert.equal(Hex.getInteger(' 1'), undefined);
  });

  it('returns undefined when input starts with “-”', () => {
    assert.equal(Hex.getInteger('-1'), undefined);
  });

  it('returns numeric value of single-digit hex', () => {
    assert.equal(Hex.getInteger('1'), 1);
  });

  it('returns numeric value of multi-digit hex', () => {
    assert.equal(Hex.getInteger('A1'), 161);
  });
});

describe('getting integers → unpadded hexes', () => {
  it('throws when input is undefined', () => {
    assert.throws(() => Hex.fromInteger(), TypeError);
  });

  it('throws when input is invalid object', () => {
    assert.throws(() => Hex.fromInteger({}), TypeError);
  });

  it('throws when input is invalid string', () => {
    assert.throws(() => Hex.fromInteger(''), TypeError);
  });

  it('throws when input is negative integer', () => {
    assert.throws(() => Hex.fromInteger(-1), TypeError);
  });

  it('throws when input is non-integer number', () => {
    assert.throws(() => Hex.fromInteger(0.5), TypeError);
  });

  it('returns numeric hex of zero', () => {
    assert.equal(Hex.fromInteger(0), '0');
  });

  it('returns numeric hex of one', () => {
    assert.equal(Hex.fromInteger(1), '1');
  });

  it('returns one-digit hex up to 0xF', () => {
    assert.equal(Hex.fromInteger(0xF), 'F');
  });

  it('returns multidigit-digit hex starting at 0x10', () => {
    assert.equal(Hex.fromInteger(0x10), '10');
  });
});

describe('getting integers → padded hexes', () => {
  it('throws when input is undefined', () => {
    assert.throws(() => Hex.fromIntegerWithPadding(), TypeError);
  });

  it('throws when input is invalid object', () => {
    assert.throws(() => Hex.fromIntegerWithPadding({}), TypeError);
  });

  it('throws when input is invalid string', () => {
    assert.throws(() => Hex.fromIntegerWithPadding(''), TypeError);
  });

  it('throws when input is negative integer', () => {
    assert.throws(() => Hex.fromIntegerWithPadding(-1), TypeError);
  });

  it('throws when input is non-integer number', () => {
    assert.throws(() => Hex.fromIntegerWithPadding(0.5), TypeError);
  });

  it('returns numeric hex of zero with no padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(0), '0');
  });

  it('returns numeric hex of zero with one padding zero', () => {
    assert.equal(Hex.fromIntegerWithPadding(0, 1), '0');
  });

  it('returns numeric hex of zero with two padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(0, 2), '00');
  });

  it('returns numeric hex of zero with three padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(0, 3), '000');
  });

  it('returns numeric hex of 15 with no padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(15), 'F');
  });

  it('returns numeric hex of 15 with one padding zero', () => {
    assert.equal(Hex.fromIntegerWithPadding(15, 1), 'F');
  });

  it('returns numeric hex of 15 with two padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(15, 2), '0F');
  });

  it('returns numeric hex of 15 with three padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(15, 3), '00F');
  });

  it('returns numeric hex of 16 with no padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(16), '10');
  });

  it('returns numeric hex of 16 with one padding zero', () => {
    assert.equal(Hex.fromIntegerWithPadding(16, 1), '10');
  });

  it('returns numeric hex of 16 with two padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(16, 2), '10');
  });

  it('returns numeric hex of 16 with three padding zeroes', () => {
    assert.equal(Hex.fromIntegerWithPadding(16, 3), '010');
  });
});

describe('getting code points → padded hexes', () => {
  it('throws when input is undefined', () => {
    assert.throws(() => Hex.fromCodePoint(), TypeError);
  });

  it('throws when input is invalid object', () => {
    assert.throws(() => Hex.fromCodePoint({}), TypeError);
  });

  it('throws when input is invalid string', () => {
    assert.throws(() => Hex.fromCodePoint(''), TypeError);
  });

  it('throws when input is negative integer', () => {
    assert.throws(() => Hex.fromCodePoint(-1), TypeError);
  });

  it('throws when input is non-integer number', () => {
    assert.throws(() => Hex.fromCodePoint(0.5), TypeError);
  });

  it('returns numeric hex of zero with three padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(0), '0000');
  });

  it('returns numeric hex of one with three padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(1), '0001');
  });

  it('returns numeric hex of 15 with three padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(15), '000F');
  });

  it('returns numeric hex of 16 with two padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(16), '0010');
  });

  it('returns four-digit numeric hex with no padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(0xFFFF), 'FFFF');
  });

  it('returns five-digit numeric hex with no padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(0x1_0000), '10000');
  });

  it('returns six-digit numeric hex with no padding zeroes', () => {
    assert.equal(Hex.fromCodePoint(0x10_0000), '100000');
  });
});
