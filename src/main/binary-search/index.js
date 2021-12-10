// # Binary-search utilities
// This universal module exports utilities related to binary search.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

// This helper generator is used by `searchAll`. `minEntryIndex` will never be
// less than `0`, and `maxEntryIndex` will never be less than `minEntryIndex`.
function * search (minEntryIndex, maxEntryIndex, resultStack, callback) {
  if (minEntryIndex < maxEntryIndex) {
    const medianEntryIndex =
      Math.floor((minEntryIndex + maxEntryIndex - 1) / 2);

    const callbackResult = callback(medianEntryIndex, resultStack);
    const { value, nextDirection } = callbackResult;
    const childResultStack = [ ...resultStack, callbackResult ];

    const childrenBeforeMayBeYielded =
      nextDirection === 'before' || nextDirection === 'beforeAndAfter';

    const childrenAfterMayBeYielded =
      nextDirection === 'after' || nextDirection === 'beforeAndAfter';

    if (value != null)
      yield value;

    if (childrenBeforeMayBeYielded)
      yield * search(minEntryIndex, medianEntryIndex, childResultStack, callback);

    if (childrenAfterMayBeYielded)
      yield * search(medianEntryIndex + 1, maxEntryIndex, childResultStack, callback);
  }
}

// This generator performs a binary search on a range of entry index numbers,
// starting at the median entry (rounded less), at the center between the two
// given entry index numbers. The `minEntryIndex` is inclusive and the
// `maxEntryIndex` is exclusive.
//
// At each step of the binary search, it calls the `callback` with two
// arguments:
// 1. The median entry index number at that step.
// 2. A stack (array) of all callback results from the current step’s ancestor
//    entries, starting from the root entry.
//
// The `callback` must return an object `{ nextDirection, value }`. The `value`
// is optional: if it is present and not nullish, then this generator yields
// that `value` at that step.
//
// * When `nextDirection` is `'before'`, then only that entry’s preceding child
//   entry (if any) will be searched next.
// * When `nextDirection` is `'after'`, then only that entry’s following child
//   entry (if any) will be searched next.
// * When `nextDirection` is `'beforeAndAfter'`, then both preceding and
//   following children (if any) will be searched next.
// * When `nextDirection` is any other value, then the search will not search
//   any more descendants of that entry.
//
// The result object may also have other properties, which are saved in the
// stack of callback results but are otherwise ignored by this generator.
export default function * searchAll (numOfEntries, callback) {
  return yield * search(0, numOfEntries, [], callback);
}
