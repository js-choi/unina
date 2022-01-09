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

import parseNameObjects from '../../../main/name-object/';
import { deriveName, parseName } from '../../../main/name-counter/';

const fdd0NoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0xFDD0,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD1,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD2,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD3,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD4,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD5,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD6,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD7,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD8,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDD9,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDA,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDB,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDC,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDD,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDDF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },

  { headScalarRangeInitial: 0xFDE0,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE1,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE2,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE3,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE4,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE5,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE6,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE7,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE8,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDE9,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDEA,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDEB,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDEC,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDED,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDEE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFDEF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane00EndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0xFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane01EndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0x1FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x1FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane02EndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0x2FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x2FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane03EndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0x3FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x3FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const middlePlaneEndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0x4FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x4FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x5FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x5FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x6FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x6FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x7FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x7FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x8FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x8FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x9FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x9FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xAFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xAFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xBFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xBFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xCFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xCFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xDFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xDFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xEFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xEFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane0FEndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0xFFFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0xFFFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const plane10EndNoncharacterLabelObjectArray = [
  { headScalarRangeInitial: 0x10FFFE,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
  { headScalarRangeInitial: 0x10FFFF,
    nameStem: 'NONCHARACTER-', nameCounterType: 'HEX', nameType: 'LABEL' },
];

const noncharacterLabelObjectArray = [
  ...fdd0NoncharacterLabelObjectArray,
  ...plane00EndNoncharacterLabelObjectArray,
  ...plane01EndNoncharacterLabelObjectArray,
  ...plane02EndNoncharacterLabelObjectArray,
  ...plane03EndNoncharacterLabelObjectArray,
  ...middlePlaneEndNoncharacterLabelObjectArray,
  ...plane0FEndNoncharacterLabelObjectArray,
  ...plane10EndNoncharacterLabelObjectArray,
];

test('non-iterable lines', async () => {
  await expect(parseNameObjects())
    .rejects.toThrow(TypeError);

  await expect(parseNameObjects({}))
    .rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    unicodeDataLines: [],
    nameAliasesLines: [],
    deriveName, parseName,
  })).rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    unicodeDataLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).rejects.toThrow(TypeError);
});

test('invalid name-counter functions', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName,
  })).rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    unicodeDataLines: [],
    nameAliasesLines: [],
    namedSequencesLines: [],
    parseName,
  })).rejects.toThrow(TypeError);
});

test('noncharacters are present even with no input lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual(noncharacterLabelObjectArray);
});

test('blank line is ignored', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      ' ',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual(noncharacterLabelObjectArray);
});

test('comment line is ignored', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '# Comment',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual(noncharacterLabelObjectArray);
});

test('ordinary line without comment', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '0020;SPACE;Zs;0;WS;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x20,
      nameStem: 'SPACE' },

    ...noncharacterLabelObjectArray,
  ]);
});

test('ordinary line with comment', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '0020;SPACE # Comment',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x20,
      nameStem: 'SPACE' },

    ...noncharacterLabelObjectArray,
  ]);
});

test.skip('ideographic name range lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '3400;<CJK Ideograph Extension A, First>;Lo;0;L;;;;;N;;;;;',
      '4DBF;<CJK Ideograph Extension A, Last>;Lo;0;L;;;;;N;;;;;',
      '4E00;<CJK Ideograph, First>;Lo;0;L;;;;;N;;;;;',
      '9FFF;<CJK Ideograph, Last>;Lo;0;L;;;;;N;;;;;',
      '17000;<Tangut Ideograph, First>;Lo;0;L;;;;;N;;;;;',
      '187F7;<Tangut Ideograph, Last>;Lo;0;L;;;;;N;;;;;',
      '18D00;<Tangut Ideograph Supplement, First>;Lo;0;L;;;;;N;;;;;',
      '18D08;<Tangut Ideograph Supplement, Last>;Lo;0;L;;;;;N;;;;;',
      '20000;<CJK Ideograph Extension B, First>;Lo;0;L;;;;;N;;;;;',
      '2A6DF;<CJK Ideograph Extension B, Last>;Lo;0;L;;;;;N;;;;;',
      // This is a made-up range for testing purposes.
      '40000;<CJK Ideograph Extension ZZ, First>;Lo;0;L;;;;;N;;;;;',
      '41000;<CJK Ideograph Extension ZZ, Last>;Lo;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x3400, headScalarRangeLength: 6592,
      nameStem: 'CJK UNIFIED IDEOGRAPH-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x4E00, headScalarRangeLength: 20992,
      nameStem: 'CJK UNIFIED IDEOGRAPH-', nameCounterType: 'HEX' },

    ...fdd0NoncharacterLabelObjectArray,,
    ...plane00EndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x17000, headScalarRangeLength: 6136,
      nameStem: 'TANGUT IDEOGRAPH-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18D00, headScalarRangeLength: 9,
      nameStem: 'TANGUT IDEOGRAPH-', nameCounterType: 'HEX' },

    ...plane01EndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x20000, headScalarRangeLength: 42720,
      nameStem: 'CJK UNIFIED IDEOGRAPH-', nameCounterType: 'HEX' },

    ...plane02EndNoncharacterLabelObjectArray,
    ...plane03EndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x40000, headScalarRangeLength: 4097,
      nameStem: 'CJK UNIFIED IDEOGRAPH-', nameCounterType: 'HEX' },

    ...middlePlaneEndNoncharacterLabelObjectArray,
    ...plane0FEndNoncharacterLabelObjectArray,
    ...plane10EndNoncharacterLabelObjectArray,
  ]);
});

