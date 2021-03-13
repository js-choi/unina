#!/usr/bin/env node --expose-gc

// # Benchmark suites
// This module runs several benchmark suites. It uses a CLI argument, which is
// 1000 by default, to define the number of times that the suite performs each
// operation. It first creates two query sets: it randomly chooses that number
// of Unicode names and that number of randomly chosen named Unicode values. It
// then calls `Unina.get` on all of the names and `Unina.getAllNames` on
// all of the values.
//
// It also applies `Unina.get` to randomly generated nonexistent names and
// `Unina.getAllNames` to randomly generated unnamed Unicode values – also
// the number of times each.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as Timer from '#node/timer';
import extractNameRanges from '#node/extractor';

import compileDatabase from '#js/db-compiler';
import * as NameRangeData from '#js/name-range/name-data';
import * as RandomUtil from '#js/util/random';
import * as IterableUtil from '#js/util/iterable';

// Use the zeroth CLI argument to determine how many times each benchmark suite
// is run.

const [ , , numOfTimesCLIArg ] = process.argv;

const defaultNumOfTimes = 1000;

const numOfTimes = (
  numOfTimesCLIArg
  ? parseInt(numOfTimesCLIArg)
  : defaultNumOfTimes
);

// ## Memory measurement

// This function executes the given callback (which may be async) and measures
// the change in the Node process’s memory usage, using `process.memoryUsage`.
// It returns an object `{ callbackResult, numOfHeapBytes,
// numOfArrayBufferBytes }`. (It forces garbage collection before and after
// executing the callback using `global.gc`, which is available only because
// this script’s shebang line passes the `--expose-gc` option to V8 via Node’s
// CLI.)
async function measureMemoryChange (callback) {
  global.gc();

  // Measure baseline memory usage.
  const memoryData0 = process.memoryUsage();

  // Execute the callback.
  const callbackResult = await callback();

  global.gc();

  // Measure how much memory is used by the Unina module, including its
  // backing database.
  const memoryData1 = process.memoryUsage();
  const numOfHeapBytes =
    memoryData1.heapUsed - memoryData0.heapUsed;
  const numOfArrayBufferBytes =
    memoryData1.arrayBuffers - memoryData0.arrayBuffers;

  return { callbackResult, numOfHeapBytes, numOfArrayBufferBytes };
}

// ## Suite creation
const exclusiveMaxPoint = 0x11_0000;

// This function randomly chooses `numOfTimes` good Unicode names from the
// given `nameDataArray`. It returns an array of names.
function createValidNameSuite (nameDataArray) {
  return RandomUtil
    .getArraySample(nameDataArray, numOfTimes)
    .map(({ name }) => name);
}

// This function randomly chooses `numOfTimes` good Unicode values from the
// given `valueToNameEntriesMap`. It returns an array of values.
function createValidValueSuite (valueToNameEntriesMap) {
  return RandomUtil
    .getArraySample(Array.from(valueToNameEntriesMap), numOfTimes)
    .map(([ value ]) => value);
}

// This function randomly chooses `numOfTimes` bad Unicode names. They look
// like `invalid name-000000`, where `000000` is a random hex. It returns an
// array of these names.
function createInvalidNameSuite () {
  const invalidNamePrefix = 'invalid name-';
  const invalidSuffixes =
    RandomUtil.genIntegers(numOfTimes, exclusiveMaxPoint);
  return Array.from(invalidSuffixes)
    .map(suffix => invalidNamePrefix + suffix);
}

// This function randomly chooses `numOfTimes` bad Unicode values. They look
// like `invalid value-0`, where `0` is a random single-code-point string. It
// returns an array of these values.
function createInvalidValueSuite () {
  const randomPoints =
    RandomUtil.genIntegers(numOfTimes, exclusiveMaxPoint);
  // There is no named Unicode value that starts with this prefix.
  const invalidValuePrefix = 'invalid value-';
  return Array.from(randomPoints)
    .map(suffix => invalidValuePrefix + suffix);
}

// This function randomly chooses good and bad Unicode names and values. It
// returns an object `{ validNameArray, validValueArray, invalidNameArray,
// invalidValueArray }`.
function createSuites (nameRangeArray) {
  // This is an array of data entries for every single Unicode name, each
  // of the form `{ value, name, nameType }`:
  //
  //     [
  //       { value: '\x00', name: 'NULL', nameType: 'control' },
  //       { value: '\x00', name: 'CONTROL-0000', nameType: 'label' },
  //       { value: '\x00', name: 'NUL', nameType: 'abbreviation' },
  //       …
  //     ]
  const nameDataArray = nameRangeArray
    .map(nameRange => Array.from(NameRangeData.genDataObjects(nameRange)))
    .flat();

  // This is a map from named string values to arrays of sorted name
  // entries:
  //
  //     Map() {
  //       '\x00' ⇒ [
  //         [ 'NULL', 'control' ],
  //         [ 'CONTROL-0000', 'label' ],
  //         [ 'NUL', 'abbreviation' ]
  //       ],
  //       …
  //     }
  const valueToNameEntriesMap =
    NameRangeData.groupToMapByValues(nameDataArray);

  return {
    validNameArray: createValidNameSuite(nameDataArray),
    validValueArray: createValidValueSuite(valueToNameEntriesMap),
    invalidNameArray: createInvalidNameSuite(),
    invalidValueArray: createInvalidNameSuite(),
  };
}

