// # Fuzzy name folding
// This universal module exports a function that folds names into “fuzzy names”,
// such that two names match each other, as defined by the [Unicode Loose
// Matching Rule UAX44-LM2][UAX44-LM2], only if their fuzzy names equal each
// other.
//
// [UAX44-LM2]: https://www.unicode.org/reports/tr44/#UAX44-LM2
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// This regular expression is used for matching **medial hyphens**, i.e., ASCII
// hyphens that are surrounded by alphanumeric characters on both sides.
const medialHyphenRegExp = /(?<=[A-Z0-9])-(?=[A-Z0-9])/g;

// This regular expression matches, in name stems, medial hyphens that precede
// name counters. Name counters *always* begin with letters or numbers and
// *never* begin with hyphens or spaces, so if any name stem precedes a name
// counter, and if that name stem ends with a hyphen, then that hyphen is a
// medial hyphen, and it is ignorable during fuzzy matching. For more
// information on name stems and name counters, see `/src/main/name-counter/`.
const nameStemPreNameCounterMedialHyphenRegExp = /(?<=[A-Z0-9])-$/g;

// This regular expression matches underscores and spaces, which are padding
// that is removed during fuzzy matching.
const removablePaddingRegExp = /[_ ]/g;

// Temporary hyphens (`*`s) are used to replace medial hyphens, in order to
// easily distinguish medial hyphens from non-medial hyphens when checking for
// the two special Hangul names.
const hyphen = '-', temporaryHyphen = '*';

// ## Special Hangul names
// The two names `U+1180` Hangul Jungseong O-E and `U+116C` Hangul Jungseong OE
// are special: the medial hyphen in the former will not be removed.
//
// Names matching `U+1180`’s special name become `'HANGULJUNGSEONGO-E`, and
// names matching `U+116C`’s special name become `'HANGULJUNGSEONGOE`.

// Both of the special Hangul names start with the same prefix.
const specialHangulPrefix = 'HANGULJUNGSEONG';

// But they end with different suffixes, distinguishable only by the presence of
// a medial hyphen. A temporary hyphen (`*`) is also used to distinguish any
// medial hyphen from non-medial hyphens in the name (non-medial hyphens are
// neither removed nor converted into temporary hyphens).
//
// The presence of any non-medial hyphens makes that name nonequivalent to both
// special Hangul names.
const specialHangulSuffixWithMedialHyphen = 'O-E';
const specialHangulSuffixWithTemporaryMedialHyphen = // 'O*E'
  specialHangulSuffixWithMedialHyphen.replace(hyphen, temporaryHyphen);
const specialHangulSuffixWithoutMedialHyphen = // 'OE'
  specialHangulSuffixWithMedialHyphen.replace(hyphen, '');

// These are used as the return values of `fuzzilyFoldSpecialHangulName`.
// They are the fuzzily folded versions
// of `HANGUL JUNGSEONG O-E` and `HANGUL JUNGSEONG OE`.
export const specialHangulFuzzyNameWithMedialHyphen = // 'HANGULJUNGSEONGO-E'
  specialHangulPrefix + specialHangulSuffixWithMedialHyphen;
export const specialHangulFuzzyNameWithoutMedialHyphen = // 'HANGULJUNGSEONGOE'
  specialHangulPrefix + specialHangulSuffixWithoutMedialHyphen;

// `fuzzilyFold` uses this helper function. The function takes a fuzzily folded
// name with temporary medial hyphens (`*`) and a version of the same string but
// without medial hyphens, and the function returns one of the following:
// * `specialHangulFuzzyNameWithMedialHyphen` (for `U+1180`),
// * `specialHangulFuzzyNameWithoutMedialHyphen` (for `U+116C`), or
// * undefined (for any other Hangul jungseong character’s name).
function fuzzilyFoldSpecialHangulName (
  fuzzyNameWithTemporaryMedialHyphens, fuzzyNameWithoutMedialHyphens,
) {
  const fuzzyNameMatchesSpecialHangulPrefix =
    fuzzyNameWithoutMedialHyphens.startsWith(specialHangulPrefix);
  if (fuzzyNameMatchesSpecialHangulPrefix) {
    const nameIncludesNonMedialHyphens =
      fuzzyNameWithoutMedialHyphens.includes(hyphen);
    return (
      // Neither special Hangul jungseong name contains non-medial hyphens.
      // For example, `HANGUL JUNGSEONG -O-E` is not valid
      // because of the `-` before `O-E`.
      nameIncludesNonMedialHyphens
      ? undefined

      : fuzzyNameWithTemporaryMedialHyphens
        .endsWith(specialHangulSuffixWithTemporaryMedialHyphen) // 'O*E'
      ? specialHangulFuzzyNameWithMedialHyphen // HANGULJUNGSEONGO-E

      : fuzzyNameWithTemporaryMedialHyphens
        .endsWith(specialHangulSuffixWithoutMedialHyphen) // 'OE'
      ? specialHangulFuzzyNameWithoutMedialHyphen // HANGULJUNGSEONGOE

      // Other Hangul jungseong names are not handled by this function.
      : undefined
    );
  }
}

// This function converts the given string `inputName` into a form suitable for
// fuzzy matching with Unicode names according to UAX44-LM2. The `input` is made
// uppercase, and spaces, underscores, and (almost) all medial hyphens are
// removed. A certain pair of characters (`U+1180` and `116C`) are given special
// treatment as per the Standard.
//
// The `nameStemIsPreNameCounter` optional parameter, if given a truthy value,
// will make it so that the `inputName` is considered as a name stem that
// actually precedes a name counter; in that case, if `inputName` ends with an
// alphanumeric character then a hyphen, then that hyphen is assumed to be a
// medial hyphen and is removed. (Name counters *always* begin with letters or
// numbers and *never* begin with hyphens or spaces, so if any name stem
// precedes a name counter, and if that name stem ends with a hyphen, then that
// hyphen is a medial hyphen, and it is ignorable during fuzzy matching.)
export default function fuzzilyFold (inputName, nameStemIsPreNameCounter) {
  const uppercaseName = inputName.toUpperCase();
  const uppercaseNameWithoutPreNameCounterMedialHyphen =
    nameStemIsPreNameCounter
      ? uppercaseName.replaceAll(nameStemPreNameCounterMedialHyphenRegExp, '')
      : uppercaseName;

  const fuzzyNameWithTemporaryMedialHyphens =
    uppercaseNameWithoutPreNameCounterMedialHyphen
      .replaceAll(medialHyphenRegExp, temporaryHyphen)
      .replaceAll(removablePaddingRegExp, '');

  const fuzzyNameWithoutMedialHyphens = fuzzyNameWithTemporaryMedialHyphens
    .replaceAll(temporaryHyphen, '');

  const specialHangulFuzzyName = fuzzilyFoldSpecialHangulName(
    fuzzyNameWithTemporaryMedialHyphens, fuzzyNameWithoutMedialHyphens,
  );

  return specialHangulFuzzyName || fuzzyNameWithoutMedialHyphens;
}
