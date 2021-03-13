// # Unit tests for random names and named Unicode values
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as RandomUtil from '#js/util/random';
import * as IterableUtil from '#js/util/iterable';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('creating single random integers', () => {
  it('returns integers', () => {
    const maxValue = 10;
    const randomValue = RandomUtil.createInteger(maxValue);

    assert.ok(
      Number.isInteger(randomValue),
    );
  });

  it('returns between 0 and given exclusive maximum', () => {
    const maxValue = 10;
    const randomValue = RandomUtil.createInteger(maxValue);

    assert.ok(
      0 <= randomValue && randomValue < maxValue,
    );
  });
});

describe('generating multiple random integers', () => {
  it('yields given numbers of values', () => {
    const numOfValues = 3;
    const maxValue = 10;
    const randomValueArray = Array.from(
      RandomUtil.genIntegers(numOfValues, maxValue),
    );

    assert.equal(
      randomValueArray.length,
      numOfValues,
    );
  });

  it('yields integer values', () => {
    const numOfValues = 3;
    const maxValue = 10;
    const randomValueArray = Array.from(
      RandomUtil.genIntegers(numOfValues, maxValue),
    );

    assert.ok(
      randomValueArray.every(Number.isInteger),
    );
  });

  it('yields values between 0 and given exclusive maximum', () => {
    const numOfValues = 3;
    const maxValue = 10;
    const randomValueArray = Array.from(
      RandomUtil.genIntegers(numOfValues, maxValue),
    );

    assert.ok(
      randomValueArray.every(randomValue =>
        0 <= randomValue && randomValue < maxValue,
      ),
    );
  });
});

describe('randomly sampling array values', () => {
  it('returns arrays of given length', () => {
    const numOfValues = 3;
    const inputArray = [ 0, 1, 2, 3 ];
    const randomSample = RandomUtil.getArraySample(inputArray, numOfValues);

    assert.equal(
      randomSample.length,
      numOfValues,
    );
  });

  it('returns arrays with values from input arrays', () => {
    const numOfValues = 3;
    const inputArray = [ 0, 1, 2, 3 ];
    const randomSample = RandomUtil.getArraySample(inputArray, numOfValues);

    assert.ok(
      randomSample.every(v => inputArray.includes(v)),
    );
  });
});

describe('randomly sampling array values', () => {
  it('returns arrays of given length', () => {
    const numOfValues = 3;
    const inputArray = [ 0, 1, 2, 3 ];
    const randomSample = RandomUtil.getArraySample(inputArray, numOfValues);

    assert.equal(
      randomSample.length,
      numOfValues,
    );
  });

  it('returns arrays with values from input arrays', () => {
    const numOfValues = 3;
    const inputArray = [ 0, 1, 2, 3 ];
    const randomSample = RandomUtil.getArraySample(inputArray, numOfValues);

    assert.ok(
      randomSample.every(v => inputArray.includes(v)),
    );
  });
});
