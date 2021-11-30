// # Re-Pair text compression
// This universal module exports a function that
// applies the Re-Pair compression algorithm to strings of text.

import { hexBase } from '../math/';
import { getFrequencies, overlapPairs } from '../iterator/';

// This helper function takes an input `string`
// and returns an array of strings (its overlapping bigrams).
// For example, applying this function to `'xyzzy'`
// would return `[ 'xy', 'yz', 'zz', 'zy' ]`.
// If the string is only 0 or 1 characters long, an empty array is returned.
function getBigrams (string) {
  return [ ...overlapPairs(string) ]
    .map(pair => pair.join(''));
}

// This helper function finds the frequency of
// every overlapping bigram in the given `stringArray`.
// It returns a `Map` between bigram strings and integers.
// This function ignores strings in `stringArray`
// that are only 0 or 1 characters long.
function getBigramFrequencies (stringArray) {
  const bigramArray = stringArray
    .map(getBigrams)
    .flat();
  return getFrequencies(bigramArray);
}

// This helper function finds the most frequently repeating bigram
// that occurs in `stringArray`. It returns the bigram string
// (or `undefined` if there is not a single repeating bigram in `stringArray`).
// If there are many bigrams that are tied for being most frequent,
// then this function returns the lexicographically first bigram from among them.
function getMostRepeatingBigram (stringArray) {
  const frequencyMap = getBigramFrequencies(stringArray);
  const maxFrequency = Math.max(...frequencyMap.values());
  if (maxFrequency > 1) {
    const maxBigramArray = [ ...frequencyMap ]
      .filter(([ bigram, frequency ]) => frequency === maxFrequency)
      .map(([ bigram ]) => bigram)
      .sort();
    return maxBigramArray[0];
  }
}

// This helper function gets the substitution character
// corresponding to the given `substitutionIndex` integer.
// When `integer` is 0, then this returns `private-use-F0000`,
// when `integer` is 1, then this returns `private-use-F0001`,
// and so on.
const baseSubstitutionCodePoint = 0xF0000;
function getSubstitutionCharacter (substitutionIndex) {
  return String.fromCodePoint(baseSubstitutionCodePoint + substitutionIndex);
}

// This helper function compresses the given `stringArray` with Re-Pair once
// and adds the substitution to the given `bigramArray` grammar.
// It substitutes all recurring bigrams in the strings of `stringArray`
// with substitution characters that start at `private-use-F0000`.
// It returns an object `{ stringArray, bigramArray }`,
// where `stringArray` is the original `stringArray`
// after its accumulated substitutions
// and `bigramArray` is an array of bigrams
// corresponding to each substitution character,
// starting at `private-use-F0000`.
function compressRePairOnce ({ stringArray, bigramArray }) {
  const mostRepeatingBigram = getMostRepeatingBigram(stringArray);
  if (mostRepeatingBigram) {
    const substitutionCharacter = getSubstitutionCharacter(bigramArray.length);
    return {
      stringArray: stringArray
        .map(string => string.replaceAll(mostRepeatingBigram, substitutionCharacter)),
      bigramArray: [ ...bigramArray, mostRepeatingBigram ],
    };
  }
}

// This function compresses the given `stringArray` with Re-Pair.
// It substitutes all recurring bigrams in the strings of `stringArray`
// with substitution characters that start at `private-use-F0000`.
// It returns an object `{ stringArray, bigramArray }`,
// where `stringArray` is the original `stringArray`
// after its accumulated substitutions
// and `bigramArray` is an array of bigrams
// corresponding to each substitution character,
// starting at `private-use-F0000`.
export default function compressRePair (stringArray) {
  let previousCompressionResult = { stringArray, bigramArray: [] };
  while (true) {
    const compressionResult = compressRePairOnce(previousCompressionResult);
    if (compressionResult ?? false)
      previousCompressionResult = compressionResult;
    else
      return previousCompressionResult;
  }
}
