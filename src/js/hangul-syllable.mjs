// # Korean Hangul-syllable names
// This module exports functions that look up the Korean Hangul syllables,
// which have dynamically generated names. These algorithms are defined in The
// Unicode Standard, § 3.12.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as PEG from '#js/util/peg';

// ## General constants
// This is the base scalar for Hangul syllables. The first Hangul-syllable
// scalar is `U+AC00` HANGUL SYLLABLE GA.
export const basePoint = 0xAC00;

// These are the base scalars for the three kinds of Hangul jamo.
const leadingJamoBaseScalar = 0x1100;
const vowelJamoBaseScalar = 0x1161;
const trailingJamoBaseScalar = 0x11A7;

// These are the romanized sounds of the three kinds of Hangul jamo, in scalar
// order. Hangul syllables are divided into a regular pattern, first by leading
// jamo, then by vowel jamo, then by trailing jamo:
// * (((가 각 갂 갃 간 … 갛) (개 객 갞 갟 갠 … 갷) … (기 … 깋)) … ((하 … 핳) …
//   (히 … 힣))) or
// * (((GA GAG GAGG GAGS GAN GAN … GAH) … (GAE GAEG GAEGG GAEGS GAEN … GAEH) …
//   (GI … GIH)) … ((HA … HAH) … (HI … HIH))).
const jamoSoundsByType = {
  leading: [
    'G', 'GG', 'N', 'D', 'DD', 'R', 'M', 'B', 'BB',
    'S', 'SS', '', 'J', 'JJ', 'C', 'K', 'T', 'P', 'H',
  ],
  vowel: [
    'A', 'AE', 'YA', 'YAE', 'EO', 'E', 'YEO', 'YE', 'O',
    'WA', 'WAE', 'OE', 'YO', 'U', 'WEO', 'WE', 'WI',
    'YU', 'EU', 'YI', 'I',
  ],
  trailing: [
    '', 'G', 'GG', 'GS', 'N', 'NJ', 'NH', 'D', 'L', 'LG', 'LM',
    'LB', 'LS', 'LT', 'LP', 'LH', 'M', 'B', 'BS',
    'S', 'SS', 'NG', 'J', 'C', 'K', 'T', 'P', 'H',
  ],
};
const jamoTypeOrder = [ 'leading', 'vowel', 'trailing' ];

// These are the numbers of the Hangul character kinds, which will be used as
// offsets from the base scalars. Note that the final syllable scalar,
// `U+D7A3`, equals `leadingJamoBaseScalar + numOfSyllables - 1`.
const numOfLeadingJamo =
  jamoSoundsByType.leading.length; // 19 or 0x13
const numOfVowelJamo =
  jamoSoundsByType.vowel.length; // 21 or 0x15
const numOfTrailingJamo =
  jamoSoundsByType.trailing.length; // 28 or 0x1C
const numOfSyllablesPerLeadingJamo =
  numOfVowelJamo * numOfTrailingJamo; // 588 or 0x24C
export const numOfSyllables =
  numOfLeadingJamo * numOfSyllablesPerLeadingJamo; // 11172 or 0x2BA4

// ## Generating names from characters

// This helper object’ methods each take a syllable-index integer (between `0`
// inclusive and `numOfSyllables` = 11172 exclusive) and returns a jamo index
// integer (at least `0` inclusive). The arithmetic is due to the arrangement
// of the syllable sounds in a grid by their jamo types: first leading, the
// vowel, then trailing.
const jamoIndexGettersByType = {
  // This method will always return an integer between `0` and
  // `numOfLeadingJamo`.
  leading (syllableIndex) {
    return Math.floor(
      syllableIndex / numOfSyllablesPerLeadingJamo
    );
  },

  // This method will always return an integer between `0` and
  // `numOfVowelJamo`.
  vowel (syllableIndex) {
    return Math.floor(
      (syllableIndex % numOfSyllablesPerLeadingJamo) / numOfTrailingJamo
    );
  },

  // This method will always return an integer between `0` and
  // `numOfTrailingJamo`.
  trailing (syllableIndex) {
    return syllableIndex % numOfTrailingJamo;
  },
};

// This array contains functions, each of which takes a syllable-index integer
// (between `0` inclusive and `numOfSyllables` = 11172 exclusive) and returns a
// jamo sound string (like `'YEO'` or `'GS'`).
const jamoSoundGetterArray =
  jamoTypeOrder.map(jamoType =>
    function getJamoSound (syllableIndex) {
      const getJamoIndex = jamoIndexGettersByType[jamoType];
      const jamoIndex = getJamoIndex(syllableIndex);
      return jamoSoundsByType[jamoType][jamoIndex];
    });

