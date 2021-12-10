// # Database compilation
// This universal module exports a function that creates a database of Unicode
// names from the name objects created by the `../name-object/` module. The
// database can then be read by the `../library/` module.
//
// For information on the format of the database, see the documentation in
// `../library/`. For information on name objects, see the documentation in
// `../name-object/`.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import {
  lineSeparator, fieldSeparator, getHexFromNumber,
} from '../../main/string/';

// This helper function creates a line encoding data from a name object.
function createDatabaseLine (nameObject) {
  const { headScalar, name, nameType, tailScalarArray } = nameObject;
  const headScalarHex = getHexFromNumber(headScalar);
  const uppercaseNameType = nameType?.toUpperCase();
  const tailScalarHexArray = tailScalarArray
    ?.map(getHexFromNumber)
    ?.join(fieldSeparator);
  return [ headScalarHex, name, uppercaseNameType, tailScalarHexArray ]
    .filter(field => field)
    .join(fieldSeparator);
}

// This async function compiles Unicode name data into a single string, which
// may be saved to a file. The `nameObjectArrayByScalar` is an array of name
// objects, extracted from the UCD source text by the `../name-object/` module,
// ordered by head scalar.
export default function compileDatabase (nameObjectArrayByScalar) {
  return nameObjectArrayByScalar
    .map(createDatabaseLine)
    .join(lineSeparator);
}
