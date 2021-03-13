// # Unit tests for database reader
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import { get, getNameEntries } from '#js/db-reader';

import compileDatabase from '#js/db-compiler';
import fuzzilyFold from '#js/fuzzy-folder';
import * as Name from '#js/name';
import * as NameCounter from '#js/name-counter';
import * as HangulSyllable from '#js/hangul-syllable';
import * as Hex from '#js/util/hex';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('databases with ordinary singleton name ranges', () => {
  it('gets good value → 1 name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    const expectedName = nameStem;

    const inputHeadPoint = initialHeadPoint;
    // This is `U+0041` `'A'`, which matches the database’s name range for
    // `'A'`.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find one name matching the `inputValue`, with
    // a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, null ] ],
    );
  });

  it('gets bad value → 0 names: heads do not match', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    const inputHeadPoint = initialHeadPoint;
    // This is `U+0042` `'B'`, which does not match the database’s name range
    // for `'A'`.
    const inputValue = String.fromCodePoint(inputHeadPoint + 1);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: unexpected tail', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    // This input array’s values are arbitrary; it merely cannot be empty.
    const inputTailScalarArray = [ 0x42 ];
    // This is `U+0041 0042` `'AB'`, which does not match the database’s name
    // range for `'A'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → value', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    // This is `U+0041` `'A'`.
    const expectedValue = String.fromCodePoint(initialHeadPoint);

    // This is `'TEST'`, which matches the database’s name range for “TEST”.
    const inputName = nameStem;
    // This is also `'TEST'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find a value matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets bad name → value: input overlaps no DB name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    // This is `'X'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = 'X';
    // This is also `'X'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: input has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    // This is `'TEST X'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = nameStem + ' X';
    // This is `'TESTX'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: DB name has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has one name range for the one character `'A'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
      },
    ]);

    // This is `'TES'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = nameStem.slice(0, -1);
    // This is also `'TES'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });
});

describe('databases with singleton name-alias ranges', () => {
  it('gets good value → 1 name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This name range is for a name alias.
    const nameType = Name.correctionType;
    // This database has one name range for the one character `'A'`, with a
    // correction name alias “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        nameType,
      },
    ]);

    const expectedName = nameStem;

    // This is `U+0041` `'A'`, which matches the database’s name range for
    // `'A'`.
    const inputValue = String.fromCodePoint(initialHeadPoint);

    // We expect the database to find one name matching the `inputValue`, with
    // the same name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, nameType ] ],
    );
  });
});

describe('databases with singleton sequence name ranges', () => {
  it('gets good value → 1 name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    const expectedName = nameStem;

    // This is `U+0041 0042 0043` `'ABC'`, which match the database’s name
    // range for `'ABC'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...tailScalarArray,
    );

    // We expect the database to find one name matching the `inputValue`, with
    // a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, nameType ] ],
    );
  });

  it('gets bad value → 0 names: heads do not match', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `U+0042 0042 0043` `'BBC'`, which does not match the
    // database’s name range for `'ABC'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint + 1,
      ...tailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: too many tail scalars', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `[ 0x42, 0x43, 0x44 ]`.
    // `U+0044` is Latin Capital Letter D.
    const inputTailScalarArray = [
      ...tailScalarArray,
      0x44,
    ];
    // This is `U+0041 0042 0043 0044` `'ABCD'`, which does not match the
    // database’s name range for `'ABC'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: too few tail scalars', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `[ 0x42 ]`.
    const inputTailScalarArray = [
      tailScalarArray[0],
    ];
    // This is `U+0041 0042` `'AB'`, which does not match the database’s name
    // range for `'ABC'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: partial tail mismatch', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `[ 0x42, 0x44 ]`.
    // `U+0044` is Latin Capital Letter D.
    const inputTailScalarArray = [
      tailScalarArray[0],
      tailScalarArray[1] + 1,
    ];
    // This is `U+0041 0042 0044` `'ABD'`, which does not match the
    // database’s name range for `'ABC'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → value', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `U+0041 0042 0043` `'ABC'`.
    const expectedValue = String.fromCodePoint(
      initialHeadPoint,
      ...tailScalarArray,
    );

    // This is `'TEST'`, which matches the database’s name range for “TEST”.
    const inputName = nameStem;
    // This is also `'TEST'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find a value matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets bad name → value: input overlaps no DB name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `'X'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = nameStem + ' X';
    // This is also `'X'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: input has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `'TEST X'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = nameStem + ' X';
    // This is `'TESTX'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: DB name has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // `U+0042` and `U+0043` are Latin Capital Letter B and Latin Capital
    // Letter C.
    const tailScalarArray = [ 0x42, 0x43 ];
    // This name range is for a named character sequence.
    const nameType = Name.sequenceType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem,
        tailScalarArray,
        nameType,
      },
    ]);

    // This is `'TES'`, which does not match the database’s name range for
    // “TEST”.
    const inputName = nameStem.slice(0, -1);
    // This is also `'TES'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });
});