test('CJK compatibility ideograph hex name lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      'F900;CJK COMPATIBILITY IDEOGRAPH-F900;Lo;0;L;8C48;;;;N;;;;;',
      'F901;CJK COMPATIBILITY IDEOGRAPH-F901;Lo;0;L;66F4;;;;N;;;;;',
      'F902;CJK COMPATIBILITY IDEOGRAPH-F902;Lo;0;L;8ECA;;;;N;;;;;',
      'FB00;LATIN SMALL LIGATURE FF;Ll;0;L;<compat> 0066 0066;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0xF900,
      nameStem: 'CJK COMPATIBILITY IDEOGRAPH-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0xF901,
      nameStem: 'CJK COMPATIBILITY IDEOGRAPH-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0xF902,
      nameStem: 'CJK COMPATIBILITY IDEOGRAPH-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0xFB00,
      nameStem: 'LATIN SMALL LIGATURE FF' },

    ...noncharacterLabelObjectArray,
  ]);
});

test('Khitan small script hex name lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '18B00;KHITAN SMALL SCRIPT CHARACTER-18B00;Lo;0;L;;;;;N;;;;;',
      '18B01;KHITAN SMALL SCRIPT CHARACTER-18B01;Lo;0;L;;;;;N;;;;;',
      '18B02;KHITAN SMALL SCRIPT CHARACTER-18B02;Lo;0;L;;;;;N;;;;;',
      '1AFF0;KATAKANA LETTER MINNAN TONE-2;Lm;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    ...fdd0NoncharacterLabelObjectArray,
    ...plane00EndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x18B00,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18B01,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18B02,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x1AFF0,
      nameStem: 'KATAKANA LETTER MINNAN TONE-2' },

    ...plane01EndNoncharacterLabelObjectArray,
    ...plane02EndNoncharacterLabelObjectArray,
    ...plane03EndNoncharacterLabelObjectArray,
    ...middlePlaneEndNoncharacterLabelObjectArray,
    ...plane0FEndNoncharacterLabelObjectArray,
    ...plane10EndNoncharacterLabelObjectArray,
  ]);
});

test('Nushu character hex name lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '1B170;NUSHU CHARACTER-1B170;Lo;0;L;;;;;N;;;;;',
      '1B171;NUSHU CHARACTER-1B171;Lo;0;L;;;;;N;;;;;',
      '1B172;NUSHU CHARACTER-1B172;Lo;0;L;;;;;N;;;;;',
      '1BC00;DUPLOYAN LETTER H;Lo;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    ...fdd0NoncharacterLabelObjectArray,
    ...plane00EndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x1B170,
      nameStem: 'NUSHU CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x1B171,
      nameStem: 'NUSHU CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x1B172,
      nameStem: 'NUSHU CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x1BC00,
      nameStem: 'DUPLOYAN LETTER H' },

    ...plane01EndNoncharacterLabelObjectArray,
    ...plane02EndNoncharacterLabelObjectArray,
    ...plane03EndNoncharacterLabelObjectArray,
    ...middlePlaneEndNoncharacterLabelObjectArray,
    ...plane0FEndNoncharacterLabelObjectArray,
    ...plane10EndNoncharacterLabelObjectArray,
  ]);
});

test('control label lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '0000;<control>;Cc;0;BN;;;;;N;NULL;;;;',
      '0001;<control>;Cc;0;BN;;;;;N;START OF HEADING;;;;',
      '0002;<control>;Cc;0;BN;;;;;N;START OF TEXT;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x0000,
      nameStem: 'CONTROL-', nameCounterType: 'HEX', nameType: 'LABEL' },
    { headScalarRangeInitial: 0x0001,
      nameStem: 'CONTROL-', nameCounterType: 'HEX', nameType: 'LABEL' },
    { headScalarRangeInitial: 0x0002,
      nameStem: 'CONTROL-', nameCounterType: 'HEX', nameType: 'LABEL' },

    ...noncharacterLabelObjectArray,
  ]);
});

