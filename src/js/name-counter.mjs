// # Name counters
// This universal module exports objects that help derive names from “name
// counters”, which are algorithms that generate sequences of names from index
// integers (“name-counter value”).
//
// A **name stem** is the part of a Unicode name that excludes its name counter
// (if it has any).
//
// A **name counter** is the ending substring of a Unicode name (if any) that
// can be dynamically generated from some sequential rule over some integer
// range. It is assumed that name counters are always preceded by an
// alphanumeric character in the name and never by a space or hyphen.
// (Therefore, when a name counter begins with a space or hyphen, it is assumed
// that fuzzy folding would remove that space or hyphen, since spaces are
// always removed and any such hyphen would be a medial hyphen, which are also
// removed.) The part of a Unicode name that precedes the name counter is its
// **name stem**. All singleton name ranges’ names have an empty name counter.
//
// A **name-counter type** (or `nameCounterType`) is one of the string key
// constants defined in this module, such as `hyphenHexType` or
// `hangulSyllableType`.
//
// A **name-counter value** is the index integer that corresponds to the name
// counter.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as Hex from '#js/util/hex';
import * as HangulSyllable from '#js/hangul-syllable';

// A **hyphen–hex** name counter is a padded scalar hex (between four and six
// digits), prefixed by a hyphen.
//
// For example:
// * `-FFFE` (in `NONCHARACTER-FFFE`) is the counter of the integer value
//   `0xFFFE`).
// * `-4E00` (in `CJK UNIFIED IDEOGRAPH-4E00`) is the counter of the integer
//   value `0x4E00`.
export const hyphenHexType = 'hyphenHex';

export const cjkUnifiedNameStem = 'CJK UNIFIED IDEOGRAPH';
export const cjkCompatibilityNameStem = 'CJK COMPATIBILITY IDEOGRAPH';
export const tangutNameStem = 'TANGUT IDEOGRAPH';
export const khitanSmallScriptNameStem = 'KHITAN SMALL SCRIPT CHARACTER';
export const nushuNameStem = 'NUSHU CHARACTER';
export const controlNameStem = 'CONTROL';
export const privateUseNameStem = 'PRIVATE-USE';
export const noncharacterNameStem = 'NONCHARACTER';
export const surrogateNameStem = 'SURROGATE';

const zeroDigit = '0';

// A **Hangul syllable** name counter is a romanized Hangul syllable, composed
// from the sounds of the three Hangul jamo types, sorted by scalar order, and
// each preceded by a space.
//
// Hangul syllables are divided into a regular pattern, first by
// leading jamo, then by vowel jamo, then by trailing jamo: * (((가 각 갂 갃 간
// … 갛) (개 객 갞 갟 갠 … 갷) … (기 … 깋)) … ((하 … 핳) … (히 … 힣))) or *
// (((GA GAG GAGG GAGS GAN GAN … GAH) … (GAE GAEG GAEGG GAEGS GAEN … GAEH) …
// (GI … GIH)) … ((HA … HAH) … (HI … HIH))).
//
// So for example:
// * ` GA` (in `HANGUL SYLLABLE GA`, which is `U+AC00` “가”) is the counter of
//   the integer value `0`, since it is the 0th Hangul syllable.
// * ` PWILH` (in `HANGUL SYLLABLE PWILH`, which is `U+D4DB` “퓛”) is the
//   counter of the integer value `0x28DB`, since it is the 10,459th Hangul
//   syllable.
// * ` HIH` (in `HANGUL SYLLABLE HIH`, which is `U+D4DB` “힣”) is the counter
//   of the integer value `0xD7A3`, since it is the 55,203th Hangul syllable.
export const hangulSyllableType = 'hangulSyllable';

export const hangulSyllableNameStem = 'HANGUL SYLLABLE';

// A **space–number-phrase** name counter is an English phrase referring to a
// non-negative integer.

// Ones numbers are 0, 1, 2, …, and 19.
export const spaceOnesNumberPhraseType =
  'spaceOnesNumberPhraseType';

// Tens numbers are between 0, 10, 20, …, and 90.
export const spaceTensNumberPhraseType =
  'spaceTensNumberPhraseType';

const decimalBase = 10;

export const onesNumberPhraseArray = [
  'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR',
  'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN',
  'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
];

export const tensNumberPhraseArray = [
  onesNumberPhraseArray[0],
  onesNumberPhraseArray[10],
  'TWENTY',
  'THIRTY',
  'FORTY',
  'FIFTY',
  'SIXTY',
  'SEVENTY',
  'EIGHTY',
  'NINETY',
];

export const hundredsNumberPhraseArray = [
  onesNumberPhraseArray[0],
  onesNumberPhraseArray[10],
  'TWENTY',
  'THIRTY',
  'FORTY',
  'FIFTY',
  'SIXTY',
  'SEVENTY',
  'EIGHTY',
  'NINETY',
];

// This function returns whether the given `value` is an integer within a
// certain integer interval, i.e., whether the `value` is not nullish and is
// between `initialValue` (inclusive) and `initialValue + length` (exclusive).
function isValidInteger (value, initialValue, length) {
  const exclusiveMaxValue = initialValue + length;
  return (
    value != null
    && initialValue <= value
    && value < exclusiveMaxValue
  );
}