describe('databases with singleton hyphen-hex name ranges', () => {
  it('gets good value → 1 name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'A'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `'TEST-0041'`.
    const expectedName =
      `${ nameStem }-${ Hex.fromCodePoint(initialHeadPoint) }`;

    // This is `U+0041` `'A'`, which matches the database’s name range for
    // `'A'`.
    const inputHeadPoint = initialHeadPoint;
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find one name matching the `inputValue`, with
    // a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, null ] ],
    );
  });

  it('gets bad value → 1 name: heads do not match', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'A'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    const inputHeadPoint = initialHeadPoint + 1;
    // This is `U+0042` `'B'`, which does not match the database’s name range
    // for `'A'`.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: unexpected tails', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'A'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This input array’s values are arbitrary; it merely cannot be empty.
    const inputTailScalarArray = [ 0x42 ];
    // This is `U+0041 0042` `'AB'`, which does not match the database’s name
    // range for `'A'`.
    const inputValue = String.fromCodePoint(
      initialHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → value', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'A'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `U+0041` `'A'`.
    const expectedValue = String.fromCodePoint(initialHeadPoint);

    // This is `'TEST-0041'`, which match the database’s name range for
    // TEST-0041.
    const inputHeadPoint = initialHeadPoint;
    const inputName =
      `${ nameStem }-${ Hex.fromCodePoint(inputHeadPoint) }`;
    // This is `'TEST0041'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets good name → value: name stem and counter', () => {
    const nameStem = 'TEST 1';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `U+0041` `'A'`.
    const expectedValue = String.fromCodePoint(initialHeadPoint);

    const inputHeadPoint = initialHeadPoint;
    // This is `'TEST 1-0044'`.
    const inputName =
      `${ nameStem }-${ Hex.fromCodePoint(inputHeadPoint) }`;
    // This is `'TEST1004'`.
    // Note that `TEST10041` also looks like `TEST-10041`, with `10041` being
    // a valid code-point hex. We are also checking that we are using the
    // name range’s name stem (`TEST 1`) to extract the name counter (`0041`)
    // – rather than attempting to extract the name counter using a
    // hex-detecting RegExp (which would give `A0041`).
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets bad name → value: input overlaps no DB name', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `'X'`, which `'TEST'` does not start with.
    const inputName = 'X';
    // This is also `'X'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: input stem has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `'TEST X'`.
    const inputNameStem = nameStem + ' X';
    // This is `'TEST X-0041'`, which does not match the database’s name range
    // for “TEST-0041”.
    const inputName = inputNameStem + '-0041';
    // This is `'TESTX0041'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: DB stem has extra char', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `'TES'`.
    const inputNameStem = nameStem.slice(0, -1);
    // This is `'TES-0041'`, which does not match the database’s name range for
    // TEST-0041.
    const inputName = inputNameStem + '-0041';
    // This is `'TES0041'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: input counter too small', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'AB'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `0x40`.
    const inputHeadPoint = initialHeadPoint - 1;
    // This is `'TEST-0040'`, which does not match the database’s name range
    // for “TEST-0041”.
    const inputName =
      `${ nameStem }-${ Hex.fromCodePoint(inputHeadPoint) }`;
    // This is `'TEST0040'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets bad name → value: input counter too large', () => {
    const nameStem = 'TEST';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for the one character `'A'`, named
    // “TEST-0041”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        // We specify no length property here; we expect it to be 1 by default.
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `0x42`.
    const inputHeadPoint = initialHeadPoint + 1;
    // This is `'TEST-0042'`, which does not match the database’s name range
    // for “TEST-0041”.
    const inputName =
      `${ nameStem }-${ Hex.fromCodePoint(inputHeadPoint) }`;
    // This is `'TEST0042'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });
});

