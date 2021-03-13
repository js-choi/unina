// # Unit tests for performance timing
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as Timer from '#node/timer';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('measuring time once', () => {
  it('returns callback results', async () => {
    const expectedValue = 1;
    const [ actualValue ] = await Timer.measureOnce(async () => expectedValue);

    assert.equal(
      actualValue,
      expectedValue,
    );
  });

  it('returns high-resolution durations', async () => {
    const [ , hrDuration ] = await Timer.measureOnce(async () => null);

    assert.ok(
      hrDuration > 0n,
    );
  });
});

describe('measuring time multiple times', () => {
  it('returns callbacks’ results', async () => {
    const expectedValue = 1;
    const callback = async () => expectedValue;
    const actualValueArray =
      (await Timer.measureAll([ callback, callback ]))
        .map(([ value ]) => value);

    assert.deepEqual(
      actualValueArray,
      [ expectedValue, expectedValue ],
    );
  });

  it('returns high-resolution durations', async () => {
    const expectedValue = 1;
    const callback = async () => expectedValue;
    const hrDurationArray =
      (await Timer.measureAll([ callback, callback ]))
        .map(([ , hrDuration ]) => hrDuration);

    assert.ok(
      hrDurationArray.every(hrDuration => hrDuration > 0n),
    );
  });
});

describe('formatting high-resolution times in microseconds', () => {
  it('returns microsecond strings for BigInt inputs', () => {
    assert.equal(
      Timer.formatInMicroseconds(100_000n),
      '100 µs',
    );
  });

  it('returns undefined for nullish inputs', () => {
    assert.equal(
      Timer.formatInMicroseconds(),
      undefined,
    );
  });
});

describe('formatting high-resolution times in seconds', () => {
  it('returns second strings for inputs larger than 1 second', () => {
    assert.equal(
      Timer.formatInSeconds(10_000_000_000n),
      '10 s',
    );
  });

  it('returns “< 1 s” for inputs smaller than 1 second', () => {
    assert.equal(
      Timer.formatInSeconds(100_000n),
      '< 1 s',
    );
  });

  it('returns undefined for nullish inputs', () => {
    assert.equal(
      Timer.formatInSeconds(),
      undefined,
    );
  });
});
