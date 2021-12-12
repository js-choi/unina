// # Unit tests for `main/iterator/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API – or which does not remain stable
// over time as the Unicode Character Database changes.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import { toArrayAsync, mapAsync, concatAsync } from '../../../main/iterator/';

test('toArrayAsync', async () => {
  async function * asyncGenThree () {
    yield 0;
    yield 1;
    yield 2;
  }

  async function * asyncGenError () {
    throw new Error;
  }

  await expect(toArrayAsync(asyncGenThree()))
    .resolves.toEqual([ 0, 1, 2 ]);

  await expect(toArrayAsync(asyncGenError()))
    .rejects.toThrow();
});

test('mapAsync', async () => {
  async function * asyncGenThree () {
    yield 0;
    yield 1;
    yield 2;
  }

  async function mapFn (input) {
    return input * 2;
  }

  await expect(toArrayAsync(mapAsync(asyncGenThree(), mapFn)))
    .resolves.toEqual([ 0, 2, 4 ]);
});

test('concatAsync', async () => {
  async function * asyncGenThree () {
    yield 0;
    yield 1;
    yield 2;
  }

  async function * asyncGenError () {
    throw new Error;
  }

  await expect(toArrayAsync(concatAsync(asyncGenThree(), asyncGenThree())))
    .resolves.toEqual([ 0, 1, 2, 0, 1, 2 ]);

  await expect(toArrayAsync(concatAsync(asyncGenThree(), asyncGenError())))
    .rejects.toThrow();
});
