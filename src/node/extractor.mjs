// # Unicode Character Database name-range extraction
// This Node module extracts name ranges from [Unicode Character Database
// source files][UCD]. The [`#js/db-compile` module][] can use the data from
// this module to create a database object.
//
// [UCD]: ../ucd/
// [`#js/db-compile` module]: ../js/db-compile.mjs
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as UCDNameRange from '#js/name-range/ucd';
import generateNoncharacterNameRanges from '#js/name-range/noncharacter';
import compareNameRanges from '#js/name-range/comparator';
import { asyncToArray } from '#js/util/iterable';

import * as fs from 'node:fs';
import readline from 'node:readline';

const { readFile } = fs.promises;

// These are paths to the package’s downloaded Unicode Character Database
// source files, relative to the project root directory.
const unicodeDataSourcePath = 'src/ucd/UnicodeData.txt';
const nameAliasesSourcePath = 'src/ucd/NameAliases.txt';
const namedSequencesSourcePath = 'src/ucd/NamedSequences.txt';

// All UCD source files’ lines are delimited by single U+000A Line Feed
// characters.
const ucdLineDelimiter = '\n';

// This function reads the source file at the given path and resolves to an
// array of lines. (All UCD source files’ lines are delimited by single U+000A
// Line Feed characters, which the `node:readline` module supports by default.)
async function readUCDFileLines (sourcePath) {
  const sourceText = await readFile(sourcePath, { encoding: 'utf8'});
  return sourceText.split(ucdLineDelimiter);
}

// Extract Unicode name data into an array of name ranges (see the
// [`#js/name-range/` modules][]), sorted by their initialHeadPoint property.
//
// [`#js/name-range/` modules]: ../js/name-range/README.md
export default async function extractNameRanges () {
  const lineSourcePaths = [
    unicodeDataSourcePath,
    nameAliasesSourcePath,
    namedSequencesSourcePath,
  ];

  const [
    unicodeDataLines,
    nameAliasesLines,
    namedSequencesLines,
  ] = await Promise.all(lineSourcePaths.map(readUCDFileLines));

  const nameRangeArray = await asyncToArray(
    UCDNameRange.asyncFromUnicodeData(unicodeDataLines),
    UCDNameRange.asyncFromNameAliases(nameAliasesLines),
    UCDNameRange.asyncFromNamedSequences(namedSequencesLines),
    generateNoncharacterNameRanges(),
  );

  nameRangeArray.sort(compareNameRanges);

  return nameRangeArray;
}
