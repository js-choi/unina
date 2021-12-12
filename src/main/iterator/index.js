// # Iterator utilities
// This universal module exports generators that process sequential data, both
// synchronously and asynchronously.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// This helper function consumes the given `input` and returns a promise that
// will resolve to an array of the input’s values (or which will reject if the
// `input`’s iterator rejects).
export async function toArrayAsync (input) {
  const arr = [];
  for await (const value of input)
    arr.push(value);
  return arr;
}

// This helper function consumes the given `input`, applies the given `mapFn`
// to each value, and yields each result sequentially and asynchronously.
export async function * mapAsync (input, mapFn) {
  for await (const value of input)
    yield await mapFn(value);
}

// This helper function consumes the given `input`s and yields each of their
// items sequentially and asynchronously.
export async function * concatAsync (...inputArray) {
  for await (const input of inputArray)
    yield * input;
}
