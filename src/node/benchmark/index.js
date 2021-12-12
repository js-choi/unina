#!/usr/bin/env -S NODE_OPTIONS='--experimental-specifier-resolution=node' node

// # Database microbenchmark suite
// This module uses an environmental variable `NUM_OF_TIMES`, which is 1000 by
// default. It first creates two query sets: it randomly chooses `NUM_OF_TIMES`
// character names and `NUM_OF_TIMES` randomly chosen characters (choosing only
// names and characters with names that cannot be dynamically generated). It
// then calls `uniname.getString` on all of those names and
// `uniname.getAllNames` on all of those hex-code sequences’ characters.
//
// It also applies `uniname.getString` to a nonexistent name and
// `uniname.getAllNames` to a nonexistent character – also `NUM_OF_TIMES` times
// each.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import extractNameObjects from '../extract/';

import Uniname from '../../main/';
import compileDatabase from '../../main/compile/';

import { hrtime } from 'process';

// Use the NUM_OF_TIMES environmental variable to determine how many times each
// benchmark is run.
const { NUM_OF_TIMES = 1000 } = process.env;

// ## Generation

// This helper generator yields integers (up to `numOfValues` times). The
// integers may range between `0` inclusive and the given `maxValue` exclusive.
function * generateRandomIntegers (numOfValues, maxValue) {
  for (let i = 0; i < numOfValues; i++)
    yield Math.floor(Math.random() * maxValue);
}

// This helper function gets `numOfValues` random values from the given `input`
// array, returning a new array of those values.
function getRandom (input, numOfValues) {
  return [ ...generateRandomIntegers(numOfValues, input.length) ]
    .map(index => input[index]);
}

// This helper function gets the character represented by the given name object.
// For more information about name objects, see `/src/main/name-object/`.
function getNameObjectCharacter (nameObject) {
  const { headScalar, tailScalarArray = [] } = nameObject;
  return String.fromCodePoint(headScalar, ...tailScalarArray);
}

// ## Measurements

// This helper function compares numbers. It is to be used with
// `Array.prototype.sort`. It works with `BigInt`s.
function compareNumbers (value0, value1) {
  return Number(value0 - value1);
}

// This helper function calls the given nullary `callback` and measures how much
// time it takes. It returns a high-resolution time (a `BigInt`).
function measureOnce (callback) {
  const hrtimeValue0 = hrtime.bigint();
  callback();
  const hrtimeValue1 = hrtime.bigint();
  return hrtimeValue1 - hrtimeValue0;
}

// This helper function calls each nullary callback from the given
// `callbackArray` and measures how much time they take. It returns a sorted
// array of high-resolution times (`BigInt`s).
function measureAll (callbackArray) {
  return callbackArray.map(measureOnce).sort(compareNumbers);
}

// ## Analysis

// This helper function takes a sorted array of numbers and returns the number
// that is the quintile at the given ratio (which must be a number between `0`
// and `1`). For instance, to get the 25th percentile (i.e., the first
// quartile), the `ratio` would be 0.25. If there is no position in the array at
// the given ratio, then the number at the lesser adjacent position is given. We
// do not average the numbers because the numbers may be `BigInt`s.
function getQuantile (input, ratio) {
  return input[Math.floor((input.length - 1) * ratio)];
}

// This helper function takes a sorted array of numbers and returns an array of
// five numbers. These numbers are the array’s zeroth, first, second, third, and
// fourth quartiles (i.e., the 0th, 25th, 50th, 75th, and 100th percentiles).
const quartileRatioArray = [ 0.02, 0.25, 0.5, 0.75, 0.98 ];
function getAllQuartiles (input) {
  return quartileRatioArray.map(ratio => getQuantile(input, ratio));
}

// ## Format

// This helper function converts a high-resolution time in nanoseconds (which
// must be a `BigInt`) into a string representing it in microseconds. If the
// input is nullish, then it returns undefined.
const numOfMicrosecondsPerNanosecond = 1000n;
function formatHRTime (hrtimeValue) {
  if (hrtimeValue != null) {
    const numOfNanoseconds = hrtimeValue / numOfMicrosecondsPerNanosecond;
    return `${numOfNanoseconds.toLocaleString()} µs`;
  }
}

// This helper function creates a report from the quartiles of the given sorted
// array `hrtimeArray`, which must contain high-resolution times (`BigInts`).
function formatQuartilesOf (hrtimeArray) {
  return getAllQuartiles(hrtimeArray).map(formatHRTime).join(', ');
}

// Formats a `performanceResults` object into a Markdown table.
// `performanceResults`’s values must be arrays of high-resolution times
// (`BigInts`). Returns a string.
const tableHeader =
  `Operation | 2% | 25% | 50% | 75% | 98%
--- | --: | --: | --: | --: | --:\n`;
const tableColumnSeparator = ' | ';
const tableRowSeparator = '\n';
function formatPerformanceResults (performanceResults) {
  return tableHeader +
    Object.entries(performanceResults)
      .map(([key, hrtimeDeltaArray]) =>
        [ key, ...getAllQuartiles(hrtimeDeltaArray).map(formatHRTime)]
          .join(tableColumnSeparator))
      .join(tableRowSeparator);
}

// ## Script

(async function main () {
  try {
    console.log(`🚂 Running benchmark…`);

    // Extract name objects from the UCD source files.
    const nameObjectArray = await extractNameObjects();

    // Measure baseline memory usage.
    const memoryResults0 = process.memoryUsage();

    // Compile the Uniname database object.
    const database = compileDatabase(nameObjectArray);
    const uniname = new Uniname(database);

    // Randomly choose valid names and valid characters from the name objects.
    const numOfValidNames = NUM_OF_TIMES;
    const validNameArray = getRandom(nameObjectArray, numOfValidNames)
      .map(nameObject => nameObject.name);

    const numOfValidCharacters = NUM_OF_TIMES;
    const validCharacterArray = getRandom(nameObjectArray, numOfValidCharacters)
      .map(getNameObjectCharacter);

    // Randomly create invalid names and characters.
    const maxNumOfInvalidSuffixes = 0x1000;

    const numOfInvalidNames = NUM_OF_TIMES;
    const invalidNamePrefix = 'invalid name-';
    const invalidSuffixes =
      generateRandomIntegers(numOfInvalidNames, maxNumOfInvalidSuffixes);
    const invalidNameArray =
      Array.from(invalidSuffixes).map(suffix => invalidNamePrefix + suffix);

    const numOfInvalidCharacters = NUM_OF_TIMES;
    const randomInvalidScalars =
      generateRandomIntegers(numOfInvalidCharacters, maxInvalidSuffix);
    const invalidCharacterPrefix = 'invalid character-';
    const invalidCharacterArray =
      Array.from(randomInvalidScalars)
        .map(suffix => invalidCharacterPrefix + suffix);

    // Measure performance.
    const performanceResults = {
      'Character for valid name': measureAll(
        validNameArray.map(name => () => uniname.getString(name))
      ),
      'No character for invalid name': measureAll(
        invalidNameArray.map(name => () => uniname.getString(name))
      ),
      'Name for valid character': measureAll(
        validCharacterArray.map(character =>
          () => uniname.getNameEntries(character))
      ),
      'No name for invalid character': measureAll(
        invalidCharacterArray.map(character =>
          () => uniname.getNameEntries(character))
      ),
    };

    // Analyze, format, and log the results.
    const performanceReport = formatPerformanceResults(performanceResults);
    console.log(`💎 Benchmark complete.\n\n${performanceReport}\n`);
  }
  catch (err) {
    console.error(err);
  }
})();
