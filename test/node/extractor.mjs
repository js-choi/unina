// # Unit tests for extraction of Unicode Character Database name ranges
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import compileDatabase from '#js/db-compiler';
import * as NameCounter from '#js/name-counter';

import extractNameRanges from '#node/extractor';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const nameRangeArray = await extractNameRanges();

describe('extracting name ranges from UCD files', () => {
  it('has zeroth name entry for `U+0000` “NULL”', async () => {
    const initialHeadPoint = 0;
    const nameStem = 'NULL';
    const nameType = 'control';
    const expectedNameRange = {
      initialHeadPoint,
      nameStem,
      nameType,
    };

    assert.deepEqual(
      nameRangeArray[0],
      expectedNameRange,
    );
  });

  it('has entry for Plane-10 noncharacter labels', async () => {
    const initialHeadPoint = 0x10_FFFE;
    const length = 2;
    const nameStem = 'NONCHARACTER';
    const nameCounterType = NameCounter.hyphenHexType;
    const nameType = 'label';
    const expectedNameRange = {
      initialHeadPoint,
      length,
      nameStem,
      nameCounterType,
      nameType,
    };

    assert.deepEqual(
      nameRangeArray.at(-1),
      expectedNameRange,
    );
  });

  it('sorts name ranges by initial head point', async () => {
    const sortedNameRangeArray = Array.from(nameRangeArray);
    sortedNameRangeArray.sort();

    assert.deepEqual(
      nameRangeArray,
      sortedNameRangeArray,
    );
  });
});
