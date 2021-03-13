// # Unit tests for iteration utilities
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as IterableUtil from '#js/util/iterable';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('integer ranges', () => {
  it('yields values from an inclusive minimum to an exclusive maximum', () => {
    assert.deepEqual(
      Array.from(IterableUtil.range(3, 7)),
      [ 3, 4, 5, 6 ],
    );
  });
});

describe('getting async iterables → array', () => {
  it('dumps values from sync source', async () => {
    function * genValues () {
      yield 0;
      yield 1;
    }

    assert.deepEqual(
      await IterableUtil.asyncToArray(genValues()),
      [ 0, 1 ],
    );
  });

  it('dumps values from async source', async () => {
    async function * asyncGenValues () {
      yield 0;
      yield 1;
    }

    assert.deepEqual(
      await IterableUtil.asyncToArray(asyncGenValues()),
      [ 0, 1 ],
    );
  });

  it('dumps values from multiple async sources', async () => {
    async function * asyncGenValues () {
      yield 0;
      yield 1;
    }

    assert.deepEqual(
      await IterableUtil.asyncToArray(asyncGenValues(), asyncGenValues()),
      [ 0, 1, 0, 1 ],
    );
  });

  it('rejects when source iteration rejects', async () => {
    const errorMessage = 'XYZ';

    async function * asyncGenValues () {
      throw new Error(errorMessage);
    }

    await assert.rejects(
      () => IterableUtil.asyncToArray(asyncGenValues()),
      { message: errorMessage },
    );
  });
});

describe('grouping iterables into maps', () => {
  it('classifies values based on a keying function', () => {
    const input = [ 0, 1, -1, 2 ];
    const expected = new Map([ [ 0, [ 0 ] ], [ 1, [ 1, -1 ] ], [ 2, [ 2 ] ] ]);
    assert.deepEqual(
      IterableUtil.groupToMap(input, Math.abs),
      expected,
    );
  });
});

describe('getting first value of iterable', () => {
  it('returns first value of input', () => {
    function * genInput () {
      yield 0;
      yield 1;
    }

    assert.equal(
      IterableUtil.getFirst(genInput()),
      0,
    );
  });

  it('returns `undefined` if input is empty', () => {
    function * genInput () {
      // Yield nothing.
    }

    assert.equal(
      IterableUtil.getFirst(genInput()),
      undefined,
    );
  });
});
