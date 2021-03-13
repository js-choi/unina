// # Unit tests for main API
// This tests edge cases of the (fully [built][]) [main `unina` module][].
// There is a separate [complete test suite][] that tests every valid name and
// value on the main `unina` module. This suite expects that the main module
// has [already been built with `npm build`][built].
//
// [built]: ../../script/build.mjs
// [main `unina` module]: ../../src/js/main.mjs
// [complete test suite]: ../node/complete.mjs
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import extractNameRanges from '#node/extractor';

import compileDatabase from '#js/db-compiler';
import * as Name from '#js/name';

import * as Unina from 'unina';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Extract name ranges from the [Unicode Character Database source files][UCD].
//
// [UCD]: ../../src/node/ucd/
const sortedNameRangeArray = await extractNameRanges();

describe('getting badly typed names → values', () => {
  it('throws with undefined input', () => {
    assert.throws(
      () => Unina.get(undefined),
      TypeError);
  });

  it('throws with null input', () => {
    assert.throws(
      () => Unina.get(null),
      TypeError);
  });

  it('throws with number input', () => {
    assert.throws(
      () => Unina.get(1),
      TypeError,
    );
  });

  it('throws even when valid name is also given', () => {
    const goodName = 'NULL';
    const badName = null;
    assert.throws(
      () => Unina.get(goodName, badName),
      TypeError,
    );
  });
});

describe('getting badly typed values → preferred names', () => {
  it('throws with undefined input', () => {
    assert.throws(
      () => Unina.getPreferredName(),
      TypeError,
    );
  });

  it('throws with null input', () => {
    assert.throws(
      () => Unina.getPreferredName(null),
      TypeError,
    );
  });

  it('throws with undefined input', () => {
    assert.throws(
      () => Unina.getPreferredName(1),
      TypeError,
    );
  });
});

describe('getting badly typed values → name entries', () => {
  it('throws with undefined input', () => {
    assert.throws(
      () => Unina.getNameEntries(),
      TypeError,
    );
  });

  it('throws with null input', () => {
    assert.throws(
      () => Unina.getNameEntries(null),
      TypeError,
    );
  });

  it('throws with number input', () => {
    assert.throws(
      () => Unina.getNameEntries(1),
      TypeError,
    );
  });
});

describe('getting values → preferred names', () => {
  it('prefers correction alias when present', () => {
    const value = '\uFE18';
    const strictName =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRAKCET';
    const correction =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRACKET';
    assert.equal(
      Unina.getPreferredName(value),
      correction,
    );
  });

  it('orders name entries for correction aliases at start', () => {
    const value = '\uFE18';
    const strictName =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRAKCET';
    const correction =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRACKET';
    assert.deepEqual(
      Unina.getNameEntries(value),
      [
        [ correction, Name.correctionType ],
        [ strictName, null ],
      ],
    );
  });
});

describe('getting multiple names → joined values', () => {
  it('returns single consolidated string value', () => {
    const name = 'NULL';
    const value = '\0';
    const nameRangeArray = [
      {
        initialHeadPoint: value.codePointAt(0),
        nameStem: name,
        nameType: Name.controlType,
      },
    ];
    const inputNameArray = [ name, name, name ];
    const expectedValue = value + value + value;
    assert.equal(
      Unina.get(...inputNameArray),
      expectedValue,
    );
  });
});