// This dispatcher object contains `parse`’s behavior, using name-counter types
// as its keys.
const fuzzyNameCounterToNameCounterValueDispatcher = {
  // A hyphen-hex name counter is a 4-, 5-, or 6-digit hex between `'0000'` and
  // `'10FFFF'`. If the given `fuzzyNameCounter` is such a hex, then this
  // function returns the corresponding name-counter value. Otherwise, it
  // returns `undefined`. (Note that any hyphen prefix has already been
  // stripped from `fuzzyNameCounter` by fuzzy folding).
  [hyphenHexType] (fuzzyNameCounter, initialNameCounterValue, length) {
    const numOfDigits = fuzzyNameCounter.length;

    // For all names with hexes, their hexes are at least four digits long.
    if (numOfDigits < Hex.minNumOfCodePointHexDigits) {
      // In this case, the name counter is less than four digits long, and it
      // therefore cannot be a valid name’s hex.
      return undefined;
    }

    else if (numOfDigits > Hex.minNumOfCodePointHexDigits) {
      // In this case, the name counter is more than four digits long, and it
      // must not start with a zero digit.
      if (fuzzyNameCounter.startsWith(zeroDigit)) {
        return undefined;
      }
    }

    try {
      return Hex.getInteger(fuzzyNameCounter);
    }

    catch (err) {
      // In this case, the name counter contained invalid hex characters like
      // `G` or `Z`.
      return undefined;
    }
  },

  // A Hangul-syllable name counter is an upper-case Korean syllable-sound
  // string, like `'GA'` or `'HIH'`. If the given `fuzzyNameCounter` is such a
  // syllable sound, then this function returns the syllable’s name-counter
  // value (i.e., its code point). Otherwise, it returns `undefined`.
  [hangulSyllableType] (fuzzyNameCounter) {
    return HangulSyllable.matchSound(fuzzyNameCounter);
  },
};

// This function attempts to parse the given `fuzzyNameCounter` string into a
// corresponding name-counter value.
//
// It is assumed that `fuzzyNameCounter` does not start with any character that
// would have been stripped by fuzzy folding (such as medial hyphens or spaces
// – see the [`#js/fuzzy-folder` module][]). `nameCounterType` must be one of
// the name-counter type strings.
//
// The function returns `undefined` if it is unsuccessful.
//
// [`#js/fuzzy-folder` module]: ./fuzzy-folder.mjs
export function parse (
  fuzzyNameCounter,
  nameCounterType,
  initialNameCounterValue,
  length = 1,
) {
  if (nameCounterType != null) {
    // In this case, the name range in question has non-empty name counters,
    // and we will attempt to parse a name-counter value from the given name
    // counter.
    const convertFuzzyNameCounterToValue =
      fuzzyNameCounterToNameCounterValueDispatcher[nameCounterType];

    const nameCounterValue = convertFuzzyNameCounterToValue(
      fuzzyNameCounter,
      initialNameCounterValue,
      length,
    );

    const nameCounterValueIsValid = isValidInteger(
      nameCounterValue,
      initialNameCounterValue,
      length,
    );

    if (nameCounterValueIsValid) {
      return nameCounterValue;
    }

    else {
      return undefined;
    }
  }

  else {
    // In this case, the name range in question is a singleton range with no
    // name counters, and therefore the given name counter must be empty in
    // order for its name to match the name range in question.
    // In other words, the name in question must completely match the name
    // range’s name stem, and the name’s name counter must be empty. If the
    // name’s name counter is not empty, then that name counter consists of
    // extraneous characters after the name range’s name stem. Therefore,
    // function returns `undefined` when the given `fuzzyNameCounter` is not
    // empty.
    if (!fuzzyNameCounter) {
      return initialNameCounterValue;
    }

    else {
      return undefined;
    }
  }
}

// This dispatcher object contains `derive`’s behavior, using name-counter
// types as its keys.
const nameCounterValueToNameCounterDispatcher = {
  // The name-counter value may be any positive integer. It returns the
  // original name counter (i.e., a hex padded with zeroes as if it were a code
  // point’s hex), in all upper case, and which is then prefixed with a hyphen.
  [hyphenHexType] (nameCounterValue) {
    return '-' + Hex.fromCodePoint(nameCounterValue);
  },

  // The name-counter value must be a Hangul syllable index, from 0 to `0x2BA4`
  // inclusive. It returns the original name counter, which is in all upper
  // case and prefixed with a space.
  [hangulSyllableType] (nameCounterValue) {
    return ' ' + HangulSyllable.deriveSound(nameCounterValue);
  },
};

// This function attempts to derive the given `nameCounterValue` into a standard
// name-counter string. (“Standard” here means “coming from the name as
// originally given by the standard, not fuzzily folded”). `nameCounterType`
// must be one of the name-counter type strings – or it must be nullish, in
// which case this function returns the empty string. The function returns
// `undefined` when a valid non-nullish `nameCounterType` is given but the
// derivation is unsuccessful.
export function derive (
  nameCounterValue,
  nameCounterType,
) {
  if (nameCounterType != null) {
    // In this case, the name range in question has non-empty name counters,
    // and we will attempt to derive a name counter from the given name-counter
    // value.
    const convertNameCounterValueToNameCounter =
      nameCounterValueToNameCounterDispatcher[nameCounterType];
    return convertNameCounterValueToNameCounter(nameCounterValue);
  }

  else {
    // In this case, the name range in question is a singleton range with no
    // name counters, and therefore its name counter is empty.
    return '';
  }
}
