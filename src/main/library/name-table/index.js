// # Database-library name table
// This universal module exports a class that reads a database name table,
// compiled into a string.
//
// The **name table** is a string that encodes an indexed, randomly accessible
// table of name data that is lexicographically sorted by name. The table is
// also equivalent to a **binary search tree** that is rooted at the median
// table entry (the **root entry**). Each given table entry (other than the root
// entry) has exactly one **parent entry**, which a binary search would always
// reach immediately before reaching that table entry.
//
// The table contains the following blocks:
// 1. Text sequence (variable-length strings)
// 2. Name-prefix length vector (integers)
// 3. Head-scalar vector (integers)
//
// The **text sequence** is a sequence of variable-length texts. There is one
// text for each character name, and the texts are lexicographically ordered by
// their character names. Each text looks like: `‹name›‹nameInfo›`.
//
// * The **`‹nameSuffix›`** is the ending suffix of a character name, in all
//   caps, and using spaces and `-`.
//   The length of the suffix is determined by how long is the prefix string
//   that is shared between the table entry’s name and its parent entry’s name:
//   the suffix is the remainder that is not shared with the parent name.
// * The **`‹nameInfo›`** is one of the following.
//     * For **strict** Name property values: an empty string.
//     * For name **aliases**: `:CORRECTION` for correction, `:CONTROL` for
//       control, `:ALTERNATE` for alternate, `:FIGMENT` for figment, or
//       `:ABBREVIATION` for abbreviation.
//     * For named character **sequences**: `:SEQUENCE` followed by a sequence
//       of hexes for the tail scalars – the remaining scalar hexes that follow
//       the head scalar. Each tail hex is also preceded by `:` and is stripped
//       of leading `0`s.
//
// For example:
// * The text for `U+0021` Exclamation Mark might look like `EXCLAMATION MARK`,
//   `XCLAMATION MARK`, `CLAMATION MARK`, or so on: depending on how many
//   characters its name shares with its parent entry’s name.
// * The two texts for `U+0000`’s two aliases `NULL` (a control alias) and `NUL`
//   (an abbreviation alias) might look like `NULL:CONTROL`, `ULL:CONTROL`,
//   `LL:CONTROL`, `L:CONTROL`, or `:CONTROL` and `NUL:ABBREVIATION`,
//   `UL:ABBREVIATION`, `L:ABBREVIATION`, or `:ABBREVIATION`: depending on how
//   many characters their names share
//   with their respective parent entries’ names.
// * The texts for the named character sequence `U+0023 U+FE0F U+20E3` Keycap
//    Number Sign might look like `KEYCAP NUMBER SIGN:SEQUENCE:FE0F:20E3`,
//    `KEYCAP NUMBER SIGN:SEQUENCE:FE0F:20E3`, or so on: depending on how many
//    characters its name shares with its parent entry’ name.
//
// The **name-prefix lengths** are a sequence of fixed-length hexes, which
// encodes a vector of unsigned integers. There is one integer for each
// character name, and the texts are lexicographically ordered by their
// character names. Each table entry’s integer is the length of the longest
// common string prefix that is shared between the entry’s name and its parent
// entry’s name.
//
// The **head-scalar vector** is a sequence of fixed-length hexes, which encodes
// a vector of scalar unsigned integers. There is one integer for each character
// name, and the texts are lexicographically ordered by their character names.
// (For named character sequences, the scalars are the sequences’ first
// scalars.)
//
// In this module, “entry index” refers to the ordinal number of a table entry,
// while “pointer” refers to a position inside of the database itself. Both are
// integers that are at least zero.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import IntegerVector from '../integer-vector/';
import VariableSequence from '../var-sequence/';

import fuzzilyFold from '../../fuzzy-fold/';
import {
  fieldSeparator, getNumberFromHex, getCodePointsFromString,
  sliceByLength, collator,
} from '../../string/';
import { getFirst } from '../../iterator/';
import searchAll from '../../binary-search/';

export default class NameTable {
  #numOfEntries;
  #textSequence;
  #namePrefixLengthVector;
  #headScalarVector;

