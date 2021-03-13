// # Unit tests for generating name ranges from UCD files
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as NameRangeData from '#js/name-range/name-data';
import * as NameCounter from '#js/name-counter';
import * as Name from '#js/name';
import * as Hex from '#js/util/hex';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('generating name ranges → name data', () => {
  it('yields singleton strict-name ranges → 1 data object', () => {
    const initialHeadPoint = 0x20;
    const nameStem = 'TEST';
    const inputNameRange = {
      initialHeadPoint,
      nameStem,
    };
    const expectedNameDataArray = [
      {
        value: String.fromCodePoint(initialHeadPoint),
        name: nameStem,
        nameType: null,
      },
    ];

    assert.deepEqual(
      Array.from(NameRangeData.genDataObjects(inputNameRange)),
      expectedNameDataArray,
    );
  });

  it('yields singleton name-alias ranges → 1 data object', () => {
    const initialHeadPoint = 0x20;
    const nameStem = 'TEST';
    const nameType = 'CORRECTION';
    const inputNameRange = {
      initialHeadPoint,
      nameStem,
    };
    const expectedNameDataArray = [
      {
        value: String.fromCodePoint(initialHeadPoint),
        name: nameStem,
        nameType: null,
      },
    ];

    assert.deepEqual(
      Array.from(NameRangeData.genDataObjects(inputNameRange)),
      expectedNameDataArray,
    );
  });

  it('yields singleton named-sequence ranges → 1 data object', () => {
    const initialHeadPoint = 0x20;
    const tailScalarArray = [ 0x20, 0x20 ];
    const nameStem = 'TEST';
    const nameType = Name.sequenceType;
    const inputNameRange = {
      initialHeadPoint,
      nameStem,
      tailScalarArray,
      nameType,
    };
    const expectedNameDataArray = [
      {
        // This is `U+0020 U+0020 U+0020`.
        value: String.fromCodePoint(initialHeadPoint, ...tailScalarArray),
        name: nameStem,
        nameType,
      },
    ];

    assert.deepEqual(
      Array.from(NameRangeData.genDataObjects(inputNameRange)),
      expectedNameDataArray,
    );
  });

  it('yields multiplex ranges → many data objects', () => {
    const initialHeadPoint = 0x20;
    const nameStem = 'TEST';
    const inputNameRange = {
      initialHeadPoint,
      length: 3,
      nameCounterType: NameCounter.hyphenHexType,
      nameStem,
    };
    const expectedNameDataArray = [
      {
        value: String.fromCodePoint(initialHeadPoint),
        // This is “TEST-0020”.
        name: `${nameStem}-${Hex.fromCodePoint(initialHeadPoint)}`,
        nameType: null,
      },
      {
        value: String.fromCodePoint(initialHeadPoint + 1),
        // This is “TEST-0021”.
        name: `${nameStem}-${Hex.fromCodePoint(initialHeadPoint + 1)}`,
        nameType: null,
      },
      {
        value: String.fromCodePoint(initialHeadPoint + 2),
        // This is “TEST-0022”.
        name: `${nameStem}-${Hex.fromCodePoint(initialHeadPoint + 2)}`,
        nameType: null,
      },
    ];

    assert.deepEqual(
      Array.from(NameRangeData.genDataObjects(inputNameRange)),
      expectedNameDataArray,
    );
  });
});

describe('converting name data → maps from values to name entries', () => {
  it('groups name data for same value → array of 2 entries', () => {
    const value = 'A';
    const name0 = 'TEST 0';
    const name1 = 'TEST 1';
    // The null name type precedes the label name type, as defined by
    // `Name.compareTypes`. This means that `name0` will precede `name1` in the
    // resulting array of name entries.
    const nameType0 = null;
    const nameType1 = Name.labelType;
    const inputNameDataArray = [
      {
        value,
        name: name0,
        nameType: nameType0,
      },
      {
        value,
        name: name1,
        nameType: nameType1,
      },
    ];
    const expectedValueToNameEntriesMap = new Map([
      [ value, [ [ name0, nameType0 ], [ name1, nameType1 ] ] ],
    ]);

    assert.deepEqual(
      NameRangeData.groupToMapByValues(inputNameDataArray),
      expectedValueToNameEntriesMap,
    );
  });

  it('sorts name entries', () => {
    const value = 'A';
    const name0 = 'TEST 0';
    const name1 = 'TEST 1';
    // The null name type precedes the label name type, as defined by
    // `Name.compareTypes`. This means that `name1` will precede `name0` in the
    // resulting array of name entries.
    const nameType0 = Name.labelType;
    const nameType1 = null;
    const inputNameDataArray = [
      {
        value,
        name: name0,
        nameType: nameType0,
      },
      {
        value,
        name: name1,
        nameType: nameType1,
      },
    ];
    const expectedValueToNameEntriesMap = new Map([
      [ value, [ [ name1, nameType1 ], [ name0, nameType0 ] ] ],
    ]);

    assert.deepEqual(
      NameRangeData.groupToMapByValues(inputNameDataArray),
      expectedValueToNameEntriesMap,
    );
  });
});
