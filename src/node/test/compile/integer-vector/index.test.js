// # Unit tests for `main/compile/integer-vector/`
// This is a Jest suite for an internal module, whose behavior cannot be fully
// observed when using only the `main/` API.
//
// By testing these internal edge cases, future updates to the UCD and to the
// database format are less likely to cause observable bugs in the `main/` API
// as well.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

import compileIntegerVector from '../../../../main/compile/integer-vector/';

test('non-array input', () => {
  expect(() => compileIntegerVector(null))
    .toThrow(TypeError);
});

test('input containing negative integer', () => {
  expect(() => compileIntegerVector([ -1 ]))
    .toThrow(TypeError);
});

test('input containing non-integer', () => {
  expect(() => compileIntegerVector([ 0.5 ]))
    .toThrow(TypeError);
});

test('empty vector', () => {
  expect(compileIntegerVector([])).toMatchInlineSnapshot(`
Object {
  "block": "",
  "directory": Object {
    "numOfHexesPerEntry": 0,
  },
}
`);
});

test('non-empty vectors', () => {
  expect(compileIntegerVector([0])).toMatchInlineSnapshot(`
Object {
  "block": "0",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1])).toMatchInlineSnapshot(`
Object {
  "block": "1",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15])).toMatchInlineSnapshot(`
Object {
  "block": "F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 0])).toMatchInlineSnapshot(`
Object {
  "block": "00",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 1])).toMatchInlineSnapshot(`
Object {
  "block": "01",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 15])).toMatchInlineSnapshot(`
Object {
  "block": "0F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 0])).toMatchInlineSnapshot(`
Object {
  "block": "10",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 1])).toMatchInlineSnapshot(`
Object {
  "block": "11",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 15])).toMatchInlineSnapshot(`
Object {
  "block": "1F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 0])).toMatchInlineSnapshot(`
Object {
  "block": "F0",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 1])).toMatchInlineSnapshot(`
Object {
  "block": "F1",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 15])).toMatchInlineSnapshot(`
Object {
  "block": "FF",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 0, 0])).toMatchInlineSnapshot(`
Object {
  "block": "000",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 0, 1])).toMatchInlineSnapshot(`
Object {
  "block": "001",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 0, 15])).toMatchInlineSnapshot(`
Object {
  "block": "00F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 1, 0])).toMatchInlineSnapshot(`
Object {
  "block": "010",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 1, 1])).toMatchInlineSnapshot(`
Object {
  "block": "011",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 1, 15])).toMatchInlineSnapshot(`
Object {
  "block": "01F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 15, 0])).toMatchInlineSnapshot(`
Object {
  "block": "0F0",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 15, 1])).toMatchInlineSnapshot(`
Object {
  "block": "0F1",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([0, 15, 15])).toMatchInlineSnapshot(`
Object {
  "block": "0FF",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 0, 0])).toMatchInlineSnapshot(`
Object {
  "block": "100",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 0, 1])).toMatchInlineSnapshot(`
Object {
  "block": "101",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 0, 15])).toMatchInlineSnapshot(`
Object {
  "block": "10F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 1, 0])).toMatchInlineSnapshot(`
Object {
  "block": "110",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 1, 1])).toMatchInlineSnapshot(`
Object {
  "block": "111",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 1, 15])).toMatchInlineSnapshot(`
Object {
  "block": "11F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 15, 0])).toMatchInlineSnapshot(`
Object {
  "block": "1F0",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 15, 1])).toMatchInlineSnapshot(`
Object {
  "block": "1F1",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([1, 15, 15])).toMatchInlineSnapshot(`
Object {
  "block": "1FF",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 0, 0])).toMatchInlineSnapshot(`
Object {
  "block": "F00",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 0, 1])).toMatchInlineSnapshot(`
Object {
  "block": "F01",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 0, 15])).toMatchInlineSnapshot(`
Object {
  "block": "F0F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 1, 0])).toMatchInlineSnapshot(`
Object {
  "block": "F10",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 1, 1])).toMatchInlineSnapshot(`
Object {
  "block": "F11",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 1, 15])).toMatchInlineSnapshot(`
Object {
  "block": "F1F",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 15, 0])).toMatchInlineSnapshot(`
Object {
  "block": "FF0",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 15, 1])).toMatchInlineSnapshot(`
Object {
  "block": "FF1",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);

  expect(compileIntegerVector([15, 15, 15])).toMatchInlineSnapshot(`
Object {
  "block": "FFF",
  "directory": Object {
    "numOfHexesPerEntry": 1,
  },
}
`);
});