// This test suite focuses on boundary conditions for hyphen-hex name ranges.
// The previous test suite tests other functionality of hyphen-hex name ranges.
describe('databases with multiplex hyphen-hex name ranges', () => {
  it('gets good value → 1 name: start, middle, and end', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `[ 'TEST-0041', 'TEST-0042', 'TEST-0043' ]`.
    // For each code point, the hyphen-hex name-counter type appends a hyphen
    // and padded hex to the name stem.
    const expectedNameArray = headPointArray.map(headPoint =>
      `${ nameStem }-${ Hex.fromCodePoint(headPoint) }`);
    // This is `[ [ 'TEST-0041', null ], [ 'TEST-0042', null ], [ 'TEST-0043',
    // null ] ]`. We expect the database to find three names matching the
    // `inputValue`, each with a null name type.
    const expectedNameEntryArray = expectedNameArray.map(name =>
      [ [ name, null ] ]);

    // This is `[ 'A', 'B', 'C' ]`.
    const inputValueArray = headPointArray.map(headPoint =>
      String.fromCodePoint(headPoint));
    // This is what we are testing.
    const actualNameEntryArray = inputValueArray.map(value =>
      getNameEntries(database, value));

    // This test checks correctness at the start, middle, and end of the
    // name range.
    assert.deepEqual(
      actualNameEntryArray,
      expectedNameEntryArray,
    );
  });

  it('gets bad value → 1 name: input value too small', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    const inputHeadPoint = initialHeadPoint - 1;
    // This is `U+0040` `'@'`, which does not match the database’s name range
    // for `'A'`–`'C'`.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 1 name: input value too large', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    const inputHeadPoint = initialHeadPoint + headPointArray.length;
    // This is `U+0044` `'D'`, which does not match the database’s name range
    // for `'A'`–`'C'`.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → value: start, middle, and end', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `[ 'A', 'B', 'C' ]`.
    const expectedValueArray = headPointArray.map(headPoint =>
      String.fromCodePoint(headPoint));

    // This is `[ 'TEST-0041', 'TEST-0042', 'TEST-0043' ]`.
    // For each code point, the hyphen-hex name-counter type appends a hyphen
    // and padded hex to the name stem.
    const inputNameArray = headPointArray.map(headPoint =>
      `${ nameStem }-${ Hex.fromCodePoint(headPoint) }`);
    const inputFuzzyNameArray = inputNameArray.map(fuzzilyFold);

    // This is what we are testing.
    const actualValueArray = inputFuzzyNameArray.map(fuzzyName =>
      get(database, fuzzyName));

    // This test checks correctness at the start, middle, and end of the
    // name range.
    assert.deepEqual(
      actualValueArray,
      expectedValueArray,
    );
  });

  it('gets bad name → value: input counter too small', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `[ 'A', 'B', 'C' ]`.
    const expectedValueArray = headPointArray.map(headPoint =>
      String.fromCodePoint(headPoint));

    // This is `[ 'TEST-0041', 'TEST-0042', 'TEST-0043' ]`.
    // For each code point, the hyphen-hex name-counter type appends a hyphen
    // and padded hex to the name stem.
    const inputNameArray = headPointArray.map(headPoint =>
      `${ nameStem }-${ Hex.fromCodePoint(headPoint) }`);
    const inputFuzzyNameArray = inputNameArray.map(fuzzilyFold);

    // This is what we are testing.
    const actualValueArray = inputFuzzyNameArray.map(fuzzyName =>
      get(database, fuzzyName));

    // This test checks correctness at the start, middle, and end of the
    // name range.
    assert.deepEqual(
      actualValueArray,
      expectedValueArray,
    );
  });

  it('gets bad name → value: input counter too large', () => {
    const nameStem = 'TEST';
    const initialHeadPoint = 0x41;
    // `U+0041`, 0042, and 0043 are Latin Capital Letter A, B, and C.
    const headPointArray = [
      initialHeadPoint,
      initialHeadPoint + 1,
      initialHeadPoint + 2,
    ];
    // This is 3.
    const length = headPointArray.length;
    // We are testing hyphen-hex name counters.
    const nameCounterType = NameCounter.hyphenHexType;
    // This database has one name range for three characters: A, named
    // TEST-0041, B, named “TEST-0042”, and C, named “TEST-0043”.
    const database = compileDatabase([
      {
        initialHeadPoint,
        length,
        nameStem,
        nameCounterType,
      },
    ]);

    // This is `[ 'A', 'B', 'C' ]`.
    const expectedValueArray = headPointArray.map(headPoint =>
      String.fromCodePoint(headPoint));

    // This is `[ 'TEST-0041', 'TEST-0042', 'TEST-0043' ]`.
    // For each code point, the hyphen-hex name-counter type appends a hyphen
    // and padded hex to the name stem.
    const inputNameArray = headPointArray.map(headPoint =>
      `${ nameStem }-${ Hex.fromCodePoint(headPoint) }`);
    const inputFuzzyNameArray = inputNameArray.map(fuzzilyFold);

    // This is what we are testing.
    const actualValueArray = inputFuzzyNameArray.map(fuzzyName =>
      get(database, fuzzyName));

    // This test checks correctness at the start, middle, and end of the
    // name range.
    assert.deepEqual(
      actualValueArray,
      expectedValueArray,
    );
  });
});

