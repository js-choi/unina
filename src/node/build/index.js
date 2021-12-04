#!/usr/bin/env -S NODE_OPTIONS='--experimental-specifier-resolution=node' node

// # Database building
// This Node script saves a character-names database to a file called
// `build/database`, relative to the project directory.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import extractNameObjects from '../extract/';

import compileDatabase from '../../main/compile/';

import path from 'path';
import { promises } from 'fs';

const { mkdir, writeFile } = promises;

// These file paths are relative to the project directory.
const buildPath = 'build';
const databaseBuildPath = path.join(buildPath, 'database');

async function main () {
  try {
    console.log(`🔥 Building database…`);
    const nameObjectArray = await extractNameObjects();
    const database = compileDatabase(nameObjectArray);
    await mkdir(buildPath, { recursive: true });
    await writeFile(databaseBuildPath, database);
    console.log(`✨ Wrote names database to ${databaseBuildPath}`);
  }
  catch (err) {
    console.log(err);
  }
}

main();
