// # Unicode Character Database name-object extraction
// This Node module extracts name objects from Unicode Character Database source
// files. The `../compile/` module uses the data from this module to create a
// database object.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import parseNameObjects from '../../main/name-object/';

import { createReadStream } from 'fs';
import readline from 'readline';

// These are paths to the package’s downloaded Unicode Character Database source
// files, relative to the project root directory.
const unicodeDataSourcePath = 'src/ucd/UnicodeData.txt';
const nameAliasesSourcePath = 'src/ucd/NameAliases.txt';
const namedSequencesSourcePath = 'src/ucd/NamedSequences.txt';

// This function reads the source file at the given path and resolves to an
// array of lines.
async function readFileLines (sourcePath) {
  const input = createReadStream(sourcePath);
  const data = [];
  const lineReader = readline.createInterface({input});
  for await (const line of lineReader) {
    data.push(line);
  }
  return data;
}

// Extract Unicode name data into an array of name entries, sorted by first
// scalar.
export default async function extractNameObjects () {
  const [ unicodeDataLines, nameAliasesLines, namedSequencesLines ] =
    await Promise.all(
      [ unicodeDataSourcePath, nameAliasesSourcePath, namedSequencesSourcePath ]
        .map(readFileLines),
    );

  return parseNameObjects({ unicodeDataLines, nameAliasesLines, namedSequencesLines });
}