test('private-use label range lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      'E000;<Private Use, First>;Co;0;L;;;;;N;;;;;',
      'F8FF;<Private Use, Last>;Co;0;L;;;;;N;;;;;',
      'F0000;<Plane 15 Private Use, First>;Co;0;L;;;;;N;;;;;',
      'FFFFD;<Plane 15 Private Use, Last>;Co;0;L;;;;;N;;;;;',
      '100000;<Plane 16 Private Use, First>;Co;0;L;;;;;N;;;;;',
      '10FFFD;<Plane 16 Private Use, Last>;Co;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0xE000, headScalarRangeLength: 6400,
      nameStem: 'PRIVATE-USE-', nameCounterType: 'HEX', nameType: 'LABEL' },

    ...fdd0NoncharacterLabelObjectArray,
    ...plane00EndNoncharacterLabelObjectArray,
    ...plane01EndNoncharacterLabelObjectArray,
    ...plane02EndNoncharacterLabelObjectArray,
    ...plane03EndNoncharacterLabelObjectArray,
    ...middlePlaneEndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0xF0000, headScalarRangeLength: 65534,
      nameStem: 'PRIVATE-USE-', nameCounterType: 'HEX', nameType: 'LABEL' },

    ...plane0FEndNoncharacterLabelObjectArray,

    { headScalarRangeInitial: 0x100000, headScalarRangeLength: 65534,
      nameStem: 'PRIVATE-USE-', nameCounterType: 'HEX', nameType: 'LABEL' },

    ...plane10EndNoncharacterLabelObjectArray,
  ]);
});

test.skip('surrogate label range lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      'D800;<Non Private Use High Surrogate, First>;Cs;0;L;;;;;N;;;;;',
      'DB7F;<Non Private Use High Surrogate, Last>;Cs;0;L;;;;;N;;;;;',
      'DB80;<Private Use High Surrogate, First>;Cs;0;L;;;;;N;;;;;',
      'DBFF;<Private Use High Surrogate, Last>;Cs;0;L;;;;;N;;;;;',
      'DC00;<Low Surrogate, First>;Cs;0;L;;;;;N;;;;;',
      'DFFF;<Low Surrogate, Last>;Cs;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0xD800, headScalarRangeLength: 896,
      nameStem: 'SURROGATE-', nameCounterType: 'HEX', nameType: 'LABEL' },
    { headScalarRangeInitial: 0xDB00, headScalarRangeLength: 896,
      nameStem: 'SURROGATE-', nameCounterType: 'HEX', nameType: 'LABEL' },
    { headScalarRangeInitial: 0xDC00, headScalarRangeLength: 1024,
      nameStem: 'SURROGATE-', nameCounterType: 'HEX', nameType: 'LABEL' },

    ...noncharacterLabelObjectArray,
  ]);
});

test.skip('explicit hex-name lines then name range lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      '18B00;KHITAN SMALL SCRIPT CHARACTER-18B00;Lo;0;L;;;;;N;;;;;',
      '18B01;KHITAN SMALL SCRIPT CHARACTER-18B01;Lo;0;L;;;;;N;;;;;',
      '18B02;KHITAN SMALL SCRIPT CHARACTER-18B02;Lo;0;L;;;;;N;;;;;',
      '18D00;<Tangut Ideograph Supplement, First>;Lo;0;L;;;;;N;;;;;',
      '18D08;<Tangut Ideograph Supplement, Last>;Lo;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x18B00,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18B01,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18B02,
      nameStem: 'KHITAN SMALL SCRIPT CHARACTER-', nameCounterType: 'HEX' },
    { headScalarRangeInitial: 0x18D00, headScalarRangeLength: 9,
      nameStem: 'TANGUT IDEOGRAPH-', nameCounterType: 'HEX' },

    ...noncharacterLabelObjectArray,
  ]);
});

test.skip('Hangul syllable name range lines', async () => {
  await expect(parseNameObjects({
    unicodeDataLines: [
      'AC00;<Hangul Syllable, First>;Lo;0;L;;;;;N;;;;;',
      'D7A3;<Hangul Syllable, Last>;Lo;0;L;;;;;N;;;;;',
    ],
    nameAliasesLines: [],
    namedSequencesLines: [],
    deriveName, parseName,
  })).resolves.toEqual([
    { headScalarRangeInitial: 0x20, headScalarRangeLength: 11171,
      nameStem: 'HANGUL SYLLABLE ', nameCounterType: 'HANGULSYLLABLE' },

    ...noncharacterLabelObjectArray,
  ]);
});

test.todo('unhandled range label in UnicodeData.txt');
