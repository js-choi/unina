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
// **HEX**: The name counter is a padded scalar hex (between four and six
// digits). For example, `noncharacter-FFFE` or `CJK Unified Ideograph-4E00`.
//
// **HANGULSYLLABLE**: The name counter is a romanized Hangul syllable.
// These are the romanized sounds of the three kinds of Hangul jamo, in scalar
// order. Hangul syllables are divided into a regular pattern, first by leading
// jamo, then by vowel jamo, then by trailing jamo:
// * (((가 각 갂 갃 간 … 갛) (개 객 갞 갟 갠 … 갷) … (기 … 깋)) … ((하 … 핳) …
//   (히 … 힣))) or
// * (((GA GAG GAGG GAGS GAN GAN … GAH) … (GAE GAEG GAEGG GAEGS GAEN … GAEH) …
//   (GI … GIH)) … ((HA … HAH) … (HI … HIH))).
//
// ## The identity invariant
// Given the fuzzily folded version of any Unicode name, `parseName` and
// `deriveName` must cancel each other out.
//
// In other words, for each outputted `nameObject`, the following invariant must
// hold: `parseName(fuzzilyFold(deriveName(nameObject)))` will evaluate to a
// name object that is equivalent to the original `nameObject`.
//
// Without this **name-counter identity invariant**, we would not be able to
// consistently retrieve characters by their names from the database (which we
// build from these name objects). This is because, when we search for a name in
// the database, we need to parse the fuzzily folded input search name into a
// stem and a counter using the same parsing algorithm; this has to result in
// the same stem and the same counter: it is that name stem and counter which
// will be sought in the database.
//
// We thus perform a sanity check here to make sure that this identity invariant
// holds for each `inputNameObject`.
//
// For example:
// * Assume that `parseName('ZAA')` is `{ nameStem: 'Z', nameCounterType:
//   'TEST', nameCounterValue: 2 }`.
// * And assume that `deriveName('ZA', 'TEST', 1)` is `'ZA-A'`.
// * And assume that `nameObject` is `{ nameStem: 'ZA', nameCounterType: 'TEST',
//   nameCounterValue: 1 }`.
//
// In this case, `nameObject` violates the identity invariant. This is because:
// 1. `deriveName(nameObject)` returns `ZA-A`.
// 2. `fuzzilyFold('ZA-A')` is `'ZAA'`.
// 3. `parseName('ZAA')` is *not* equivalent to `nameObject`. Its `nameStem`
//    does not match `nameObject.nameStem` (the former is `'Z'`, but the latter
//    was `'ZA'`).
//
// The failure of this invariant means that searching for `'ZA-A'` (or `'ZAA'`)
// will never succeed in a match with `nameObject`: their `nameStem`s (`'Z'`
// versus `'ZA'`) will never match.
//
// This invariant violation actually occurred during development, when
// scalar-hex name counters (indicated here by `nameCounterType: 'HEX'`) were
// naïvely parsed from fuzzily folded names simply by checking for scalar hexes
// at their ends.
//
// For example, the name `SURROGATE-D800` was being fuzzily folded into
// `SURROGATED800`, which was then parsed into `{ nameCounterType: 'HEX',
// nameStem: 'SURROGAT', nameCounterValue: 0xED800 }`. (Note that the `E` at the
// end of `SURROGATE` was greedily parsed into the scalar hex `D800`.) In
// addition, the name object for `SURROGATE-D800` was looked like `{
// nameCounterType: 'HEX', nameStem: 'SURROGATE-', nameCounterValue: 0xD800
// }`. This means that `SURROGATE-D800` (and `SURROGATED800`) would never match
// this name object, since their parsed name stems (`SURROGAT`) are not equal to
// the name object’s (`SURROGATE`). (The same problem also occurred with names
// like `PRIVATE-USE-E000`, which also caused the final `E` in `PRIVATE-USE` to
// combine with the scalar hex.)
//
// (After discovering this, we switched from `nameCounterType: 'HEX'` to
// `nameCounterType: 'SURROGATE'`, `nameCounterType: 'PRIVATEUSE'`, etc.)
//
// This invariant is validated in the `main/name-object/` module.
//
// ## License
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
