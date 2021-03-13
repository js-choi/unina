// # Comparing name ranges
// This universal module exports a function that compares name ranges for
// sorting. For information on name ranges, see the [name-range readme][].
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

// This comparator function stringifies the two optional arrays and then
// lexicographically compares them. Because of this, if exactly one of the
// optional arrays is nullish, then it precedes the other array.
function compareArrays (array0, array1) {
  return String(array0).localeCompare(String(array1));
}

// This function determines how name ranges are sorted. It compares two name
// ranges and returns a negative number, `0`, or a positive number. See the
// overview of this module for more information on the sorting algorithm.
export default function compare (nameRange0, nameRange1) {
  return nameRange0.initialHeadPoint - nameRange1.initialHeadPoint
    || compareArrays(nameRange0.tailScalarArray, nameRange1.tailScalarArray)
    || Name.compareTypes(nameRange0.nameType, nameRange1.nameType);
}