// This function accepts a `codePoint` integer (which must be between
// `basePoint` – `0xAC00` – inclusively and `basePoint +
// numOfSyllables` – `0xD7A4` – exclusively). The function returns the
// `codePoint`’s corresponding Hangul-syllable sound string (like `'GA'` or
// `'HIH'`). It returns the empty string if no corresponding syllable exists.
export function deriveSound (codePoint) {
  // The syllable index integer is the offset between the character’s code
  // point and that of the first precomposed Hangul syllable `U+AC00` Hangul
  // Syllable Ga.
  const syllableIndex = codePoint - basePoint;

  const jamoSoundArray =
    jamoSoundGetterArray.map(getJamoSound =>
      getJamoSound(syllableIndex));

  const syllableSound = jamoSoundArray.join('');
  return syllableSound;
}

// ## Parsing names into characters
// This section uses “parser” functions and “match” objects.
//
// A parser is a function. It takes an input string and an input index integer
// (between `0` inclusive and the input string’s length exclusive). It may
// return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index).
//
// A match object is a `{ meaning, inputIndex }` object. `meaning` may be an
// arbitrary value. `inputIndex` is the input-index integer after the match.
//
// * For instance, applying a rule that matches a leading `DD` to an input
//   string `DDYAEG` at index `0`, will result in a match `{ meaning: 4,
//   inputIndex: 2 }` (the `meaning: 4` refers to the `DD` leading jamo’s own
//   index in `jamoSoundsByType.leading`).
//
// * Then applying a rule that matches a vowel `YAE` to the same input string
//   at index `2` will result in a match `{ meaning: 3, inputIndex: 5 }` (the
//   `meaning: 3` refers to the `YAE` vowel jamo’s own index in
//   `jamoSoundsByType.vowel`).
//
// * Lastly, applying a rule that matches a trailing `K` to the same input
//   string at index `5` will result in a match `{ meaning: 2, inputIndex: 6 }`
//   (the `meaning: 2` refers to the `G` trailing jamo’s own index in
//   `jamoSoundsByType.leading`). Because that match’s `inputIndex` is at `6`,
//   which is the length of the input string `DDYAEG`, there are no more
//   leftover characters in the input string to parse by that time.

// This function creates a parser that takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index). It succeeds only if the
// given jamo sound is present at the input string’s input index. The match’s
// new input index is advanced by the length of the jamo sound. The match’s
// meaning is the given jamo index number.
function createJamoSoundParser ([ jamoIndex, jamoSound ]) {
  return PEG.term(jamoSound, jamoIndex);
}

// This function creates a parser that takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index).
//
// The parser succeeds only if the input string matches any jamo sounds of the
// given jamo type at the given input index. If it succeeds, its match’s
// meaning is the index integer for the *longest* jamo sound that matched.
function createJamoParser (jamoType) {
  const jamoSoundEntryArray = jamoSoundsByType[jamoType].entries();
  const jamoSoundParserArray =
    Array.from(jamoSoundEntryArray)
      // We need to match the longest-matching jamo sound. Because the
      // [`#js/util/peg` module][]’s `choose` function will create parsers that
      // immediately return the first result of any inputted jamo-sound parser,
      // we therefore must sort the inputted jamo-sound parsers by their sound
      // lengths.
      //
      // [`#js/util/peg` module]: ./util/peg.mjs
      .sort(([ , jamoSound0 ], [ , jamoSound1 ]) =>
        jamoSound1.length - jamoSound0.length)
      .map(createJamoSoundParser);
  return PEG.choose(...jamoSoundParserArray);
}

// This function creates a parser that takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index).
//
// The parser succeeds only if the input string consecutively matches (starting
// at the given input index) a leading jamo sound, a vowel jamo sound, a
// trailing jamo sound, then the end of input. If it succeeds, its match is an
// array of the index integers for the three jamo sounds that matched.
const parseSound =
  PEG.concatenate(...jamoTypeOrder.map(createJamoParser), PEG.endOfInput);

// This function composes index integers for three jamo sounds into the single
// Unicode scalar for a precomposed Hangul syllable.
function composeSyllableScalar (
  leadingJamoIndex, vowelJamoIndex, trailingJamoIndex,
) {
  return basePoint
    + (leadingJamoIndex * numOfVowelJamo + vowelJamoIndex) * numOfTrailingJamo
    + trailingJamoIndex;
}

// This function accepts a `syllableSound` upper-case string argument (like
// `'GA'` or `'HIH'`), and it returns the code point of the corresponding
// precomposed Hangul syllable. If no such syllable exists, then the function
// returns `undefined`.
export function matchSound (syllableSound) {
  const initialInputIndex = 0;
  const match = parseSound(syllableSound, initialInputIndex);

  if (match) {
    // In this case, the parsing returned a match (`match` is not null), and
    // the input string is a valid Hangul syllable.
    return composeSyllableScalar(...match.meaning);
  }

  // In this case, `match` is `null`, the input string is not a valid Hangul
  // syllable, and this function returns `undefined`.
}