describe('databases with Hangul-syllable name ranges', () => {
  const nameStem = 'HANGUL SYLLABLE';
  const nameCounterType = NameCounter.hangulSyllableType;

  // `U+AC00` is Hangul Syllable Ga, the zeroth Hangul syllable.
  const initialHeadPoint = HangulSyllable.basePoint;
  const initialNameCounter = ' GA';

  // `U+D4DB` is Hangul Syllable Pwilh, the 10,458th Hangul syllable. We chose
  // it arbitrarily as a syllable between the zeroth and last syllables.
  const middleHeadPoint = 0xD4DB;
  const middleNameCounter = ' PWILH';

  // `U+D7A3` is Hangul Syllable Hih, the last Hangul syllable.
  const finalHeadPoint = initialHeadPoint + HangulSyllable.numOfSyllables - 1;
  const finalNameCounter = ' HIH';

  // This is `0x2BA4`.
  const length = HangulSyllable.numOfSyllables;

  // This database contains the Hangul-syllable name range.
  const database = compileDatabase([
    {
      initialHeadPoint,
      length,
      nameStem,
      nameCounterType,
    },
  ]);

  // This function asserts that the database matches the given code point with
  // the given Hangul-syllable name counter.
  function assertGoodValueHasName (inputHeadPoint, expectedNameCounter) {
    // For example, if `expectedNameCounter` is `' PWILH'`, then this would be
    // `'HANGUL SYLLABLE PWILH'`.
    const expectedName = nameStem + expectedNameCounter;

    // For example, if `inputHeadPoint` is `0xD4DB`, then this would be
    // `U+D4DB` Hangul Syllable Pwilh (`'퓛'`).
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find one name matching the `inputValue`, with
    // a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, null ] ],
    );
  }

  // This function asserts that the database matches the given Hangul-syllable
  // name counter with the given code point.
  function assertGoodNameHasValue (inputFuzzyNameCounter, expectedHeadPoint) {
    // For example, if `expectedHeadPoint` is `0xD4DB`, then this would be
    // `U+D4DB` Hangul Syllable Pwilh (`'퓛'`).
    const expectedValue = String.fromCodePoint(expectedHeadPoint);

    // For example, if `expectedNameCounter` is `' PWILH'`, then this would be
    // `'HANGUL SYLLABLE PWILH'`.
    const inputName = nameStem + inputFuzzyNameCounter;
    // Additionally, this would be `'HANGULSYLLABLEPWILH'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find one value matching the `inputName`.
    assert.deepEqual(
      get(database, inputFuzzyName),
      expectedValue,
    );
  }

  it('gets good value → 1 name: initial point', () => {
    assertGoodValueHasName(initialHeadPoint, initialNameCounter);
  });

  it('gets good value → 1 name: between initial and final', () => {
    assertGoodValueHasName(middleHeadPoint, middleNameCounter);
  });

  it('gets good value → 1 name: final point', () => {
    assertGoodValueHasName(finalHeadPoint, finalNameCounter);
  });

  it('gets good value → 1 name: input head is too small', () => {
    // This is `0xABFF`.
    const inputHeadPoint = initialHeadPoint - 1;
    // This is `'\uABFF'`. `U+ABFF` is unassigned as of Unicode 14.0.0.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: input head is too large', () => {
    // This is `0xABFF`.
    const inputHeadPoint = finalHeadPoint + 1;
    // This is `'\uD7A4'`. `U+D7A4` is unassigned as of Unicode 14.0.0.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets bad value → 0 names: unexpected tail', () => {
    // `U+AC00` is Hangul Syllable Ga, the zeroth Hangul syllable.
    const inputHeadPoint = initialHeadPoint;
    const inputTailScalarArray = [ 0x41 ];
    // This string is Hangul Syllable Ga followed by Latin Capital Letter A.
    // It is not a named character sequence.
    const inputValue = String.fromCodePoint(
      inputHeadPoint,
      ...inputTailScalarArray,
    );

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → 1 value: start of range', () => {
    assertGoodNameHasValue(initialNameCounter, initialHeadPoint);
  });

  it('gets good name → 1 value: middle of range', () => {
    assertGoodNameHasValue(middleNameCounter, middleHeadPoint);
  });

  it('gets good name → 1 value: end of range', () => {
    assertGoodNameHasValue(finalNameCounter, finalHeadPoint);
  });

  it('gets bad name → 0 values: no overlap with DB stem', () => {
    const inputNameStem = 'TEST';
    // This is `TEST GA`. The ` GA` name counter is validly within the
    // Hangul-syllable name range, but the name stems `TEST` and `HANGUL
    // SYLLABLE` do not match.
    const inputName = inputNameStem + initialNameCounter;
    // This is `'TESTGA'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets with bad name: DB name stem starts with input', () => {
    // This is `'HANGUL SYLLABL'`.
    const inputNameStem = nameStem.slice(0, -1);
    // This is `HANGUL SYLLABL GA`. The ` GA` name counter is validly within
    // the Hangul-syllable name range, but the name stems `HANGUL SYLLABL` and
    // `HANGUL SYLLABLE` do not match.
    const inputName = inputNameStem + initialNameCounter;
    // This is `'HANGUL SYLLABLGA'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });

  it('gets with bad name: input name counter', () => {
    // There is no Hangul syllable with a name counter of X.
    const inputFuzzyNameCounter = ' X';
    // This is `'HANGUL SYLLABLE X'`.
    const inputName = nameStem + inputFuzzyNameCounter;
    // This is `'HANGULSYLLABLEX'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });
});

describe('databases with two name ranges', () => {
  it('gets good value → 2 names: same initial head points', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has two name ranges: both ranges for the same character A,
    // respectively giving the names “TEST 0” and “TEST 1” to that character.
    // The name ranges completely overlap.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint,
        nameStem: nameStem1,
      },
    ]);

    const inputHeadPoint = initialHeadPoint;
    // This is `U+0041` `'A'`, which matches both of the database’s name ranges
    // for `'A'`.
    const inputValue = String.fromCodePoint(initialHeadPoint);

    const expectedName0 = nameStem0;
    const expectedName1 = nameStem1;

    // We expect the database to find two names matching the `inputValue`, each
    // with a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName0, null ], [ expectedName1, null ] ],
    );
  });

  // This tests checks for a bug that may occur when a multiplex range overlaps
  // with multiple following ranges. When a value matches both the multiplex
  // range and at least one of those following ranges, then terminating the
  // search after finding at least one match in the multiplex range would be
  // too early.
  it('gets good value → 2 names: partial overlap of heads', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    const nameStem2 = 'TEST 2';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint0 = 0x41;
    // `U+0042` is Latin Capital Letter B.
    const initialHeadPoint1 = initialHeadPoint0 + 1;
    // `U+0043` is Latin Capital Letter C.
    const initialHeadPoint2 = initialHeadPoint0 + 2;
    // This database has two three ranges:
    const database = compileDatabase([
      // The zeroth range covers the characters `'A'`, `'B'`, and `'C'`,
      // respectively named “TEST 0-0041”, “TEST 0-0042”, and “TEST 0-0043”.
      {
        initialHeadPoint: initialHeadPoint0,
        // This is 3.
        length: (initialHeadPoint2 - initialHeadPoint0 + 1),
        nameStem: nameStem0,
        nameCounterType: NameCounter.hyphenHexType,
        nameType: 'label',
      },
      // The first range covers the single character `'B'`, named “TEST 1”.
      {
        initialHeadPoint: initialHeadPoint1,
        nameStem: nameStem1,
      },
      // The first range covers the single character `'C'`, named “TEST 2”.
      {
        initialHeadPoint: initialHeadPoint2,
        nameStem: nameStem2,
      },
    ]);

    // We will check the name entries for the character `U+0043` `'C'`, which
    // should match the zeroth and second name ranges (but not the first name
    // range) and therefore should result in name entries for “TEST 2” then
    // “TEST 0-0043”.
    const inputHeadPoint = initialHeadPoint2;
    // This is `U+0043` `'C'`, which matches the zeroth and second of the
    // database’s name ranges (but not the first name range).
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // The matching strict character name (“TEST 2”) comes before the matching
    // label (“TEST 0-0043”).
    const expectedName0 = nameStem2;
    const expectedName1 =
      `${ nameStem0 }-${ Hex.fromCodePoint(inputHeadPoint) }`;

    // We expect the database to find two names matching the `inputValue`, with
    // null name types.
    assert.deepEqual(
      getNameEntries(database, inputValue).sort(Name.compareEntries),
      [ [ expectedName0, null ], [ expectedName1, Name.labelType ] ],
    );
  });

  it('gets good value → 1 name: other range does not match', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    const initialHeadPoint0 = 0x41;
    const initialHeadPoint1 = initialHeadPoint0 + 1;
    // This database has two name ranges: one range for the character `'A'`,
    // named “TEST 0”, and the other for the character `'B'`, named “TEST 1”.
    const database = compileDatabase([
      {
        initialHeadPoint: initialHeadPoint0,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint: initialHeadPoint1,
        nameStem: nameStem1,
      },
    ]);

    const expectedName = nameStem0;

    const inputHeadPoint = initialHeadPoint0;
    // This is `U+0041` `'A'`, which matches match the database’s name range
    // for `'A'` but not its name range for `'B'`.
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find one name matching the `inputValue`, with
    // a null name type.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ expectedName, null ] ],
    );
  });

  it('gets bad value → 0 names: neither name range matches', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    const initialHeadPoint0 = 0x41;
    const initialHeadPoint1 = initialHeadPoint0 + 1;
    // This database has two name ranges: one range for the character `'A'`,
    // named “TEST 0”, and the other for the character `'B'`, named “TEST 1”.
    const database = compileDatabase([
      {
        initialHeadPoint: initialHeadPoint0,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint: initialHeadPoint1,
        nameStem: nameStem1,
      },
    ]);

    // This is `U+0043` `'C'`, which matches neither the database’s name range
    // for `'A'` nor its name range for `'B'`.
    const inputHeadPoint = initialHeadPoint1 + 1;
    const inputValue = String.fromCodePoint(inputHeadPoint);

    // We expect the database to find no names matching the `inputValue`.
    assert.deepEqual(
      getNameEntries(database, inputValue),
      [],
    );
  });

  it('gets good name → value matching zeroth DB name range', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has two name ranges.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint,
        nameStem: nameStem1,
      },
    ]);

    // This is `'A'`.
    const expectedValue = String.fromCodePoint(initialHeadPoint);

    // This is `'TEST 0'`, which matches the database’s name range for “TEST 0”
    // but not its name range for “TEST 1”.
    const inputName = nameStem0;
    // This is `'TEST0'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find a value matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets good name → value matching last DB name range', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has two name ranges.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint: initialHeadPoint,
        nameStem: nameStem1,
      },
    ]);

    // This is `'A'`.
    const expectedValue = String.fromCodePoint(initialHeadPoint);

    // This is `'TEST 1'`, which matches the database’s name range for “TEST 1”
    // but not its name range for “TEST 0”.
    const inputName = nameStem1;
    // This is `'TEST1'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      expectedValue,
    );
  });

  it('gets bad name → value matching neither DB name range', () => {
    const nameStem0 = 'TEST 0';
    const nameStem1 = 'TEST 1';
    // `U+0041` is Latin Capital Letter A.
    const initialHeadPoint = 0x41;
    // This database has two name ranges.
    const database = compileDatabase([
      {
        initialHeadPoint,
        nameStem: nameStem0,
      },
      {
        initialHeadPoint,
        nameStem: nameStem1,
      },
    ]);

    // This input name matches neither the database’s name ranges for “TEST 0”
    // nor its name range for “TEST 1”.
    const inputName = 'X';
    // This is still `'X'`.
    const inputFuzzyName = fuzzilyFold(inputName);

    // We expect the database to find no values matching the `inputFuzzyName`.
    assert.equal(
      get(database, inputFuzzyName),
      undefined,
    );
  });
});

