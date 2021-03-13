// # Database compilation
// This universal module exports a function that creates a database of Unicode
// names from the name ranges created by the `name-range` module. The database
// can then be read by the [`#js/db-reader` module][].
//
// For information on the format of the database, see [the format’s
// documentation][database format]. For information on name ranges, see the
// [name-range readme][].
//
// [`#js/db-reader` module]: ./db-reader.mjs
// [database format]: ./README.md#database-format
// [name-range readme]: ./name-range/README.md
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

// This async function compiles Unicode name data into a database. The
// `nameRangeArray` is an array of name ranges created by the
// [`#js/name-range/` modules][], ordered with the [`#js/name-range/comparator`
// module][].
//
// [`#js/name-range/` modules]: ./name-range/README.md
// [`#js/name-range/comparator` module]: ./name-range/comparator.mjs
export default function compile (nameRangeArray) {
  return nameRangeArray;
}
