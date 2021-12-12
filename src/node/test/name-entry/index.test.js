// # Unit tests for `main/name-entry/`
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

import { compareNameEntries } from '../../../main/name-entry/';

test('characters with different name types', () => {
  // The control name type precedes the label name type.
  expect(compareNameEntries(
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
    { name: 'control-008F', nameType: 'LABEL' },
  )).toBe(-1);

  expect(compareNameEntries(
    { name: 'control-008F', nameType: 'LABEL' },
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
  )).toBe(+1);
});

test('characters with different name types', () => {
  // Space precedes “-” lexicographically.
  expect(compareNameEntries(
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
    { name: 'SINGLE-SHIFT-3', nameType: 'CONTROL' },
  )).toBe(-1);

  expect(compareNameEntries(
    { name: 'SINGLE-SHIFT-3', nameType: 'CONTROL' },
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
  )).toBe(+1);
});

test('characters with identical names and name types', () => {
  // Space precedes “-” lexicographically.
  expect(compareNameEntries(
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
  )).toBe(0);

  expect(compareNameEntries(
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
    { name: 'SINGLE SHIFT THREE', nameType: 'CONTROL' },
  )).toBe(0);
});
