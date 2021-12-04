// # Unit tests for `main/`
// This Jest suite tests the library’s main module.
//
// If a `TEST_ALL_UCD_NAMES` environmental variable is set to anything other
// than the empty string, then every character name defined in the UCD’s files
// will be tested. This takes a long time. For example, on a MacBook Air (M1,
// 2020) with `TEST_ALL_UCD_NAMES=true`, finishing every test requires between
// several seconds and 5 minutes, but with `TEST_ALL_UCD_NAMES=true`, requires
// between 6 and 200 minutes. For this reason, `TEST_ALL_UCD_NAMES` is
// turned off by default.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import extractNameObjects from '../extract/';

import UninameLibrary from '../../main/';
import compileDatabase from '../../main/compile/';

let nameObjectArrayByScalar, database, uniname;

beforeAll(async () => {
  // Extract name objects from the Unicode Character Database source files in
  // `../../ucd/`.
  nameObjectArrayByScalar = await extractNameObjects();
  // Compile Unicode name data into a database.
  database = compileDatabase(nameObjectArrayByScalar);
  // Create a Uniname library object from the database.
  uniname = new UninameLibrary(database);
});

test('type errors', () => {
  expect(() => uniname.get('SPACE', null)).toThrow(TypeError);
  expect(() => uniname.get('SPACE', 1)).toThrow(TypeError);

  expect(() => uniname.getPreferredName()).toThrow(TypeError);
  expect(() => uniname.getPreferredName(null)).toThrow(TypeError);
  expect(() => uniname.getPreferredName(1)).toThrow(TypeError);

  expect(() => uniname.getNameEntries()).toThrow(TypeError);
  expect(() => uniname.getNameEntries(null)).toThrow(TypeError);
  expect(() => uniname.getNameEntries(1)).toThrow(TypeError);
});

describe('special invalid names', () => {
  test('no character named with the empty string', () => {
    const name = '';
    expect(uniname.get(name)).toBeUndefined();
  });

  // For historical reasons, `UnicodeData.txt` uses the term `<control>` to
  // indicate certain control characters, but `<control>` is not an actual
  // Unicode name.
  test('no character named simply <control>', () => {
    const name = '<control>';
    expect(uniname.get(name)).toBeUndefined();
  });

  test('no names for unnamed character sequences', () => {
    const unnamedCharacterSequence = '\0\0';
    expect(uniname.getPreferredName(unnamedCharacterSequence))
      .toBeUndefined();
    expect(uniname.getNameEntries(unnamedCharacterSequence))
      .toStrictEqual([]);
  });
});

