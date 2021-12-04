// # Korean Hangul-syllable names
// This module exports functions that look up the Korean Hangul syllables, which
// have dynamically generated names. These algorithms are defined in The Unicode
// Standard, § 3.12.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import fuzzilyFold from '../fuzzy-fold/';
import { getCodePointsFromString } from '../string/';

// ## General constants
// This is the base scalar for Hangul syllables. The first Hangul-syllable
// scalar is `U+AC00` HANGUL SYLLABLE GA.
const syllableBaseScalar = 0xAC00;

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
// offsets from the base scalars. Note that the final syllable scalar, `U+D7A3`,
// equals `leadingJamoBaseScalar + numOfSyllables - 1`.
const numOfLeadingJamo =
  jamoSoundsByType.leading.length; // 19 or 0x13
const numOfVowelJamo =
  jamoSoundsByType.vowel.length; // 21 or 0x15
const numOfTrailingJamo =
  jamoSoundsByType.trailing.length; // 28 or 0x1C
const numOfSyllablesPerLeadingJamo =
  numOfVowelJamo * numOfTrailingJamo; // 588 or 0x24C
const numOfSyllables =
  numOfLeadingJamo * numOfSyllablesPerLeadingJamo; // 11172 or 0x2BA4

// This string is the prefix for all Hangul syllables’ names.
const syllableNamePrefix = 'HANGUL SYLLABLE ';

// This string is used to fuzzily match Hangul syllable names.
// It is 'HANGULSYLLABLE'.
const fuzzySyllableNamePrefix = fuzzilyFold(syllableNamePrefix);

// ## Generating names from characters

// This helper function is used by `getJamoIndices`. It takes an index integer
// and returns a boolean for whether the index is between `0` inclusive and
// `numOfSyllables` = 11172 exclusive. The index may refer to a Hangul syllable
// only if it is within that valid interval.
function isValidSyllableIndex (index) {
  return 0 <= index && index < numOfSyllables;
}

// This helper object is used by `getJamoIndices`. Each of its methods takes a
// syllable-index integer (between `0` inclusive and `numOfSyllables` = 11172
// exclusive) and returns a jamo index integer (at least `0` inclusive). The
// arithmetic is due to the arrangement of the syllable sounds in a grid by
// their jamo types: first leading, the vowel, then trailing.
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

// This array of helper functions is used by `getHangulSyllableName`. Each
// function takes a syllable-index integer (between `0` inclusive and
// `numOfSyllables` = 11172 exclusive) and returns a jamo sound string (like
// `'YEO'` or `'GS'`).
const jamoSoundGetterArray =
  jamoTypeOrder.map(jamoType =>
    function getJamoSound (syllableIndex) {
      const getJamoIndex = jamoIndexGettersByType[jamoType];
      const jamoIndex = getJamoIndex(syllableIndex);
      return jamoSoundsByType[jamoType][jamoIndex];
    });

