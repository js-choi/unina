// # Name data from name ranges
// This universal module exports a function that generates data about
// individual names or named Unicode values from name ranges. For information
// on name ranges, see the [name-range readme][].
//
// [name-range readme]: ./README.md
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as NameCounter from '#js/name-counter';
import * as Name from '#js/name';
import { getInteger } from '#js/util/hex';
import * as IterableUtil from '#js/util/iterable';

// **Name data** are objects that contain three properties: the name’s string
// value (e.g., `U+0020`), the name itself (e.g., `'SPACE'`), and the name’s
// type (e.g., null). We use name data for testing.

// This generator function yields data objects for every named Unicode value
// that the given `inputNameRange` covers, ordered by the values’ head points.
// For example, applying this function to the actual name ranges extracted from
// the UCD would result in this array:
//
//     [
//       { value: '\x00', name: 'NULL', nameType: 'control' },
//       { value: '\x00', name: 'CONTROL-0000', nameType: 'label' },
//       { value: '\x00', name: 'NUL', nameType: 'abbreviation' },
//       { value: '\x01', name: 'START OF HEADING', nameType: 'control' },
//       { value: '\x01', name: 'CONTROL-0001', nameType: 'label' },
//       { value: '\x01', name: 'SOH', nameType: 'abbreviation' },
//       { value: '\x02', name: 'START OF TEXT', nameType: 'control' },
//       { value: '\x02', name: 'CONTROL-0002', nameType: 'label' },
//       …
//     ]
export function * genDataObjects (inputNameRange) {
  const {
    initialHeadPoint,
    length = 1,
    tailScalarArray = [],
    nameStem,
    nameCounterType,
    nameType = null,
  } = inputNameRange;

  for (const nameCounterIndex of IterableUtil.range(0, length)) {
    const headPoint = initialHeadPoint + nameCounterIndex;
    const value = String.fromCodePoint(headPoint, ...tailScalarArray);
    const nameCounter = NameCounter.derive(headPoint, nameCounterType);
    const name = nameStem + nameCounter;
    yield { value, name, nameType };
  }
}

// This function converts a `[ value, nameDataArray ]` entry into a sorted `[
// value, nameEntryArray ]` entry, in which each name entry in `nameEntryArray`
// looks like `[ name, nameType ]` (see the [`#js/name-entry` module][]).
//
// [`#js/name-entry` module]: ../name-entry.mjs
function convertValueAndNameDataArrayToNameEntryArray (
  [ value, nameDataArray ],
) {
  const nameEntryArray = nameDataArray
    // Transform the name data objects into name entries.
    .map(({ name, nameType }) => [ name, nameType ])
    // These name entries are not yet guaranteed to be in the same sort
    // order as that which is used by `unina.getNameEntries` (i.e., the
    // [`#js/name` module][]’s `compareEntries` function).
    //
    // [`#js/name` module]: ../name.mjs
    .sort(Name.compareEntries);

  return [ value, nameEntryArray ];
}

// This function converts name data into maps from their named Unicode values
// to sorted arrays of their name entries (see the [`#js/name-entry`
// module][]). For example, applying this function to the actual name ranges
// extracted from the UCD would result in this map:
//
//     Map() {
//       '\x00' ⇒ [
//         [ 'NULL', 'control' ],
//         [ 'CONTROL-0000', 'label' ],
//         [ 'NUL', 'abbreviation' ]
//       ],
//       '\x01' ⇒ [
//         [ 'START OF HEADING', 'control' ],
//         [ 'CONTROL-0001', 'label' ],
//         [ 'SOH', 'abbreviation' ]
//       ],
//       …
//     }
export function groupToMapByValues (inputNameDataArray) {
  const nameDataMap = IterableUtil.groupToMap(
    inputNameDataArray,
    ({ value }) => value,
  );

  return new Map(
    Array.from(nameDataMap).map(([ value, nameDataArray ]) => {
      const nameEntryArray = nameDataArray
        // Transform the name data objects into name entries.
        .map(({ name, nameType }) => [ name, nameType ])
        // These name entries are not yet guaranteed to be in the same sort
        // order as that which is used by `unina.getNameEntries` (i.e., the
        // [`#js/name` module][]’s `compareEntries` function).
        .sort(Name.compareEntries);

      return [ value, nameEntryArray ];
    }),
  );
}
