// # Unit tests for `main/library/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API – or which does not remain stable
// over time as the Unicode Character Database changes.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import compileDatabase from '../../../main/compile/';
import DatabaseLibrary from '../../../main/library/';

test.skip('empty library', () => {
  const nameObjectArray = [];
  const database = compileDatabase(nameObjectArray);
  const library = new DatabaseLibrary(database);
  expect(library.getFromFuzzy('SPACE')).toBeUndefined();
  expect(library.getNameEntries(' ')).toEqual([]);
});

test.skip('fuzzily matching name, with name counter and label name type', () => {
  const character = '\u0000';
  const name = 'CONTROL-0000';
  const fuzzyName = 'CONTROL0000';
  const nameType = 'LABEL';

  const nameObjectArray = [
    { headScalarRangeInitial: character.codePointAt(0),
      nameStem: name,
      nameType },
  ];
  const database = compileDatabase(nameObjectArray);
  const library = new DatabaseLibrary(database);

  expect(library.getFromFuzzy(fuzzyName)).toBe(character);
  expect(library.getNameEntries(character)).toEqual([
    { name, nameType },
  ]);
});

// In names that can be dynamically generated from a name counter (see
// `/src/main/name-counter/`), when their name stems end in an alphanumeric
// character then a hyphen, then that hyphen is insignificant. (Name counters
// *always* begin with letters or numbers and *never* begin with hyphens or
// spaces, so if any name stem precedes a name counter, and if that name stem
// ends with a hyphen, then that hyphen is a medial hyphen, and it is ignorable
// during fuzzy matching.) However, if there is no such name counter, then the
// ending hyphen *is* significant, even if it is preceded by an alphanumeric
// character.
test.skip('fuzzily matching name ending in hyphen without name counter', () => {
  const character = '\u0000';
  const name = 'Z-';
  const nameType = null;

  const nameObjectArray = [
    { headScalarRangeInitial: character.codePointAt(0),
      nameStem: name },
  ];
  const database = compileDatabase(nameObjectArray);
  const library = new DatabaseLibrary(database);

  expect(library.getFrom(fuzzyname)).toBe(character);
  expect(library.getNameEntries(character)).toEqual([
    { name, nameType },
  ]);
});

