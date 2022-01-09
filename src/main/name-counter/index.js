// # Name counters
// This universal module exports objects that help derive names from “name
// counters”, which are algorithms that generate sequences of names from index
// integers.
//
// A **name stem** is the part of a Unicode name that excludes its name counter
// (if it has any).
//
// A **name counter** is the ending part of a Unicode name (if any) that can be
// dynamically generated from some sequential rule over some integer range.
// Name counters *always* begin with letters or numbers and *never* begin with
// hyphens or spaces.
//
// A **name-counter type (or `nameCounterType`)** is any one of these strings:
//
// **`HEX`**: The name counter is a padded scalar hex (between four and six
// digits). For example, `noncharacter-FFFE` or `CJK Unified Ideograph-4E00`.
//
// **`HANGULSYLLABLE`**: The name counter is a romanized Hangul syllable.
// These are the romanized sounds of the three kinds of Hangul jamo, in scalar
// order. Hangul syllables are divided into a regular pattern, first by leading
// jamo, then by vowel jamo, then by trailing jamo:
// * (((가 각 갂 갃 간 … 갛) (개 객 갞 갟 갠 … 갷) … (기 … 깋)) … ((하 … 핳) …
//   (히 … 힣))) or
// * (((GA GAG GAGG GAGS GAN GAN … GAH) … (GAE GAEG GAEGG GAEGS GAEN … GAEH) …
//   (GI … GIH)) … ((HA … HAH) … (HI … HIH))).
//
// For more information on romanized Hangul syllables, see the
// `src/main/hangul-syllable/` module.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { getHangulSyllableNameCounter } from '../hangul-syllable';
import { getNumberFromHex, getPaddedHexFromScalar } from '../string/';

// This object’s methods derive names from the given `nameStem` and
// `nameCounterValue` that is appropriate for the given `nameCounterType` key. For
// example, `nameCounterDeriver.HEX('noncharacter-', 0xFFFE, 1)` returns
// `'noncharacter-FFFE'`. All of these methods are static functions; none of
// these methods depend on their `this` receiver.
const nameCounterDeriver = {
  null (nameStem) {
    return nameStem;
  },

  HEX (nameStem, nameCounterValue) {
    return nameStem + getPaddedHexFromScalar(nameCounterValue);
  },

  HANGULSYLLABLE (nameStem, nameCounterValue) {
    return nameStem + getHangulSyllableNameCounter(nameCounterValue);
  }
};

// This function TODO
export function deriveName ({
  nameStem, nameCounterType = null, nameCounterValue,
}) {
  const deriveNameForNameCounterType = nameCounterDeriver[nameCounterType];

  if (deriveNameForNameCounterType == null)
    throw new TypeError(
      `Unhandled name-counter type ${
        JSON.stringify(nameCounterType)
      } found in database while retrieving name entries of ${
        JSON.stringify({ nameStem, nameCounterType, nameCounterValue })
      }.`);

  return deriveNameForNameCounterType(nameStem, nameCounterValue);
}

// This helper RegExp matches any name that ends with an uppercase scalar hex,
// which must be zero-padded to be at least four digits long and whose value
// cannot exceed the maximum scalar `0x10FFFF`. Any leading zeroes that are not
// necessary to make the hex longer than four digits (e.g., in `'0FFFF'`) – or
// any leading digits that would make the hex’s value exceed the maximum scalar
// (e.g., in `'110000'`) – are ignored and not consumed.
const hexCounterRegExp =
  /(?:[0-9A-F]{4}|[1-9A-F][0-9A-F]{4}|10[0-9A-F]{4})$/;

function parseHexName (name) {
  const match = hexCounterRegExp.exec(name);
  if (match) {
    const [ scalarHex ] = match;
    const nameStem = name.slice(0, -scalarHex.length);
    const nameCounterValue = getNumberFromHex(scalarHex);
    return { nameStem, nameCounterType: 'HEX', nameCounterValue };
  }
}

function parseNameDefault (name) {
  return { nameStem: name };
}

// This function checks the given `name` for any matching name counter at its
// end, such as a scalar hex code. It returns an object `{ nameCounterType,
// nameStem, nameCounterValue }`. `nameCounterType` may either be null or a
// string. `nameCounterValue` is a non-negative integer.
export function parseName (name) {
  return parseHexName(name) ?? parseNameDefault(name);
}