// This function accepts an `input` string argument and returns a name entry for
// the strict Name property string for that string, if that character is one of
// the precomposed Hangul syllables. Otherwise, the function returns
// `undefined`.
export function getHangulSyllableNameEntry (input) {
  // Get the first code point from the input.
  const [ codePoint, ...remainingCodePoints ] = getCodePointsFromString(input);

  if (remainingCodePoints.length)
    // All Hangul-syllable characters are one code point long. If there is more
    // than one code point, then it is not a Hangul syllable.
    return undefined;

  // The syllable index integer is the offset between the character’s code point
  // and that of the first precomposed Hangul syllable `U+AC00` HANGUL SYLLABLE
  // GA.
  const syllableIndex = codePoint - syllableBaseScalar;

  // Only if the input’s scalar is not within `U+AC00`–`D7A3`, then it encodes a
  // precomposed Hangul syllable.
  if (isValidSyllableIndex(syllableIndex)) {
    const jamoSoundArray =
      jamoSoundGetterArray.map(getJamoSound =>
        getJamoSound(syllableIndex));
    const syllableSound = jamoSoundArray.join('');
    const name = syllableNamePrefix + syllableSound;
    const nameType = null;
    return [ name, nameType ];
  }
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
// * Then applying a rule that matches a vowel `YAE` to the same input string at
//   index `2` will result in a match `{ meaning: 3, inputIndex: 5 }` (the
//   `meaning: 3` refers to the `YAE` vowel jamo’s own index in
//   `jamoSoundsByType.vowel`).
//
// * Lastly, applying a rule that matches a trailing `K` to the same input
//   string at index `5` will result in a match `{ meaning: 2, inputIndex: 6 }`
//   (the `meaning: 2` refers to the `G` trailing jamo’s own index in
//   `jamoSoundsByType.leading`). Because that match’s `inputIndex` is at `6`,
//   which is the length of the input string `DDYAEG`, there are no more
//   leftover characters in the input string to parse by that time.

// ### Jamo-sound parsers
// This helper function is used by `createFurthestMatchReducer`. It takes an
// `expectedSubstring` and returns whether the given `bodyString` starts with
// that `expectedSubstring`, starting at the given `bodyStringIndex` integer
// (between `0` inclusive and `bodyString.length` exclusive).
function isSubstringAt (expectedSubstring, bodyString, bodyStringIndex) {
  const bodySubstring = bodyString
    .substring(bodyStringIndex, bodyStringIndex + expectedSubstring.length);
  return bodySubstring === expectedSubstring;
}

// This helper metafunction is used by `createSyllableJamoParser`. It creates a
// parser that takes an input string and an input index integer (between `0`
// inclusive and the input string’s length exclusive). It may return a match
// object (if its parsing succeeds at the input index) or a `null` (if its
// parsing fails at the input index). It succeeds only if the given jamo sound
// is present at the input string’s input index. The match’s new input index is
// advanced by the length of the jamo sound. The match’s meaning is the given
// jamo index number.
function createJamoSoundParser ([jamoIndex, jamoSound]) {
  return function parseJamoSound (inputString, inputIndex0) {
    if (isSubstringAt(jamoSound, inputString, inputIndex0))
      return {
        meaning: jamoIndex,
        inputIndex: inputIndex0 + jamoSound.length,
      };
  };
}

// ### Choice parsers
// This helper function is used by `createFurthestMatchReducer`. It takes two
// match (`{ meaning, inputIndex }` objects), and it returns the further match
// (with the further `inputIndex`). Either match may be `null`, in which case
// this function counts that match as always less further than the other.
function getFurtherMatch (match0, match1) {
  if (!match0)
    return match1;
  else if (!match1)
    return match0;
  else
    return match0.inputIndex < match1.inputIndex
      ? match1 : match0;
}

// This helper metafunction is used by `choose`. It creates a reducing function
// that applies the given parser to the given input string at the given input
// index integer, compares the resulting next match to the given previous match,
// then returns which of those two matches is further along the input string.
function createChoiceReducer (inputString, inputIndex) {
  return function reduceChoice (match0, parser) {
    const match1 = parser(inputString, inputIndex);
    return getFurtherMatch(match0, match1);
  };
}

// This helper metafunction is used by `createSyllableJamoParser`. It creates a
// parser that takes an input string and an input index integer (between `0`
// inclusive and the input string’s length exclusive). It may return a match
// object (if its parsing succeeds at the input index) or a `null` (if its
// parsing fails at the input index).
//
//The parser succeeds only if any of the given parsers matches the given input
//string at the given input index. It returns the match object that is furthest
//along the input string, if any. If no given parser succeeds, then the entire
//parsing fails and returns `null`.
function choose (...parsers) {
  return function parseChoice (inputString, inputIndex) {
    const match0 = null;
    return parsers.reduce(createChoiceReducer(inputString, inputIndex), match0);
  }
}

// ### Concatenation parsers

// This helper metafunction is used by `concatenate`. It creates a reducing
// function that takes a previous match (whose meaning must be iterable) and a
// next parser, and which attempts to consecutively apply the next parser (to
// the input string at the location given by the previous match), then to
// combine together the resulting two matches.
//
// If the given previous match is not `null` (i.e., if the previous parsers did
// not consecutively fail), then the reducing function applies the given parser
// to the given input string at that given match’s input index integer. If that
// given parser in turn succeeds in matching, then the reducing function returns
// a match object whose input index has been advanced by however much the parser
// matched, and whose meaning is an array of the previous match’s meaning along
// with the parser’s match’s meaning.
//
// If the given match is `null`, then the reducing function returns `null` too.
function createConcatenateReducer (inputString) {
  return function reduceConcatenation (match0, parser) {
    if (match0) {
      const match1 = parser(inputString, match0.inputIndex);
      if (match1)
        return {
          meaning: [ ...match0.meaning, match1.meaning ],
          inputIndex: match1.inputIndex,
        };
    }
  };
}

// This helper metafunction is used by `parseSyllableSound`. It creates a parser
// that takes an input string and an input index integer (between `0` inclusive
// and the input string’s length exclusive). It may return a match object (if
// its parsing succeeds at the input index) or a `null` (if its parsing fails at
// the input index).
//
// The parser succeeds only if all of the given parsers consecutively match the
// given input string, starting at the given input index. If all given parsers
// do consecutively match, then the returned match’s new input index is advanced
// to the input index after applying the final given parser. The match’s meaning
// is an array of the given parsers’ matches’ meanings.
//
// If any of the given parsers do not match, then the entire parsing fails and
// returns `null`.
function concatenate (...parsers) {
  return function parseConcatenation (inputString, inputIndex0) {
    const match0 = {
      meaning: [],
      inputIndex: inputIndex0,
    };
    return parsers.reduce(createConcatenateReducer(inputString), match0);
  }
}

// ### End-of-input parser
// This parser is used by `parseSyllableSound`. It takes an input string and an
// input index integer (between `0` inclusive and the input string’s length
// exclusive). It may return a match object (if its parsing succeeds at the
// input index) or a `null` (if its parsing fails at the input index).
//
// The parser succeeds only if the input index is at the end of the input
// string. The match’s new input index is advanced by the length of the jamo
// sound. The match’s meaning is the given jamo index number.
function endOfInput (inputString, inputIndex) {
  if (inputIndex === inputString.length)
    return { meaning: true, inputIndex };
  else
    return null;
}

// ### Syllable-sound parsers
// This helper metafunction is used by `parseSyllableSound`. It creates a parser
// that takes an input string and an input index integer (between `0` inclusive
// and the input string’s length exclusive). It may return a match object (if
// its parsing succeeds at the input index) or a `null` (if its parsing fails at
// the input index).
//
// The parser succeeds only if the input string matches any jamo sounds of the
// given jamo type at the given input index. If it succeeds, its match’s meaning
// is the index integer for the jamo sound that matched.
function createSyllableJamoParser (jamoType) {
  return choose(
    ...Array.from(jamoSoundsByType[jamoType].entries())
      .map(createJamoSoundParser),
  );
}

// This helper metafunction is used by `parseHangulSyllableName`. It creates a
// parser that takes an input string and an input index integer (between `0`
// inclusive and the input string’s length exclusive). It may return a match
// object (if its parsing succeeds at the input index) or a `null` (if its
// parsing fails at the input index).
//
// The parser succeeds only if the input string consecutively matches (starting
// at the given input index) a leading jamo sound, a vowel jamo sound, a
// trailing jamo sound, then the end of input. If it succeeds, its match is an
// array of the index integers for the three jamo sounds that matched.
const parseSyllableSound =
  concatenate(...jamoTypeOrder.map(createSyllableJamoParser), endOfInput);

// This helper function is used by `parseHangulSyllableName`. It composes index
// integers for three jamo sounds into the single Unicode scalar for a
// precomposed Hangul syllable.
function composeSyllableScalar (
  leadingJamoIndex, vowelJamoIndex, trailingJamoIndex,
) {
  return syllableBaseScalar
    + (leadingJamoIndex * numOfVowelJamo + vowelJamoIndex) * numOfTrailingJamo
    + trailingJamoIndex;
}

// This function accepts a `fuzzyName` string argument, and it returns the
// character string (if any) that is a precomposed Hangul syllable whose strict
// Name property string fuzzily matches the given `fuzzyName`. Otherwise, the
// function returns `undefined`. `fuzzyName` must be a fuzzily folded string
// (see `fuzzilyFold` from `./fuzzy-fold`).
export function getHangulSyllable (fuzzyName) {
  const nameIsHangulSyllable = fuzzyName.startsWith(fuzzySyllableNamePrefix);
  if (nameIsHangulSyllable) {
    const syllableSoundString =
      fuzzyName.substring(fuzzySyllableNamePrefix.length);
    const initialInputIndex = 0;
    const match = parseSyllableSound(syllableSoundString, initialInputIndex);

    // If the parsing returns a match (`match` is not null), then the input
    // string is a valid Hangul syllable.
    if (match)
      return String.fromCodePoint(composeSyllableScalar(...match.meaning));

    // If `match` is `null`, then the input string is not a valid Hangul
    // syllable, and this function returns `undefined`.
  }
}
