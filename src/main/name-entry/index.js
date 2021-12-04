// # Unicode Character Database name entries
// This universal module exports a function that for comparing name entries.
//
// A name entry is an array pair that looks like `[ name, nameType ]`, where
// `name` is an ASCII string and `nameType` is one of the name-type values
// defined in the `../name-type/`
//
// Name objects are sorted first by `nameType` (as per the `compareNameTypes`
// function from the '../name-type/' module), then lexicographically by `name`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { compareNameTypes } from '../name-type/';
import { collator } from '../string/';

// Compares two name entries by order of name-type preference – then
// lexicographically by name.
export function compareNameEntries (nameEntry0, nameEntry1) {
  const [ name0, nameType0 ] = nameEntry0;
  const [ name1, nameType1 ] = nameEntry1;
  return compareNameTypes(nameType0, nameType1)
    || collator.compare(name0, name1);
}