// If names are naïvely sorted lexicographically by ASCII without first fuzzily
// folding them (i.e., without removing insignificant spaces and medial
// hyphens), then attempting to use that order to binary search for names will
// sometimes give erroneous results. This may happen specifically for any two
// names `name0` and `name1` such that `name0` precedes `name1` in ASCII but
// `fuzzilyFold(name0)` does not precede `fuzzilyFold(name1)`. (`fuzzilyFold`
// is a function defined in the `#js/fuzzy-fold` module.)
//
// An example of such a pair is with `U+2196 NORTH WEST ARROW` and `U+1F6EA
// NORTHEAST-POINTING AIRPLANE`. `NORTH WEST ARROW` precedes
// `NORTHEAST-POINTING AIRPLANE` (because spaces precede all letters in ASCII),
// but the fuzzily folded `NORTHWESTARROW` does not precede
// `NORTHEASTPOINTINGAIRPLANE`. This means that binary searching for `NORTH
// WEST ARROW` with binary search may fail if one of its parent nodes is the
// entry for `NORTHEAST-POINTING AIRPLANE`. When the binary search reaches
// `NORTHEAST-POINTING AIRPLANE`’s parent node, it would find that
// `NORTHWESTARROW` does not precede `NORTHEASTPOINTINGAIRPLANE`, so it would
// continue to search in names that follow `NORTHEAST-POINTING AIRPLANE`. If
// `NORTH WEST ARROW` is not one of those following names, then the binary
// search will never find it.
describe('name–fuzzy-name order mismatch', () => {
  const name0 = 'NORTH WEST ARROW';
  const value0 = '\u2196';
  const name1 = 'NORTHEAST-POINTING AIRPLANE';
  const value1 = '\u{1F6EA}';
  // This database has two name ranges: one range for the character `'A'`,
  // named “TEST 0”, and the other for the character `'B'`, named “TEST 1”.
  const database = compileDatabase([
    {
      initialHeadPoint: value0.codePointAt(0),
      nameStem: name0,
    },
    {
      initialHeadPoint: value1.codePointAt(0),
      nameStem: name1,
    },
  ]);

  it('gets name → value: precedes & fuzzily follows another', () => {
    const inputFuzzyName = fuzzilyFold(name0);

    assert.equal(
      get(database, inputFuzzyName),
      value0,
    );
  });

  it('gets name → value: follows & fuzzily precedes another', () => {
    const inputFuzzyName = fuzzilyFold(name1);

    assert.equal(
      get(database, inputFuzzyName),
      value1,
    );
  });

  it('gets value → name: precedes & fuzzily follows another', () => {
    const inputValue = value0;

    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ name0, null ] ],
    );
  });

  it('gets value → name: follows & fuzzily precedes another', () => {
    const inputValue = value1;

    assert.deepEqual(
      getNameEntries(database, inputValue),
      [ [ name1, null ] ],
    );
  });
});
