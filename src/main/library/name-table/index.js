// # Database-library name table
// This universal module exports a class that reads a database name table,
// compiled into a string.
//
// The **name table** is a string that encodes an indexed, randomly accessible
// table of name data that is lexicographically sorted by name. The table is
// also equivalent to a **binary search tree** that is rooted at the median
// table entry (the **root entry**).
//
// The table contains the following blocks:
// 1. Text sequence (variable-length strings)
// 2. Head-scalar vector (integers)
//
// The **text sequence** is a sequence of variable-length texts. There is one
// text for each character name, and the texts are lexicographically ordered by
// their character names. Each text looks like: `‹name›‹nameInfo›`.
//
// * The **`‹name›`** is a character name, in all caps, and using spaces
//   and `-`.
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
// * The text for `U+0021` Exclamation Mark is `EXCLAMATION MARK`.
// * The two texts for `U+0000`’s two aliases `NULL` (a control alias) and
//   `NUL` (an abbreviation alias) are `NULL:CONTROL` and `NUL:ABBREVIATION`.
// * The texts for the named character sequence `U+0023 U+FE0F U+20E3`
//   Keycap Number Sign is `KEYCAP NUMBER SIGN:SEQUENCE:FE0F:20E3`.
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
  #headScalarVector;

  // `block` must be a string. `directory` must be the directory object for the
  // database’s name-table block.
  constructor (block, directory) {
    const {
      numOfEntries, textSequenceDirectory,
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

    this.#headScalarVector =
      IntegerVector.fromSlice(block, numOfEntries,
        headScalarVectorPointer, headScalarVectorDirectory,
      );
  }

  // Attempts to find a character with the given name in the database. The name
  // must already have been fuzzily folded with the `../fuzzy-fold/` module.
  // Returns a string or `undefined`.
  get (fuzzyName) {
    return getFirst(searchAll(this.#numOfEntries, entryIndex => {
      const [ name, , ...tailScalarHexArray ] =
        this.#textSequence.get(entryIndex).split(fieldSeparator);
      const entryFuzzyName = fuzzilyFold(name);

      if (entryFuzzyName === fuzzyName) {
        // In this case, the current entry matches the given fuzzy name. The
        // search is done: the search callback will return its character, as
        // well as instructions to stop the search, which `searchAll` will then
        // yield to `getFirst`.
        const headScalar = this.#headScalarVector.get(entryIndex);
        const tailScalarArray = tailScalarHexArray.map(getNumberFromHex);
        const value = String.fromCodePoint(headScalar, ...tailScalarArray);
        // There is no `nextDirection` in this object, which means that no
        // descendants of the current entry will be searched.
        return { value };
      }

      else {
        // In this case, the current entry does not match the given fuzzy name.
        // We next determine whether to search in its preceding child entry or
        // in its following child entry. The search callback will return this
        // instruction back to `searchAll`.
        const comparisonNumber = collator.compare(fuzzyName, entryFuzzyName);
        const nextDirection = comparisonNumber < 0 ? 'before' : 'after';
        return { nextDirection };
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

    return Array.from(searchAll(this.#numOfEntries, entryIndex => {
      const entryHeadScalar = this.#headScalarVector.get(entryIndex);

      if (entryHeadScalar === inputHeadScalar) {
        // In this case, the head scalar of the entry matches that of the
        // `input` string. Now their scalar tails need to be checked.
        const [ name, upperCaseNameType, ...tailScalarHexArray ] =
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
          return { nextDirection: 'beforeAndAfter', value };
        }
      }

      // In this case, the entry does not match the given character. The search
      // callback will therefore return instructions to continues searching for
      // matches in both children of the current entry.
      return { nextDirection: 'beforeAndAfter' };
    }));
  }
}
