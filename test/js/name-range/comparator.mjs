// # Unit tests for generating name ranges from UCD files
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import compareNameRanges from '#js/name-range/comparator';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('comparing name ranges', () => {
  it('equivalent singleton single-point ranges', () => {
    const nameRange0 = {
      initialHeadPoint: 0x20,
      nameStem: 'SPACE',
    };
    const nameRange1 = {
      initialHeadPoint: 0x20,
      nameStem: 'SPACE',
    };
    assert.equal(
      compareNameRanges(nameRange0, nameRange1),
      0,
    );
  });
});
