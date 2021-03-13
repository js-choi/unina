// # Iteration utilities
// This universal module exports functions that process sequential data that
// use the `Symbol.iterator` or `Symbol.asyncIterator` standard interfaces. It
// is expected that much of this code will be eventually replaced by built-in
// language functions, once they are standardized by TC39.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

// This generator function yields integers starting at the given inclusive
// minimum and ending right before the given exclusive maximum.
export function * range (inclusiveMin, exclusiveMax) {
  for (let value = inclusiveMin; value < exclusiveMax; value ++) {
    yield value;
  }
}

// This function dumps the given sources, which each must be a sync/async
// iterable, and returns an array of all their yielded results.
export async function asyncToArray (...sourceArray) {
  const result = [];
  for (const source of sourceArray) {
    for await (const value of source) {
      result.push(value);
    }
  }
  return result;
}

// This function puts the values yielded by `source`, which must be a sync
// iterable, into a new map, based on the results of the given `keyFn` on each
// of `source`’s values.
export function groupToMap (source, keyFn) {
  const m = new Map;
  for (const value of source) {
    const key = keyFn(value);
    if (!m.has(key)) {
      // In this case, this is the first time that `keyFn` has returned this
      // particular `key`, so we create a new array for that `key` in `m`.
      m.set(key, []);
    }
    m.get(key).push(value);
  }
  return m;
}

// This function consumes the given `iterable` and returns its first yielded
// value.
export function getFirst (iterable) {
  for (const value of iterable)
    return value;
}
