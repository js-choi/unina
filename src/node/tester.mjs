// # Testing framework
// This is a lightweight test framework. It may be used by any internal module
// using a subpath import: `import '#node/tester';`.
//
// By testing internal edge cases, future updates to the UCD and to the
// database’s format are less likely to cause observable bugs in the public API
// as well.
//
// The test framework is based on [Uvu][]. Test modules do not use `import
// 'uvu';` directly in order to simplify refactoring when we need to modify,
// extend, or replace Uvu.
//
// [Uvu]: https://github.com/lukeed/uvu/
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as uvu from 'uvu';

export * as assert from 'uvu/assert';

// This function creates a test suite, calls the `suiteBody` callback on the
// suite, and then runs the suite. The test suite *cannot* be nested. This is a limitation of Uvu – see [Uvu issue #43][].
//
// [Uvu issue #43]: https://github.com/lukeed/uvu/issues/43
export function describe(suiteName, suiteBody) {
  const suite = uvu.suite(suiteName);
  suiteBody(suite);
  suite.run();
}
