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

// This helper function consumes the given `iterable`
// and returns a `Map`.
// Each key of the `Map` is a value that was yielded by the `iterable`.
// Each value of the `Map` is an integer:
// how many times its key was yielded by the `iterable`.
export function getFrequencies (iterable) {
  const frequencyMap = new Map;
  for (const value of iterable)
    frequencyMap.set(value, (frequencyMap.get(value) ?? 0) + 1);
  return frequencyMap;
}

// This helper generator `yield`s integers between `minNum` inclusive and
// `maxNum` exclusive.
export function * generateRange (minNum, maxNum) {
  for (let i = minNum; i < maxNum; i++)
    yield i;
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

// This helper generator yields arrays
// that are made of values from the given `input` generator.
// The arrays each have length 2
// and consist of each consecutive overlapping pair of values.
// If the `input` generator yields only 0 or 1 values before ending,
// then this will yield nothing.
export function * generatePairs (input) {
  let numOfPreviousValues = 0, previousValue;
  for (const value of input) {
    if (numOfPreviousValues >= 1)
      yield [ previousValue, input ];
    numOfPreviousValues++;
  }
}

// This helper generator yields arrays
// that are made of values from the given `input` generator.
// The arrays each have length 2
// and consist of each consecutive overlapping pair of values.
// If the `input` generator yields only 0 or 1 values before ending,
// then this will yield nothing.
export function * overlapPairs (input) {
  let numOfPreviousValues = 0, previousValue;
  for (const value of input) {
    if (numOfPreviousValues >= 1)
      yield [ previousValue, value ];
    previousValue = value;
    numOfPreviousValues++;
  }
}
