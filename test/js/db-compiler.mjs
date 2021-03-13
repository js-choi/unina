// # Unit tests for database compiler
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import compileDatabase from '#js/db-compiler';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('database compiler', () => {
  it('compiles zero name ranges', () => {
    const nameRangeArray = [];
    assert.deepEqual(
      compileDatabase(nameRangeArray),
      [],
    );
  });

  it('compiles one name range', () => {
    const nameRangeArray = [ {} ];
    assert.deepEqual(
      compileDatabase(nameRangeArray),
      [ {} ],
    );
  });
});
