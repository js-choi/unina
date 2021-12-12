// # Database compilation
// This universal module exports a function that creates a database of Unicode
// names from the name objects created by the `/src/main/name-object/` module.
// The database can then be read by the `/src/main/library/` module.
//
// For information on the format of the database, see the documentation in
// `/src/main/library/`. For information on name objects, see the documentation
// in `/src/main/name-object/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// This async function compiles Unicode name data into a single string, which
// may be saved to a file. The `nameObjectArrayByScalar` is an array of name
// objects, extracted from the UCD source text by the `/src/main/name-object/`
// module, ordered by head scalar.
export default function compileDatabase (nameObjectArrayByScalar) {
  return JSON.stringify(nameObjectArrayByScalar);
}
