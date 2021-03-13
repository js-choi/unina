// # Unit tests for generating name ranges from UCD files
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as UCDNameRange from '#js/name-range/ucd';
import * as NameCounter from '#js/name-counter';
import * as HangulSyllable from '#js/hangul-syllable';
import * as Name from '#js/name';
import { asyncToArray } from '#js/util/iterable';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('processing UnicodeData.txt meta-labels', () => {
  it('creates starting version of ending meta-label', () => {
    assert.equal(
      UCDNameRange.getStartingMetaLabel('<CJK Ideograph Extension A, Last>'),
      '<CJK Ideograph Extension A, First>',
    );
  });
})

// This function runs several tests that are common to functions that parse
// name-range lines from the Unicode Character Database source files.
async function testCommonCases (asyncGenNameRangesFromLines) {
  it('rejects undefined inputs', async () => {
    const inputLines = undefined;

    await assert.rejects(
      asyncToArray(asyncGenNameRangesFromLines(inputLines)),
      TypeError,
    );
  });

  it('rejects non-iterable object inputs', async () => {
    const inputLines = {};

    await assert.rejects(
      asyncToArray(asyncGenNameRangesFromLines(inputLines)),
      TypeError,
    );
  });

  it('ignores blank lines', async () => {
    const inputLines = [
      ' ',
    ];

    const expectedNameRangeArray = [];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('ignores comment lines', async () => {
    const inputLines = [
      '# Comment',
    ];

    const expectedNameRangeArray = [];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });
}

describe('UnicodeData.txt lines', () => {
  testCommonCases(UCDNameRange.asyncFromUnicodeData);

  it('parses ordinary lines without comments', async () => {
    const inputLines = [
      '0020;SPACE;Zs;0;WS;;;;;N;;;;;',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x20,
        nameStem: 'SPACE',
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary lines with comments', async () => {
    const inputLines = [
      '0020;SPACE # Comment',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x20,
        nameStem: 'SPACE',
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('rejects lines with invalid special labels', async () => {
    const inputLines = [
      '0000;<invalid>;;;;;;;;;;;;;',
    ];

    await assert.rejects(
      asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      TypeError,
    );
  });

  it('parses control-labeled lines', async () => {
    const inputLines = [
      '0000;<control>;Cc;0;BN;;;;;N;NULL;;;;',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x0,
        nameStem: 'CONTROL',
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('rejects multiplex-range start lines without ends', async () => {
    const inputLines = [
      'AC00;<Hangul Syllable, First>;Lo;0;L;;;;;N;;;;;',
      // <Hangul Syllable, Last> line is missing.
    ];

    await assert.rejects(
      asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      TypeError,
    );
  });

  it('rejects multiplex-range ends without start lines', async () => {
    const inputLines = [
      // <Hangul Syllable, First> line is missing.
      'D7A3;<Hangul Syllable, Last>;Lo;0;L;;;;;N;;;;;',
    ];

    await assert.rejects(
      asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      TypeError,
    );
  });

  it('rejects mismatching multiplex-range starts–ends', async () => {
    const inputLines = [
      '4E00;<CJK Ideograph, First>;Lo;0;L;;;;;N;;;;;',
      'D7A3;<Hangul Syllable, Last>;Lo;0;L;;;;;N;;;;;',
    ];

    await assert.rejects(
      asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      TypeError,
    );
  });

  it('parses multiplex-range start and end lines', async () => {
    const inputLines = [
      'AC00;<Hangul Syllable, First>;Lo;0;L;;;;;N;;;;;',
      'D7A3;<Hangul Syllable, Last>;Lo;0;L;;;;;N;;;;;',
    ];

    const expectedNameRangeArray = [
      {
        // HangulSyllable.basePoint is `0xAC00`.
        initialHeadPoint: HangulSyllable.basePoint,
        // HangulSyllable.numOfSyllables is `0x2BA4`.
        length: HangulSyllable.numOfSyllables,
        nameStem: 'HANGUL SYLLABLE',
        nameCounterType: NameCounter.hangulSyllableType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromUnicodeData(inputLines)),
      expectedNameRangeArray,
    );
  });
});

describe('NameAliases.txt lines', () => {
  testCommonCases(UCDNameRange.asyncFromNameAliases);

  it('parses ordinary line for correction alias', async () => {
    const inputLines = [
      '01A2;LATIN CAPITAL LETTER GHA;correction',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x1A2,
        nameStem: 'LATIN CAPITAL LETTER GHA',
        nameType: Name.correctionType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNameAliases(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary line for control alias', async () => {
    const inputLines = [
      '0000;NULL;control',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0,
        nameStem: 'NULL',
        nameType: Name.controlType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNameAliases(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary line for alternate alias', async () => {
    const inputLines = [
      'FEFF;BYTE ORDER MARK;alternate',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0xFEFF,
        nameStem: 'BYTE ORDER MARK',
        nameType: Name.alternateType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNameAliases(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary line for alternate alias', async () => {
    const inputLines = [
      '0080;PADDING CHARACTER;figment',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x80,
        nameStem: 'PADDING CHARACTER',
        nameType: Name.figmentType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNameAliases(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary line for abbreviation alias', async () => {
    const inputLines = [
      '0000;NUL;abbreviation',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0,
        nameStem: 'NUL',
        nameType: Name.abbreviationType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNameAliases(inputLines)),
      expectedNameRangeArray,
    );
  });
});

describe('NamedSequences.txt lines', () => {
  testCommonCases(UCDNameRange.asyncFromNamedSequences);

  it('parses ordinary line without space-padded fields', async () => {
    const inputLines = [
      'KEYCAP NUMBER SIGN;0023 FE0F 20E3',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0x23,
        tailScalarArray: [ 0xFE0F, 0x20E3 ],
        nameStem: 'KEYCAP NUMBER SIGN',
        nameType: Name.sequenceType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNamedSequences(inputLines)),
      expectedNameRangeArray,
    );
  });

  it('parses ordinary lines with space-padded fields', async () => {
    const inputLines = [
      'TAMIL CONSONANT K;  0B95 0BCD',
    ];

    const expectedNameRangeArray = [
      {
        initialHeadPoint: 0xB95,
        tailScalarArray: [ 0xBCD ],
        nameStem: 'TAMIL CONSONANT K',
        nameType: Name.sequenceType,
      },
    ];

    assert.deepEqual(
      await asyncToArray(UCDNameRange.asyncFromNamedSequences(inputLines)),
      expectedNameRangeArray,
    );
  });
});
