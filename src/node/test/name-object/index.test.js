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

import parseNameObjects from '../../../main/name-object/';

test('non-iterable lines', async () => {
  await expect(parseNameObjects())
    .rejects.toThrow(TypeError);

  await expect(parseNameObjects({}))
    .rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    unicodeDataLines: [],
    nameAliasesLines: [],
  })).rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    unicodeDataLines: [],
    namedSequencesLines: [],
  })).rejects.toThrow(TypeError);

  await expect(parseNameObjects({
    nameAliasesLines: [],
    namedSequencesLines: [],
  })).rejects.toThrow(TypeError);
});

describe('UnicodeData.txt lines', () => {
  test('ignored blank line', async () => {
    await expect(parseNameObjects({
      unicodeDataLines: [
        ' ',
      ],
      nameAliasesLines: [],
      namedSequencesLines: [],
    })).resolves.toEqual([]);
  });

  test('ignored comment line', async () => {
    await expect(parseNameObjects({
      unicodeDataLines: [
        '# Comment',
      ],
      nameAliasesLines: [],
      namedSequencesLines: [],
    })).resolves.toEqual([]);
  });

  test('ignored control-labeled line', async () => {
    await expect(parseNameObjects({
      unicodeDataLines: [
        '0000;<control>;Cc;0;BN;;;;;N;NULL;;;;',
      ],
      nameAliasesLines: [],
      namedSequencesLines: [],
    })).resolves.toEqual([]);
  });

  test('ordinary line without comment', async () => {
    await expect(parseNameObjects({
      unicodeDataLines: [
        '0020;SPACE;Zs;0;WS;;;;;N;;;;;',
      ],
      nameAliasesLines: [],
      namedSequencesLines: [],
    })).resolves.toEqual([
      { headScalar: 0x20, name: 'SPACE', nameType: null },
    ]);
  });

  test('ordinary line with comment', async () => {
    await expect(parseNameObjects({
      unicodeDataLines: [
        '0020;SPACE # Comment',
      ],
      nameAliasesLines: [],
      namedSequencesLines: [],
    })).resolves.toEqual([
      { headScalar: 0x20, name: 'SPACE', nameType: null },
    ]);
  });
});