// ## Suite execution

// This async function runs the given `callback` for each element from
// `inputArray`. It returns an array of high-resolution durations.
async function runSuite (inputArray, callback) {
  const nullaryCallbackArray = inputArray.map(element =>
    () => callback(element));
  const measurementArray = await Timer.measureAll(nullaryCallbackArray);
  return measurementArray.map(([ , hrDuration ]) => hrDuration);
}

// ## Analysis

// This function takes a sorted array of numbers and returns the number that is
// the quintile at the given ratio (which must be a number between `0` and
// `1`). For instance, to get the 25th percentile (i.e., the first quartile),
// the `ratio` would be 0.25. If there is no position in the array at the given
// ratio, then the number at the lesser adjacent position is given. We do not
// average the numbers because the numbers may be `BigInt`s.
function getQuantile (input, ratio) {
  return input[Math.floor((input.length - 1) * ratio)];
}

// This function takes a sorted array of numbers and returns an array of five
// numbers. These numbers are the array’s zeroth, first, second, third, and
// fourth quartiles (i.e., the 0th, 25th, 50th, 75th, and 100th percentiles).
const quartileRatioArray = [ 0.02, 0.25, 0.5, 0.75, 0.98 ];
function getAllQuartiles (input) {
  return quartileRatioArray.map(ratio => getQuantile(input, ratio));
}

// ## Formatting

// This function formats a number of bytes into megabytes.
const numOfBytesPerMegabyte = 10 ** 6;
function formatByteToMB (numOfBytes) {
  const numOfMB = numOfBytes / numOfBytesPerMegabyte;
  return `${ numOfMB.toLocaleString() } MB`;
}

// This function formats memory results into a Markdown string.
function formatMemoryResults (numOfHeapBytes, numOfArrayBufferBytes) {
  return `* Heap: ${
    formatByteToMB(numOfHeapBytes)
  }\n* Array buffers: ${
    formatByteToMB(numOfArrayBufferBytes)
  }`;
}

// This function creates a report from the quartiles of the given sorted array
// `hrTimeArray`, which must contain high-resolution times (`BigInts`).
function formatQuartilesOf (hrTimeArray) {
  return getAllQuartiles(hrTimeArray)
    .map(Timer.formatInMicroseconds)
    .join(', ');
}

// These constants are used by `formatHRTimeStatisticsTable`.
const statisticsTableHeader =
  `Operation | 2% | 25% | 50% | 75% | 98%
--- | --: | --: | --: | --: | --:\n`;
const statisticsTableColumnSeparator = ' | ';
const statisticsTableRowSeparator = '\n';

// This function formats a `timeResults` object into a Markdown table string.
// `timeResults`’s values must be arrays of high-resolution times (`BigInts`).
// Returns a string.
function formatHRTimeStatisticsTable (timeResults) {
  return statisticsTableHeader +
    Object.entries(timeResults)
      .map(([key, hrTimeDeltaArray]) =>
        [
          key,
          ...getAllQuartiles(hrTimeDeltaArray).map(Timer.formatInMicroseconds),
        ].join(statisticsTableColumnSeparator))
      .join(statisticsTableRowSeparator);
}

// ## Main

try {
  const [ completionReport, completionHRDuration ] =
    await Timer.measureOnce(async () => {
      console.log(`🌱 Initializing Unina…\n`);

      // Time how long the `unina` module takes to load, and measure its
      // memory usage.
      const {
        callbackResult: [ Unina, compilationHRTime ],
        numOfHeapBytes,
        numOfArrayBufferBytes,
      } = await measureMemoryChange(() =>
        Timer.measureOnce(() =>
          import('unina')));

      // Extract name ranges from the UCD source files.
      const nameRangeArray = await extractNameRanges();

      // Create the benchmark suites.
      const {
        validNameArray,
        validValueArray,
        invalidNameArray,
        invalidValueArray,
      } = createSuites(nameRangeArray);

      // Analyze, format, and log compilation results.
      console.log(
        `\n✨ Compilation complete after ${
          Timer.formatInMicroseconds(compilationHRTime)
        }.\n\n\nLibrary memory usage:\n${
          formatMemoryResults(numOfHeapBytes, numOfArrayBufferBytes)
        }\n`,
      );

      // Start benchmark suites.
      console.log(
        `🚂 Running benchmark suite (${
          numOfTimes.toLocaleString()
        } times per operation)…`,
      );

      // Run the benchmark suites and measure their time performance.
      const timeResults = {
        'Valid N → V':
          await runSuite(validNameArray, Unina.get),
        'Invalid N → no V':
          await runSuite(invalidNameArray, Unina.get),
        'Named V → N':
          await runSuite(validValueArray, Unina.getNameEntries),
        'Unnamed V → no N':
          await runSuite(invalidValueArray, Unina.getNameEntries),
      };

      // Format the benchmark suite’s results into a completion report and
      // return the report from this timer callback.
      return formatHRTimeStatisticsTable(timeResults);
    });

  // Print the final results.
  console.log(
    `💎 Benchmark suites complete after ${
      Timer.formatInSeconds(completionHRDuration)
    }.\n\n${
      completionReport
    }\n`
  );
}
catch (err) {
  console.error(err);
}
