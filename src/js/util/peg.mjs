// # Parsing expression grammars (PEGs)
// This universal module exports utilities for creating and using [parsing
// expression grammars][PEGs] to match strings. In particular, the
// [`#js/hangul-syllable` module][] uses PEGs to parse the names of Hangul
// syllables.
//
// [PEGs]: https://en.m.wikipedia.org/wiki/Parsing_expression_grammar
// [`#js/hangul-syllable` module]: ../hangul-syllable.mjs
//
// A “parser” is a function. It takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a “match” object (if its parsing succeeds at the input index) or
// a `null` (if its parsing fails at the input index).
//
// A match object is a `{ meaning, inputIndex }` object. `meaning` may be an
// arbitrary value. `inputIndex` is the input-index integer after the match.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

// ## Terminal parsers
// This function takes an `expectedSubstring` and returns whether the given
// `bodyString` starts with that `expectedSubstring`, starting at the given
// `bodyStringIndex` integer (between `0` inclusive and `bodyString.length`
// exclusive).
function isSubstringAt (expectedSubstring, bodyString, bodyStringIndex) {
  const bodySubstring = bodyString
    .substring(bodyStringIndex, bodyStringIndex + expectedSubstring.length);
  return bodySubstring === expectedSubstring;
}

// This function creates a terminal parser function that attempts to match the
// given `termString` with any given input string at any given input index.
export function term (termString, meaning) {
  return function parseTerm (inputString, inputIndex0) {
    if (isSubstringAt(termString, inputString, inputIndex0)) {
      return {
        meaning: meaning,
        inputIndex: inputIndex0 + termString.length,
      };
    }

    else {
      return null;
    }
  };
}

// ## End-of-input parser
// This parser takes an input string and an input index integer (between `0`
// inclusive and the input string’s length exclusive). It may return a match
// object (if its parsing succeeds at the input index) or a `null` (if its
// parsing fails at the input index).
//
// The parser succeeds only if the input index is at the end of the input
// string. The match’s new input index is advanced by the length of the jamo
// sound. The match’s meaning is the given jamo index number.
export function endOfInput (inputString, inputIndex) {
  if (inputIndex === inputString.length) {
    return { meaning: null, inputIndex };
  }

  else {
    return null;
  }
}

// ## Choice parsers
// This function creates a parser that takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index).
//
// The parser succeeds only if any of the given parsers matches the given input
// string at the given input index. It returns the match object that is
// furthest along the input string, if any. If no given parser succeeds, then
// the entire parsing fails and returns `null`.
export function choose (...parserArray) {
  return function parseChoice (inputString, inputIndex0) {
    const match0 = null;
    for (const parser of parserArray) {
      const match = parser(inputString, inputIndex0);
      if (match != null) {
        return match;
      }
    }
    return null;
  }
}

// ## Concatenation parsers
// This function creates a reducing function that takes a previous match
// (whose meaning must be iterable) and a next parser, and which attempts to
// consecutively apply the next parser (to the input string at the location
// given by the previous match), then to combine together the resulting two
// matches.
//
// If the given previous match is not `null` (i.e., if the previous parsers did
// not consecutively fail), then the reducing function applies the given parser
// to the given input string at that given match’s input index integer. If that
// given parser in turn succeeds in matching, then the reducing function
// returns a match object whose input index has been advanced by however much
// the parser matched, and whose meaning is an array of the previous match’s
// meaning along with the parser’s match’s meaning.
//
// If the given match is `null`, then the reducing function returns `null` too.
function createConcatenateReducer (inputString) {
  return function reduceConcatenation (match0, parser) {
    if (match0 != null) {
      const match1 = parser(inputString, match0.inputIndex);
      if (match1 != null) {
        return {
          meaning: [ ...match0.meaning, match1.meaning ],
          inputIndex: match1.inputIndex,
        };
      }

      else {
        // In this case, the next match is a failure.
        return match1;
      }
    }

    else {
      // In this case, the preceding match was a failure.
      return match0;
    }
  };
}

// This function creates a parser that takes an input string and an input index
// integer (between `0` inclusive and the input string’s length exclusive). It
// may return a match object (if its parsing succeeds at the input index) or a
// `null` (if its parsing fails at the input index).
//
// The parser succeeds only if all of the given parsers consecutively match the
// given input string, starting at the given input index. If all given parsers
// do consecutively match, then the returned match’s new input index is
// advanced to the input index after applying the final given parser. The
// match’s meaning is an array of the given parsers’ matches’ meanings.
//
// If any of the given parsers do not match, then the entire parsing fails and
// returns `null`.
export function concatenate (...parsers) {
  return function parseConcatenation (inputString, inputIndex0) {
    const match0 = {
      meaning: [],
      inputIndex: inputIndex0,
    };
    return parsers.reduce(createConcatenateReducer(inputString), match0);
  }
}