  // `block` must be a string. `directory` must be the directory object for the
  // database’s name-table block.
  constructor (block, directory) {
    const {
      numOfEntries, textSequenceDirectory,
      namePrefixLengthVectorPointer, namePrefixLengthVectorDirectory,
      headScalarVectorPointer, headScalarVectorDirectory,
    } = directory;

    this.#numOfEntries = numOfEntries;

    this.#textSequence =
      // The text-sequence block always starts at the beginning of the
      // name-table block.
      new VariableSequence(
        block.slice(0, textSequenceDirectory.length),
        textSequenceDirectory,
      );

    this.#namePrefixLengthVector =
      IntegerVector.fromSlice(block, numOfEntries,
        namePrefixLengthVectorPointer, namePrefixLengthVectorDirectory,
      );

    this.#headScalarVector =
      IntegerVector.fromSlice(block, numOfEntries,
        headScalarVectorPointer, headScalarVectorDirectory,
      );
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `../fuzzy-fold/` module.
  // Returns a string or `undefined`.
  get (fuzzyName) {
    return getFirst(searchAll(this.#numOfEntries, (entryIndex, resultStack) => {
      // This is `undefined` if `resultStack` is empty,
      // i.e., if the current table entry has no parent,
      // i.e., if the current entry is the root entry.
      // Otherwise, it is the result object that was returned
      // by this callback function during the previous search step.
      const parentResult = resultStack[resultStack.length - 1];

      // Extract data from the current table entry’s text.
      const [ nameSuffix, , ...tailScalarHexArray ] =
        this.#textSequence.get(entryIndex).split(fieldSeparator);

      // Get the prefix length of the parent entry.
      const namePrefixLength = this.#namePrefixLengthVector.get(entryIndex);

      // Use the prefix length of the parent entry to get the longest common
      // prefix string shared between the parent entry’s name and the current
      // entry’s name.
      const parentName = parentResult?.name ?? '';
      const namePrefix = parentName.substring(0, namePrefixLength);

      // Combine that longest common parent-name prefix
      // with the current entry’s name suffix.
      const name = namePrefix + nameSuffix;
      const entryFuzzyName = fuzzilyFold(name);

      if (entryFuzzyName === fuzzyName) {
        // In this case, the current entry matches the given fuzzy name. The
        // search is done: the search callback will return its character, as
        // well as instructions to stop the search, which `searchAll` will then
        // yield to `getFirst`.
        const headScalar = this.#headScalarVector.get(entryIndex);
        const tailScalarArray = tailScalarHexArray.map(getNumberFromHex);
        const value = String.fromCodePoint(headScalar, ...tailScalarArray);
        return { nextDirection: 'done', value };
      }

      else {
        // In this case, the current entry does not match the given fuzzy name.
        // We next determine whether to search in its preceding child entry or
        // in its following child entry. The search callback will return this
        // instruction back to `searchAll`. In addition, the returned object
        // (which includes the current entry’s name) will be pushed into the
        // next search step’s `resultStack` and, in the next search step, will
        // become `parentResult`.
        const comparisonNumber = collator.compare(fuzzyName, entryFuzzyName);
        const nextDirection = comparisonNumber < 0 ? 'before' : 'after';
        return { nextDirection, name };
      }
    }));
  }

  // Gets entries of all names of the given `input` string. It returns an array
  // of name entry pairs, where each pair looks like `[ name, nameType ]`.
  //
  // `name` is a name string. `nameType` is:
  // * `'correction'` when `name` is a correction alias.
  // * `null` when `name` is a strict Name property value.
  // * `'sequence'` when `name` signifies a named character sequence.
  // * `'control'` when `name` is a control alias.
  // * `'alternate'` when `name` is an alternate alias.
  // * `'figment'` when `name` is a figment alias.
  // * `'abbreviation'` when `name` is an abbreviation alias.
  getNameEntries (input) {
    const [ inputHeadScalar, ...inputTailScalarArray ] =
      getCodePointsFromString(input);
    const inputTail = String.fromCodePoint(...inputTailScalarArray);
    const nameEntryArray = [];

    const search = searchAll(this.#numOfEntries, (entryIndex, resultStack) => {
      // Get the head scalar of the current table entry.
      const headScalar = this.#headScalarVector.get(entryIndex);

      // Extract data from the current table entry’s text.
      const [ nameSuffix, upperCaseNameType, ...tailScalarHexArray ] =
        this.#textSequence.get(entryIndex).split(fieldSeparator);

      // This is `undefined` if `resultStack` is empty,
      // i.e., if the current table entry has no parent,
      // i.e., if the current entry is the root entry.
      // Otherwise, it is the name of the parent entry.
      const parentName = resultStack[resultStack.length - 1]?.name ?? '';

      // Get the prefix length of the parent name.
      const namePrefixLength = this.#namePrefixLengthVector.get(entryIndex);

      // Use the prefix length of the parent entry
      // to get the longest common prefix string shared between
      // the parent entry’s name and the current entry’s name.
      const namePrefix = parentName.substring(0, namePrefixLength);

      // Combine that longest common parent-name prefix
      // with the current entry’s name suffix.
      const name = namePrefix + nameSuffix;

      if (headScalar === inputHeadScalar) {
        // In this case, the head scalar of the entry matches that of the
        // `input` string. Now their scalar tails need to be checked.
        const [ nameSuffix, upperCaseNameType, ...tailScalarHexArray ] =
          this.#textSequence.get(entryIndex).split(fieldSeparator);
        const tailScalarArray = tailScalarHexArray.map(getNumberFromHex);
        const characterTail = String.fromCodePoint(...tailScalarArray);

        if (characterTail === inputTail) {
          // In this case, both the entry’s head scalar and its tail scalars
          // match the given character. The search callback will therefore
          // return a result with a `value`, which `searchAll` will yield into
          // `Array.from`.
          const nameType = upperCaseNameType?.toLowerCase() || null;
          const value = [ name, nameType ];
          return { nextDirection: 'beforeAndAfter', name, value };
        }
      }

      // In this case, the entry does not match the given character. The search
      // callback will therefore return instructions to continues searching for
      // matches in both children of the current entry.
      return { nextDirection: 'beforeAndAfter', name };
    });

    return Array.from(search);
  }
}
