// # Unit tests for parsing expression grammars (PEGs)
// This tests an internal module, whose behavior cannot be fully observed when
// using only the main exported API.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import { term, endOfInput, choose, concatenate } from '#js/util/peg';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('terminal parsers', () => {
  it('matches at expected terms', () => {
    const termString = 'xyz';
    const inputStringPrefix = 'abc';
    const inputStringSuffix = '012';
    const inputString = inputStringPrefix + termString + inputStringSuffix;
    const meaning = 1;
    const parser = term(termString, meaning);
    assert.deepEqual(
      parser(inputString, inputStringPrefix.length),
      {
        meaning,
        inputIndex: inputStringPrefix.length + termString.length,
      },
    );
  });

 it('does not match at incompletely identical terms', () => {
    const termString = 'xyz';
    const inputStringPrefix = 'abc';
    const inputStringSuffix = '012';
    const partialTermString = termString.slice(0, -1);
    const inputString =
      inputStringPrefix + partialTermString + inputStringSuffix;
    const meaning = 1;
    const parser = term(termString, meaning);
    assert.equal(
      parser(inputString, inputStringPrefix.length),
      null,
    );
  });

 it('does not match at completely different terms', () => {
    const termString = 'xyz';
    const inputStringPrefix = 'abc';
    const inputStringSuffix = '012';
    const inputString = inputStringPrefix + inputStringSuffix;
    const meaning = 1;
    const parser = term(termString, meaning);
    assert.equal(
      parser(inputString, inputStringPrefix.length),
      null,
    );
  });

 it('does not match non-empty term strings at end of input', () => {
    const termString = 'xyz';
    const inputString = 'abc';
    const meaning = 1;
    const parser = term(termString, meaning);
    assert.equal(
      parser(inputString, inputString.length),
      null,
    );
  });

 it('does not match empty term strings at end of input', () => {
    const termString = '';
    const inputString = 'abc';
    const meaning = 1;
    const parser = term(termString, meaning);
    assert.deepEqual(
      parser(inputString, inputString.length),
      {
        meaning,
        inputIndex: inputString.length,
      },
    );
  });
});

describe('end-of-input parsers', () => {
  it('matches with first matching input parser', () => {
    const inputString = 'abc';
    const parser = endOfInput;
    assert.deepEqual(
      parser(inputString, inputString.length),
      {
        meaning: null,
        inputIndex: inputString.length,
      },
    );
  });
});

describe('choice parsers', () => {
  it('matches with first matching input parser', () => {
    const termString0 = 'xyz';
    const termString1 = 'abc';
    const termString2 = '012';
    const meaning0 = 0;
    const meaning1 = 1;
    const meaning2 = 2;
    const inputStringPrefix = '!@#';
    const inputStringSuffix = '$%^';
    const inputString = inputStringPrefix + termString1 + inputStringSuffix;
    const parser = choose(
      term(termString0, meaning0),
      term(termString1, meaning1),
      term(termString2, meaning2),
    );
    assert.deepEqual(
      parser(inputString, inputStringPrefix.length),
      {
        meaning: meaning1,
        inputIndex: (inputStringPrefix + termString1).length,
      },
    );
  });

  it('does not match when no input parser matches', () => {
    const termString0 = 'xyz';
    const termString1 = 'abc';
    const termString2 = '012';
    const meaning0 = 0;
    const meaning1 = 1;
    const meaning2 = 2;
    const inputStringPrefix = '!@#';
    const inputStringSuffix = '$%^';
    const inputString = inputStringPrefix + inputStringSuffix;
    const parser = choose(
      term(termString0, meaning0),
      term(termString1, meaning1),
      term(termString2, meaning2),
    );
    assert.deepEqual(
      parser(inputString, inputStringPrefix.length),
      null,
    );
  });
});

describe('concatenation parsers', () => {
  it('matches with all input parsers', () => {
    const termString0 = 'xyz';
    const termString1 = 'abc';
    const termString2 = '012';
    const meaning0 = 0;
    const meaning1 = 1;
    const meaning2 = 2;
    const inputStringPrefix = '!@#';
    const inputStringSuffix = '$%^';
    const inputString = (
      inputStringPrefix
      + termString0 + termString1 + termString2
      + inputStringSuffix
    );
    const parser = concatenate(
      term(termString0, meaning0),
      term(termString1, meaning1),
      term(termString2, meaning2),
    );
    assert.deepEqual(
      parser(inputString, inputStringPrefix.length),
      {
        meaning: [ meaning0, meaning1, meaning2 ],
        inputIndex:
          (inputStringPrefix + termString0 + termString1 + termString2).length,
      },
    );
  });

  it('does not match when any input parser does not match', () => {
    const termString0 = 'xyz';
    const termString1 = 'abc';
    const termString2 = '012';
    const meaning0 = 0;
    const meaning1 = 1;
    const meaning2 = 2;
    const inputStringPrefix = '!@#';
    const inputStringSuffix = '$%^';
    const inputString = (
      inputStringPrefix
      + termString0
      + inputStringSuffix
    );
    const parser = concatenate(
      term(termString0, meaning0),
      term(termString1, meaning1),
      term(termString2, meaning2),
    );
    assert.deepEqual(
      parser(inputString, inputStringPrefix.length),
      null,
    );
  });
});
