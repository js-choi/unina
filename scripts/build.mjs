#!/usr/bin/env node

// # Library building
// This Node script bundles the core module, its dependencies, and a database
// of Unicode names, into a single JavaScript file `build/unina.mjs`. (It
// also creates a file for the database alone.)
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as Timer from '#node/timer';
import extractNameRanges from '#node/extractor';

import * as esbuild from 'esbuild';

import path from 'node:path';
import * as fs from 'node:fs';

const { rm, mkdir, writeFile } = fs.promises;

// These file paths are relative to the project directory.
const esInputPath = 'src/js/main.mjs';
const outputPath = 'build/';
const databaseOutputFilename = 'database.json';
const esOutputFilename = 'unina.mjs';
const esOutputPath = path.join(outputPath, esOutputFilename);
const databaseOutputPath = path.join(outputPath, databaseOutputFilename);

// This async function removes the file or directory at the given
// `directoryPath`, if it exists. If it does not exist, it does nothing.
async function removeIfExists (filePath) {
  try {
    await rm(filePath, { recursive: true });
  }

  catch (err) {
    // If the `err` is due to the given file not existing (i.e., its code is
    // `'ENOENT'`), then this function returns normally as a no-op.
    if (err.code !== 'ENOENT') {
      // In this case, an unexpected error due to another cause occurred.
      throw err;
    }
  }
}

// This function prepares the build directory.
async function prepareDirectory () {
  await removeIfExists(outputPath);
  await mkdir(outputPath, { recursive: true });
}

// This async function tries to compile the database and saves it to a file,
// which may be imported with `#build/database`.
async function buildDatabase () {
  try {
    console.log(`🔨 Building database…`);

    // Compile the database while timing its duration.
    const [ database, compilationHRDuration ] =
      await Timer.measureOnce(async () => {
        const sortedNameRangeArray = await extractNameRanges();
        return sortedNameRangeArray;
      });

    await writeFile(databaseOutputPath, JSON.stringify(database));
    console.log(
      `✨ Wrote names database to ${
        databaseOutputPath
      } after ${
        Timer.formatInSeconds(compilationHRDuration)
      }.`,
    );
  }

  catch (err) {
    console.error(
      `❌ Could not write database to ${ databaseOutputPath }.`,
      err,
    );
  }
}

// See [esbuild’s documentation about its build API][esbuild build API].
//
// [esbuild build API]: https://esbuild.github.io/api/#build-api
const esbuildConfig = {
  entryPoints: [ esInputPath ],
  bundle: true,
  outfile: esOutputPath,
  format: 'esm',
  minify: true,
  sourcemap: true,
};

// This async function tries to bundle and minify the library’s main module.
async function buildESModule () {
  try {
    console.log(`🔨 Building ES module…`);
    await esbuild.build(esbuildConfig);
    console.log(`✨ Wrote ES module to ${ esOutputPath }.`);
  }

  catch (err) {
    console.error(
      `❌ Could not build ES module to ${ esOutputPath }.`,
      err,
    );
  }
}

await prepareDirectory();

await buildDatabase();
console.log();

await buildESModule();
console.log();
