// # Iterator utilities
// This universal module exports generators that process sequential data.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// This helper function consumes the given `iterable` and returns its first
// yielded value.
export function getFirst (iterable) {
  for (const value of iterable)
    return value;
}

// This helper generator yields values from the given `input` iterable until
// `input` ends or `input` yields the given `endingValue`. It will not yield the
// `endingValue` itself.
export function * until (input, endingValue) {
  for (const value of input) {
    if (value !== endingValue)
      yield value;
    else
      break;
  }
}