describe('specific scalars with single strict names', () => {
  test('in Basic Multilingual Plane', () => {
    const character = '\u090F';
    const name = 'DEVANAGARI LETTER E';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, null ] ]);
  });

  test('in Supplementary Multilingual Planes', () => {
    const character = '\u{1D6AB}';
    const name = 'MATHEMATICAL BOLD CAPITAL DELTA';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, null ] ]);
  });

  test('alphabetically zeroth', () => {
    const character = '\u{1F9EE}';
    const name = 'ABACUS';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, null ] ]);
  });

  test('alphabetically first after zeroth', () => {
    const character = '\u{1FA97}';
    const name = 'ACCORDION';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, null ] ]);
  });

  test('alphabetically first before last', () => {
    const character = '\u200C';
    const name = 'ZWNJ';
    expect(uniname.get(name)).toBe(character);
  });

  test('alphabetically last', () => {
    const character = '\u200B';
    const name = 'ZWSP';
    expect(uniname.get(name)).toBe(character);
  });

  test('case insensitive', () => {
    const character = '\u090F';
    const name = 'Devanagari letter E';
    expect(uniname.get(name)).toBe(character);
  });

  test('with extra underscores', () => {
    const character = '\u090F';
    const name = 'DEVANAGARI_LET_TER_E';
    expect(uniname.get(name)).toBe(character);
  });

  test('with extra spaces', () => {
    const character = '\u090F';
    const name = 'DEVANAGARI LET TER E';
    expect(uniname.get(name)).toBe(character);
  });

  test('without spaces', () => {
    const character = '\u090F';
    const name = 'DEVANAGARILETTERE';
    expect(uniname.get(name)).toBe(character);
  });

  test('with extra medial hyphens', () => {
    const character = '\u090F';
    const name = 'DEVANAGARI-LET-TER-E';
    expect(uniname.get(name)).toBe(character);
  });

  test('with non-medial hyphen', () => {
    const character = '\u0F39';
    const name = 'TIBETAN MARK TSA -PHRU';
    expect(uniname.get(name)).toBe(character);
  });

  // If names are naïvely sorted lexicographically by ASCII without first
  // fuzzily folding them (i.e., without removing insignificant spaces and
  // medial hyphens), then attempting to use that order to binary search for
  // names will sometimes give erroneous results. This may happen specifically
  // for any two names `name0` and `name1` such that `name0` precedes `name1`
  // in ASCII but `fuzzilyFold(name0)` does not precede `fuzzilyFold(name1)`.
  // (`fuzzilyFold` is a function defined in the `main/fuzzy-fold/` module.)
  //
  // An example of such a pair is with `U+2196 NORTH WEST ARROW` and `U+1F6EA
  // NORTHEAST-POINTING AIRPLANE`. `NORTH WEST ARROW` precedes
  // `NORTHEAST-POINTING AIRPLANE` (because spaces precede all letters in
  // ASCII), but the fuzzily folded `NORTHWESTARROW` does not precede
  // `NORTHEASTPOINTINGAIRPLANE`. This means that binary searching for `NORTH
  // WEST ARROW` with binary search may fail if one of its parent nodes is the
  // entry for `NORTHEAST-POINTING AIRPLANE`. When the binary search reaches
  // `NORTHEAST-POINTING AIRPLANE`’s parent node, it would find that
  // `NORTHWESTARROW` does not precede `NORTHEASTPOINTINGAIRPLANE`, so it
  // would continue to search in names that follow `NORTHEAST-POINTING
  // AIRPLANE`. If `NORTH WEST ARROW` is not one of those following names,
  // then the binary search will never find it.
  describe('name–fuzzy-name order mismatch', () => {
    test('with name that precedes another name but fuzzily follows it', () => {
      const character = '\u2196';
      const name = 'NORTH WEST ARROW';
      expect(uniname.get(name)).toBe(character);
      expect(uniname.getPreferredName(character)).toBe(name);
      expect(uniname.getNameEntries(character))
        .toStrictEqual([ [ name, null ] ]);
    });

    test('with name that succeeds another name but fuzzily precedes it', () => {
      const character = '\u{1F6EA}';
      const name = 'NORTHEAST-POINTING AIRPLANE';
      expect(uniname.get(name)).toBe(character);
      expect(uniname.getPreferredName(character)).toBe(name);
      expect(uniname.getNameEntries(character))
        .toStrictEqual([ [ name, null ] ]);
    });
  });

  // The medial hyphen in `U+1180 HANGUL JUNGSEONG O-E` is special:
  // it must not be ignored, or else it will be confused with
  // `U+116C HANGUL JUNGSEONG OE`.
  describe('Hangul jungseong', () => {
    describe('special names', () => {
      test('special medial hyphen, without extra characters', () => {
        const character = '\u1180';
        const name = 'HANGUL JUNGSEONG O-E';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('no special medial hyphen, without extra characters', () => {
        const character = '\u116C';
        const name = 'HANGUL JUNGSEONG OE';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('special medial hyphen, with extra medial hyphens', () => {
        const character = '\u1180';
        const name = 'HANGUL-JUNG-SEONG-O-E';
        expect(uniname.get(name)).toBe(character);
      });

      test('no special medial hyphen, with extra medial hyphens', () => {
        const character = '\u116C';
        const name = 'HANGUL-JUNG-SEONG-OE';
        expect(uniname.get(name)).toBe(character);
      });

      test('case insensitive', () => {
        const character = '\u1180';
        const name = 'Hangul jungseong o-e';
        expect(uniname.get(name)).toBe(character);
      });

      test('invalid non-medial hyphen', () => {
        const name = 'HANGUL JUNGSEONG -O-E';
        expect(uniname.get(name)).toBeUndefined();
      });
    });

    describe('non-special names', () => {
      test('no extra hyphens', () => {
        const character = '\u1169';
        const name = 'HANGUL JUNGSEONG O';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('with extra medial hyphens', () => {
        const character = '\u1169';
        const name = 'HANGUL-JUNGSEONG-O';
        expect(uniname.get(name)).toBe(character);
      });
    });
  });

  describe('scalars with hex-based strict names', () => {
    // CJK Unified Ideographs.
    describe('from U+3400', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u33FF';
        const name = 'CJK UNIFIED IDEOGRAPH-33FF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u3400';
        const name = 'CJK UNIFIED IDEOGRAPH-3400';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u3401';
        const name = 'CJK UNIFIED IDEOGRAPH-3401';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u390F';
        const name = 'CJK UNIFIED IDEOGRAPH-390F';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u4DBE';
        const name = 'CJK UNIFIED IDEOGRAPH-4DBE';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u4DBF';
        const name = 'CJK UNIFIED IDEOGRAPH-4DBF';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u4DC0';
        const name = 'CJK UNIFIED IDEOGRAPH-4DC0';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+4E00', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u4DFF';
        const name = 'CJK UNIFIED IDEOGRAPH-4DFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u4E00';
        const name = 'CJK UNIFIED IDEOGRAPH-4E00';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u4E01';
        const name = 'CJK UNIFIED IDEOGRAPH-4E01';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u590F';
        const name = 'CJK UNIFIED IDEOGRAPH-590F';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u9FFB';
        const name = 'CJK UNIFIED IDEOGRAPH-9FFB';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u9FFC';
        const name = 'CJK UNIFIED IDEOGRAPH-9FFC';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u9FFD';
        const name = 'CJK UNIFIED IDEOGRAPH-9FFD';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+20000', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{1FFFF}';
        const name = 'CJK UNIFIED IDEOGRAPH-1FFFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{20000}';
        const name = 'CJK UNIFIED IDEOGRAPH-20000';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{20001}';
        const name = 'CJK UNIFIED IDEOGRAPH-20001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2A001}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2A6DC}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A6DC';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2A6DD}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A6DD';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2A6DE}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A6DE';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+2A700', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2A6FF}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A6FF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{2A700}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A700';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{2A701}';
        const name = 'CJK UNIFIED IDEOGRAPH-2A701';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2B001}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2B733}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B733';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2B734}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B734';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2B735}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B735';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+2B740', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2B73F}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B73F';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{2B740}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B740';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{2B741}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B741';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2B801}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B801';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2B81C}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B81C';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2B81D}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B81D';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2B81E}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B81E';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+2B820', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2B81F}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B81F';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{2B820}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B820';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{2B821}';
        const name = 'CJK UNIFIED IDEOGRAPH-2B821';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2CE91}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CE91';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2CEA0}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEA0';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2CEA1}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEA1';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2CEA2}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEA2';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+2CEB0', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2CEAF}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEAF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{2CEB0}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEB0';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{2CEB1}';
        const name = 'CJK UNIFIED IDEOGRAPH-2CEB1';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2D001}';
        const name = 'CJK UNIFIED IDEOGRAPH-2D001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2EBDF}';
        const name = 'CJK UNIFIED IDEOGRAPH-2EBDF';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2EBE0}';
        const name = 'CJK UNIFIED IDEOGRAPH-2EBE0';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2EBE1}';
        const name = 'CJK UNIFIED IDEOGRAPH-2EBE1';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+30000', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2FFFF}';
        const name = 'CJK UNIFIED IDEOGRAPH-2FFFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{30000}';
        const name = 'CJK UNIFIED IDEOGRAPH-30000';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{30001}';
        const name = 'CJK UNIFIED IDEOGRAPH-30001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{31001}';
        const name = 'CJK UNIFIED IDEOGRAPH-31001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{31349}';
        const name = 'CJK UNIFIED IDEOGRAPH-31349';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{3134A}';
        const name = 'CJK UNIFIED IDEOGRAPH-3134A';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{3134B}';
        const name = 'CJK UNIFIED IDEOGRAPH-3134B';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    // Tangut Ideographs.
    describe('from U+17000', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{16FFF}';
        const name = 'TANGUT IDEOGRAPH-16FFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{17000}';
        const name = 'TANGUT IDEOGRAPH-17000';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{17001}';
        const name = 'TANGUT IDEOGRAPH-17001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{18001}';
        const name = 'TANGUT IDEOGRAPH-18001';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{187EB}';
        const name = 'TANGUT IDEOGRAPH-187EB';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{187F7}';
        const name = 'TANGUT IDEOGRAPH-187F7';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{187F8}';
        const name = 'TANGUT IDEOGRAPH-187F8';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+18D00', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{18CFF}';
        const name = 'TANGUT IDEOGRAPH-18CFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{18D00}';
        const name = 'TANGUT IDEOGRAPH-18D00';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{18D01}';
        const name = 'TANGUT IDEOGRAPH-18D01';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{18D04}';
        const name = 'TANGUT IDEOGRAPH-18D04';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{18D07}';
        const name = 'TANGUT IDEOGRAPH-18D07';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{18D08}';
        const name = 'TANGUT IDEOGRAPH-18D08';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{18D09}';
        const name = 'TANGUT IDEOGRAPH-18D09';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    // Khitan Small Script Characters.
    describe('from U+18B00', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{18AFF}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18AFF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{18B00}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18B00';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{18B01}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18B01';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{18C01}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18C01';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{18CD4}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18CD4';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{18CD5}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18CD5';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{18CD6}';
        const name = 'KHITAN SMALL SCRIPT CHARACTER-18CD6';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    // Nushu Characters.
    describe('from U+1B170', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{1B16F}';
        const name = 'NUSHU CHARACTER-1B16F';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{1B170}';
        const name = 'NUSHU CHARACTER-1B170';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{1B171}';
        const name = 'NUSHU CHARACTER-1B171';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{1B201}';
        const name = 'NUSHU CHARACTER-1B201';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{1B2FA}';
        const name = 'NUSHU CHARACTER-1B2FA';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{1B2FB}';
        const name = 'NUSHU CHARACTER-1B2FB';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{1B2FC}';
        const name = 'NUSHU CHARACTER-1B2FC';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    // CJK Compatibility Ideographs.
    describe('from U+2F800', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\u{2F7FF}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2F7FF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\u{2F800}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2F800';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\u{2F801}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2F801';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\u{2F901}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2F901';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\u{2FA1C}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2FA1C';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\u{2FA1D}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2FA1D';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\u{2FA1E}';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-2FA1E';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+F900', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\uF8FF';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-F8FF';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\uF900';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-F900';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\uF901';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-F901';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\uF9FF';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-F9FF';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\uFA6C';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA6C';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\uFA6D';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA6D';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\uFA6E';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA6E';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    describe('from U+FA70', () => {
      test('one outside of inclusive minimum (invalid)', () => {
        const character = '\uFA6F';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA6F';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });

      test('exactly at inclusive minimum', () => {
        const character = '\uFA70';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA70';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive minimum', () => {
        const character = '\uFA71';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FA71';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('near middle between minimum and maximum', () => {
        const character = '\uFAA0';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FAA0';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one within inclusive maximum', () => {
        const character = '\uFAD8';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FAD8';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('exactly at inclusive maximum', () => {
        const character = '\uFAD9';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FAD9';
        expect(uniname.get(name)).toBe(character);
        expect(uniname.getPreferredName(character)).toBe(name);
        expect(uniname.getNameEntries(character))
          .toStrictEqual([ [ name, null ] ]);
      });

      test('one outside of inclusive maximum (invalid)', () => {
        const character = '\uFADA';
        const name = 'CJK COMPATIBILITY IDEOGRAPH-FADA';
        expect(uniname.get(name)).toBeUndefined();
        expect(uniname.getNameEntries(character))
          .not.toContain([ [ name, null ] ]);
      });
    });

    // Other hex-name tests.
    test('case insensitive', () => {
      const character = '\u{2000F}';
      const name = 'CJK unified ideograph-2000f';
      expect(uniname.get(name)).toBe(character);
    });

    test('without spaces or medial hyphens', () => {
      const character = '\u{2000F}';
      const name = 'CJKUNIFIEDIDEOGRAPH2000F';
      expect(uniname.get(name)).toBe(character);
    });

    test('with extra spaces in the hex code', () => {
      const character = '\u{2000F}';
      const name = 'CJK UNIFIED IDEOGRAPH-2 00 0F';
      expect(uniname.get(name)).toBe(character);
    });

    test('invalid hex code', () => {
      const name = 'CJK UNIFIED IDEOGRAPH-XYZ';
      expect(uniname.get(name)).toBeUndefined();
    });
  });

  describe('Hangul syllables', () => {
    test('with actual names', () => {
      const character = '\uD4DB';
      const name = 'HANGUL SYLLABLE PWILH';
      expect(uniname.get(name)).toBe(character);
      expect(uniname.getPreferredName(character)).toBe(name);
      expect(uniname.getNameEntries(character))
        .toStrictEqual([ [ name, null ] ]);
    });

    test('case insensitive', () => {
      const character = '\uD4DB';
      const name = 'Hangul Syllable Pwilh';
      expect(uniname.get(name)).toBe(character);
    });

    test('with nonexistent names that do not begin with actual names', () => {
      const name = 'HANGUL SYLLABLE G';
      expect(uniname.get(name)).toBeUndefined();
    });

    test('with actual names plus extraneous letters', () => {
      const name = 'HANGUL SYLLABLE PWILHX';
      expect(uniname.get(name)).toBeUndefined();
    });
  });
});

describe('characters with corrections', () => {
  test('default capitalization', () => {
    const character = '\uFE18';
    const incorrectlySpelledName =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRAKCET';
    const correctlySpelledName =
      'PRESENTATION FORM FOR VERTICAL RIGHT WHITE LENTICULAR BRACKET';
    expect(uniname.get(incorrectlySpelledName)).toBe(character);
    expect(uniname.get(correctlySpelledName)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(correctlySpelledName);
    expect(uniname.getNameEntries(character)).toStrictEqual([
      [ correctlySpelledName, 'correction' ], [ incorrectlySpelledName, null ],
    ]);
  });

  test('case insensitive', () => {
    const character = '\uFE18';
    const correctlySpelledName =
      'Presentation Form for Vertical Right White Lenticular Bracket';
    expect(uniname.get(correctlySpelledName)).toBe(character);
  });
});

describe('characters with abbreviations', () => {
  test('alphabetically before their strict names', () => {
    const character = '\u2069';
    const name = 'POP DIRECTIONAL ISOLATE';
    const abbreviation = 'PDI';
    // Abbreviation aliases may be used to get certain characters.
    expect(uniname.get(name)).toBe(character);
    expect(uniname.get(abbreviation)).toBe(character);
    // However, they are not returned by `getPreferredName`; strict Name
    // property values are preferably returned.
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character)).toStrictEqual([
      [ name, null ], [ abbreviation, 'abbreviation' ],
    ]);
  });

  test('alphabetically after their strict names', () => {
    const character = '\u{E01ED}';
    const name = 'VARIATION SELECTOR-254';
    const abbreviation = 'VS254';
    // Abbreviation aliases may be used to get certain characters.
    expect(uniname.get(name)).toBe(character);
    expect(uniname.get(abbreviation)).toBe(character);
    // However, they are not returned by `getPreferredName`; strict Name
    // property values are preferably returned.
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character)).toStrictEqual([
      [ name, null ], [ abbreviation, 'abbreviation' ],
    ]);
  });

  test('case insensitive', () => {
    const character = '\u2069';
    const name = 'Pop Directional Isolate';
    expect(uniname.get(name)).toBe(character);
  });
});

describe('control characters', () => {
  test('starting at 0000', () => {
    const character = '\u0001';
    const label = 'control-0001';
    const alias = 'START OF HEADING';
    const abbreviation = 'SOH';
    expect(uniname.get(label)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(alias);
    expect(uniname.getNameEntries(character)).toStrictEqual([
      [ alias, 'control' ],
      [ label, 'label' ],
      [ abbreviation, 'abbreviation' ],
    ]);
  });

  test('starting at 007F', () => {
    const character = '\u008F';
    const label = 'control-008F';
    const alias0 = 'SINGLE SHIFT THREE';
    const alias1 = 'SINGLE-SHIFT-3';
    const abbreviation = 'SS3';
    expect(uniname.get(label)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(alias0);
    expect(uniname.getNameEntries(character)).toStrictEqual([
      [ alias0, 'control' ], [ alias1, 'control' ],
      [ label, 'label' ], [ abbreviation, 'abbreviation' ],
    ]);
  });

  describe('by code-point label', () => {
    test('default capitalization', () => {
      const character = '\u0001';
      const label = 'control-0001';
      expect(uniname.get(label)).toBe(character);
    });

    test('case insensitive', () => {
      const character = '\u0001';
      const label = 'Control-0001';
      expect(uniname.get(label)).toBe(character);
    });

    test('without spaces or medial hyphens', () => {
      const character = '\u0001';
      const label = 'control0001';
      expect(uniname.get(label)).toBe(character);
    });

    test('with extra spaces', () => {
      const character = '\u0001';
      const label = 'control-00 01';
      expect(uniname.get(label)).toBe(character);
    });

    test('invalid label', () => {
      const label = 'noncharacter-E000';
      expect(uniname.get(label)).toBeUndefined();
    });
  });

  test('with no control alias', () => {
    // Unlike most other control characters, `U+0080` has no strict name and
    // no control-type alias.
    const character = '\u0080';
    const label = 'control-0080';
    expect(uniname.get(label)).toBe(character);
    // `U+0080` does have two non-control aliases: `PADDING CHARACTER` and
    // `PAD`. Neither alias is returned because they respectively are a
    // figment and an abbreviation, neither of which is a preferred name type.
    expect(uniname.getPreferredName(character)).toBe(label);
  });

  describe('by control-type name alias', () => {
    test('default capitalization', () => {
      const character = '\u0001';
      const alias = 'START OF HEADING';
      expect(uniname.get(alias)).toBe(character);
    });

    test('case insensitive', () => {
      const character = '\u0001';
      const alias = 'start of heading';
      expect(uniname.get(alias)).toBe(character);
    });
  });

  describe('by control-type name alias', () => {
    test('default capitalization', () => {
      const character = '\u0001';
      const alias = 'SOH';
      expect(uniname.get(alias)).toBe(character);
    });

    test('case insensitive', () => {
      const character = '\u0001';
      const alias = 'soh';
      expect(uniname.get(alias)).toBe(character);
    });

    test('with extra spaces', () => {
      const character = '\u0001';
      const alias = 'S O H';
      expect(uniname.get(alias)).toBe(character);
    });
  });

  // Figment aliases were never actually encoded in any standard.
  describe('by figment aliases', () => {
    test('default capitalization', () => {
      const character = '\u0099';
      const figment = 'SINGLE GRAPHIC CHARACTER INTRODUCER';
      const abbreviation = 'SGC';
      const label = 'control-0099';
      // Figment aliases may be used to get certain characters.
      expect(uniname.get(figment)).toBe(character);
      // However, they are not returned by `getPreferredName`; code-point
      // labels are preferably returned.
      expect(uniname.getPreferredName(character)).toBe(label);
      // Nevertheless, they are still returned by `getNameEntries`.
      expect(uniname.getNameEntries(character)).toStrictEqual([
        [ label, 'label' ],
        [ figment, 'figment' ],
        [ abbreviation, 'abbreviation' ],
      ]);
    });

    test('case insensitive', () => {
      const character = '\u0099';
      const alias = 'Single Graphic Character Introducer';
      expect(uniname.get(alias)).toBe(character);
    });
  });
});

describe('private-use characters', () => {
  test('in Basic Multilingual Plane', () => {
    const character = '\uE001';
    const label = 'private-use-E001';
    expect(uniname.get(label)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(label);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('in Supplementary Multilingual Plane 15', () => {
    const character = '\u{F0001}';
    const label = 'private-use-F0001';
    expect(uniname.get(label)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(label);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('in Supplementary Multilingual Plane 16', () => {
    const character = '\u{100001}';
    const label = 'private-use-100001';
    expect(uniname.get(label)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(label);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('case insensitive', () => {
    const character = '\uE001';
    const name = 'Private-Use-e001';
    expect(uniname.get(name)).toBe(character);
  });

  test('without spaces or medial hyphens', () => {
    const character = '\uE001';
    const name = 'privateuseE001';
    expect(uniname.get(name)).toBe(character);
  });

  test('invalid label', () => {
    const label = 'private-use-FDEF';
    expect(uniname.get(label)).toBeUndefined();
  });
});

describe('surrogates', () => {
  test('in Basic Multilingual Plane', () => {
    const noncharacter = '\uD801';
    const label = 'surrogate-D801';
    expect(uniname.get(label)).toBe(noncharacter);
    expect(uniname.getPreferredName(noncharacter)).toBe(label);
    expect(uniname.getNameEntries(noncharacter))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('case insensitive', () => {
    const character = '\uD801';
    const name = 'Surrogate-d801';
    expect(uniname.get(name)).toBe(character);
  });

  test('without spaces or medial hyphens', () => {
    const character = '\uD801';
    const name = 'surrogateD801';
    expect(uniname.get(name)).toBe(character);
  });

  test('invalid label', () => {
    const label = 'surrogate-E000';
    expect(uniname.get(label)).toBeUndefined();
  });
});

describe('noncharacters', () => {
  test('starting at FDD0', () => {
    const noncharacter = '\uFDEF';
    const label = 'noncharacter-FDEF';
    expect(uniname.get(label)).toBe(noncharacter);
    expect(uniname.getPreferredName(noncharacter)).toBe(label);
    expect(uniname.getNameEntries(noncharacter))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('at the ends of planes', () => {
    const noncharacter = '\u{10FFFE}';
    const label = 'noncharacter-10FFFE';
    expect(uniname.get(label)).toBe(noncharacter);
    expect(uniname.getPreferredName(noncharacter)).toBe(label);
    expect(uniname.getNameEntries(noncharacter))
      .toStrictEqual([ [ label, 'label' ] ]);
  });

  test('case insensitive', () => {
    const character = '\uFDEF';
    const name = 'Noncharacter-fdef';
    expect(uniname.get(name)).toBe(character);
  });

  test('without spaces or medial hyphens', () => {
    const character = '\uFDEF';
    const name = 'noncharacterFDEF';
    expect(uniname.get(name)).toBe(character);
  });

  test('invalid label', () => {
    const label = 'noncharacter-E000';
    expect(uniname.get(label)).toBeUndefined();
  });
});

describe('named character sequences', () => {
  test('with fields in source file not padded with spaces', () => {
    const character = '\u0030\uFE0F\u20E3';
    const name = 'KEYCAP DIGIT ZERO';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, 'sequence' ] ]);
  });

  test('with fields in source file padded with spaces', () => {
    const character = '\u0B95\u0BBE';
    const name = 'TAMIL SYLLABLE KAA';
    expect(uniname.get(name)).toBe(character);
    expect(uniname.getPreferredName(character)).toBe(name);
    expect(uniname.getNameEntries(character))
      .toStrictEqual([ [ name, 'sequence' ] ]);
  });

  test('case insensitive', () => {
    const character = '\u0030\uFE0F\u20E3';
    const name = 'Keycap Digit Zero';
    expect(uniname.get(name)).toBe(character);
  });

  test('without spaces or medial hyphens', () => {
    const character = '\u0030\uFE0F\u20E3';
    const name = 'KEYCAPDIGITZERO';
    expect(uniname.get(name)).toBe(character);
  });
});

test('multiple character names', () => {
  const string = ' \u0030\uFE0F\u20E3 ';
  const nameArray = [ 'SPACE', 'KEYCAP DIGIT ZERO', 'SPACE' ];
  expect(uniname.get(...nameArray)).toBe(string);
});

if (process.env.TEST_ALL_UCD_NAMES)
  test('all name entries extracted from Unicode Character Database', () => {
    for (const nameObject of nameObjectArrayByScalar) {
      const { headScalar, name, nameType, tailScalarArray = [] } = nameObject;
      const character = String.fromCodePoint(headScalar, ...tailScalarArray);
      expect(uniname.get(name)).toBe(character);
      expect(uniname.getNameEntries(character))
        .toContainEqual([ name, nameType ]);
    }
  });
