// # Unit tests for `main/name-entry/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import searchAll from '../../../main/binary-search/';

import { jest } from '@jest/globals';

test('zero entries', () => {
  const numOfEntries = 0;
  const searchCallback = jest.fn();
  const search = searchAll(numOfEntries, searchCallback);
  expect(Array.from(search)).toEqual([]);
  expect(searchCallback.mock.calls.length).toBe(0);
});

describe('one entry', () => {
  test('search before median without yields', () => {
    const numOfEntries = 1;
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before' });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search before median with yields', () => {
    const numOfEntries = 1;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search after median without yields', () => {
    const numOfEntries = 1;
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after' });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search after median with yields', () => {
    const numOfEntries = 1;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search before+after median without yields', () => {
    const numOfEntries = 1;
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter' });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search before+after median with yields', () => {
    const numOfEntries = 1;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('stop at median without yields', () => {
    const numOfEntries = 1;
    const searchCallback = jest.fn()
      .mockReturnValueOnce({});
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('stop at median with yields', () => {
    const numOfEntries = 1;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });
});

describe('two entries', () => {
  test('search before median', () => {
    const numOfEntries = 2;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });

  test('search after median', () => {
    const numOfEntries = 2;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
      [ 1 ],
    ]);
  });

  test('search before+after median', () => {
    const numOfEntries = 2;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
      [ 1 ],
    ]);
  });

  test('stop at median', () => {
    const numOfEntries = 2;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 0 ],
    ]);
  });
});

describe('three entries', () => {
  test('search before median', () => {
    const numOfEntries = 3;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 0 ],
    ]);
  });

  test('search after median', () => {
    const numOfEntries = 3;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 2 ],
    ]);
  });

  test('search before+after median', () => {
    const numOfEntries = 3;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 0 ],
      [ 2 ],
    ]);
  });

  test('stop at median', () => {
    const numOfEntries = 3;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
    ]);
  });
});

describe('four entries', () => {
  test('search before median', () => {
    const numOfEntries = 4;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 0 ],
    ]);
  });

  test('search after median', () => {
    const numOfEntries = 4;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 2 ],
    ]);
  });

  test('search before+after median', () => {
    const numOfEntries = 4;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
      [ 0 ],
      [ 2 ],
    ]);
  });

  test('stop at median', () => {
    const numOfEntries = 4;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 1 ],
    ]);
  });
});

describe('five entries', () => {
  test('search before median then not after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
    ]);
  });

  test('search before median then after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 })
      .mockReturnValueOnce({ nextDirection: 'after', value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
      [ 1 ],
    ]);
  });

  test('search before median then before+after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'before', value: value0 })
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
      [ 1 ],
    ]);
  });

  test('search after median but not after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ value: value1 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 3 ],
    ]);
  });

  test('search after median then after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ nextDirection: 'after', value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 3 ],
      [ 4 ],
    ]);
  });

  test('search after median then before+after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'after', value: value0 })
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 3 ],
      [ 4 ],
    ]);
  });

  test('search before+after median then not after then not after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ value: value1 })
      .mockReturnValueOnce({ value: value2 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
      [ 3 ],
    ]);
  });

  test('search before+after median then not after then after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const value3 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ value: value1 })
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value2 })
      .mockReturnValueOnce({ value: value3 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2, value3 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
      [ 3 ],
      [ 4 ],
    ]);
  });

  test('search before+after median then after then not after', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const value1 = Symbol();
    const value2 = Symbol();
    const value3 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ nextDirection: 'beforeAndAfter', value: value0 })
      .mockReturnValueOnce({ nextDirection: 'after', value: value1 })
      .mockReturnValueOnce({ value: value2 })
      .mockReturnValueOnce({ value: value3 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0, value1, value2, value3 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
      [ 0 ],
      [ 1 ],
      [ 3 ],
    ]);
  });

  test('stop at median', () => {
    const numOfEntries = 5;
    const value0 = Symbol();
    const searchCallback = jest.fn()
      .mockReturnValueOnce({ value: value0 });
    const search = searchAll(numOfEntries, searchCallback);
    expect(Array.from(search)).toEqual([ value0 ]);
    expect(searchCallback.mock.calls).toEqual([
      [ 2 ],
    ]);
  });
});
