// # Unit tests for generating name ranges from UCD files
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import generateNoncharacterNameRanges from '#js/name-range/noncharacter';
import * as NameCounter from '#js/name-counter';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('noncharacter name ranges', () => {
  it('generates all ranges', () => {
    const expectedNameRangeArray = [
      // This name range inclusively covers `U+FDD0`–`FDEF`.
      {
        initialHeadPoint: 0xFDD0,
        length: 32,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+FFFE` and `U+FFFF`.
      {
        initialHeadPoint: 0xFFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+1FFFE` and `U+1FFFF`.
      {
        initialHeadPoint: 0x1_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+2FFFE` and `U+2FFFF`.
      {
        initialHeadPoint: 0x2_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+3FFFE` and `U+3FFFF`.
      {
        initialHeadPoint: 0x3_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+4FFFE` and `U+4FFFF`.
      {
        initialHeadPoint: 0x4_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+5FFFE` and `U+5FFFF`.
      {
        initialHeadPoint: 0x5_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+6FFFE` and `U+6FFFF`.
      {
        initialHeadPoint: 0x6_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+7FFFE` and `U+7FFFF`.
      {
        initialHeadPoint: 0x7_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+8FFFE` and `U+8FFFF`.
      {
        initialHeadPoint: 0x8_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+9FFFE` and `U+9FFFF`.
      {
        initialHeadPoint: 0x9_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+AFFFE` and `U+AFFFF`.
      {
        initialHeadPoint: 0xA_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+BFFFE` and `U+BFFFF`.
      {
        initialHeadPoint: 0xB_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+CFFFE` and `U+CFFFF`.
      {
        initialHeadPoint: 0xC_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+DFFFE` and `U+DFFFF`.
      {
        initialHeadPoint: 0xD_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+EFFFE` and `U+EFFFF`.
      {
        initialHeadPoint: 0xE_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+FFFFE` and `U+FFFFF`.
      {
        initialHeadPoint: 0xF_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // This name range covers `U+10FFFE` and `U+10FFFF`.
      {
        initialHeadPoint: 0x10_FFFE,
        length: 2,
        nameStem: 'NONCHARACTER',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
    ];

    assert.deepEqual(
      Array.from(generateNoncharacterNameRanges()),
      expectedNameRangeArray,
    );
  });
});
