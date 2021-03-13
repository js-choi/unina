// # Random names and named Unicode values
// This universal module exports utilities for generating random integers or
// randomly sampling arrays. This is used by the [benchmark
// script][].
//
// [benchmark script]: ../../../script/benchmark.mjs

import * as IterableUtil from '#js/util/iterable';

// This function returns one random integer that may range between `0`
// inclusive and the given `maxValue` exclusive.
export function createInteger (maxValue) {
  return Math.floor(Math.random() * maxValue);
}

// This generator yields integers (up to `numOfValues` times). The integers may
// range between `0` inclusive and the given `maxValue` exclusive.
export function * genIntegers (numOfValues, maxValue) {
  for (const _ of IterableUtil.range(0, numOfValues)) {
    yield createInteger(maxValue);
  }
}

// This function gets `numOfValues` random values from the given `input` array,
// returning a new array of those values.
export function getArraySample (input, numOfValues) {
  return Array.from(genIntegers(numOfValues, input.length))
    .map(index => input[index]);
}
