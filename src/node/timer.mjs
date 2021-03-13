// # Performance timing
// This Node module measures time that elapses during function calls.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import { hrtime } from 'node:process';

// This async function calls the given nullary `callback` (which may be async)
// and measures how much time it takes. It returns an array pair of the
// callback’s result then a high-resolution time (a `BigInt`).
export async function measureOnce (callback) {
  const hrTimeValue0 = hrtime.bigint();
  const callbackResult = await callback();
  const hrTimeValue1 = hrtime.bigint();
  const hrDuration = hrTimeValue1 - hrTimeValue0;
  return [ callbackResult, hrDuration ];
}

// This async function sequentially calls each nullary callback (which each may
// be async) from the given `callbackArray` and measures how much time they
// take. It returns a sorted array of array pairs, each of which contains the
// callback’s result then a high-resolution time (`BigInt`).
export async function measureAll (callbackArray) {
  const measurementArray = [];
  for await (const callback of callbackArray) {
    const measurement = await measureOnce(callback);
    measurementArray.push(measurement);
  }
  measurementArray.sort(([ , hrDuration0 ], [ , hrDuration1 ]) =>
    Number(hrDuration0 - hrDuration1));
  return measurementArray;
}

// This function converts a high-resolution time in nanoseconds (which must be
// a `BigInt`) into a string representing it in microseconds. If the input is
// nullish, then it returns `undefined`.
const numOfNanosecondsPerMicrosecond = 1_000n;
export function formatInMicroseconds (hrTimeValue) {
  if (hrTimeValue != null) {
    const numOfMicroseconds = hrTimeValue / numOfNanosecondsPerMicrosecond;
    return `${ numOfMicroseconds.toLocaleString() } µs`;
  }
}

// This function converts a high-resolution time in nanoseconds (which must be
// a `BigInt`) into a string representing it in minutes. If the input is
// nullish, then it returns `undefined`.
const numOfNanosecondsPerSecond = 1_000_000_000n;
export function formatInSeconds (hrTimeValue) {
  if (hrTimeValue != null) {
    const numOfSeconds = hrTimeValue / numOfNanosecondsPerSecond;
    // If the number of seconds is less than one, then `numOfSeconds` will be
    // `0n`, due to rounding down. In this case, we should display “< 1 s”
    // instead of “0 s”.
    const displayedNumOfSeconds = numOfSeconds >= 1n ? numOfSeconds : '< 1';
    return `${ displayedNumOfSeconds.toLocaleString() } s`;
  }
}
