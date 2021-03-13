// # Unit tests for name utilities
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import { compareEntries } from '#js/name';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// The control name type precedes the label name type.
describe('comparing with different name types', () => {
  it('is negative when former entry is before latter', () => {
    assert.equal(
      compareEntries(
        [ 'SINGLE SHIFT THREE', 'control' ],
        [ 'control-008F', 'label' ],
      ),
      -1,
    );
  });

  it('is positive when former entry is after latter', () => {
    assert.equal(
      compareEntries(
        [ 'control-008F', 'label' ],
        [ 'SINGLE SHIFT THREE', 'control' ],
      ),
      +1,
    );
  });
});

// Space precedes “-” lexicographically.
describe('comparing with different name types', () => {
  it('is negative when former entry is before latter', () => {
    assert.equal(
      compareEntries(
        [ 'SINGLE SHIFT THREE', 'control' ],
        [ 'SINGLE-SHIFT-3', 'control' ],
      ),
      -1,
    );
  });

  it('is positive when former entry is after latter', () => {
    assert.equal(
      compareEntries(
        [ 'SINGLE-SHIFT-3', 'control' ],
        [ 'SINGLE SHIFT THREE', 'control' ],
      ),
      +1,
    );
  });
});

// Space precedes “-” lexicographically.
describe('comparing with identical names and name types', () => {
  it('is zero when entries are equal', () => {
    assert.equal(
      compareEntries(
        [ 'SINGLE SHIFT THREE', 'control' ],
        [ 'SINGLE SHIFT THREE', 'control' ],
      ),
      0,
    );
  });
});
