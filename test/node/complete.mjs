// # Complete integration tests for main API
// This completely tests the (fully [built][]) [main `unina` module][] with
// actual data extracted from the UCD. In addition to certain edge cases, the
// suite also checks that every single name in the UCD’s name ranges has a
// match in the API. This suite expects that the main module has [already been
// built with `npm build`][built].
//
// The suite will run *only if* an environmental variable named
// **`UNINA_TEST_COMPLETE_UCD`** is set to a non-blank value such as `true` or
// `yes`. Otherwise, the suite will be skipped.
//
// [built]: ../../script/build.mjs
// [main `unina` module]: ../../src/js/main.mjs
//
// Be aware that there are more than 285,000 named Unicode characters, and this
// test suite may take hours to complete.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import extractNameRanges from '#node/extractor';

import * as NameRangeData from '#js/name-range/name-data';
import * as Name from '#js/name';

import * as Unina from 'unina';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Run this suite only if the environmental variable is appropriately set.
const { UNINA_TEST_COMPLETE_UCD } = process.env;
if (UNINA_TEST_COMPLETE_UCD) {
  // In this case, the environment variable is set to a non-blank value, so we
  // will run the suite.

  // Extract name ranges from the [Unicode Character Database source
  // files][UCD].
  //
  // [UCD]: ../../src/node/ucd/
  const nameRangeArray = await extractNameRanges();

  test('getting special bad names → values', () => {
    // For historical reasons, `UnicodeData.txt` uses the string `<control>` to
    // indicate the names of certain control characters, but `<control>` is not
    // an actual Unicode name.
    it('returns no value with “<control>” input', () => {
      const inputName = '<control>';
      assert.equal(
        Unina.get(inputName),
        undefined,
      );
    });
  });

  // This is an array of data entries for every single Unicode name, each of
  // the form `{ value, name, nameType }`:
  //
  //     [
  //       { value: '\x00', name: 'NULL', nameType: 'control' },
  //       { value: '\x00', name: 'CONTROL-0000', nameType: 'label' },
  //       { value: '\x00', name: 'NUL', nameType: 'abbreviation' },
  //       { value: '\x01', name: 'START OF HEADING', nameType: 'control' },
  //       { value: '\x01', name: 'CONTROL-0001', nameType: 'label' },
  //       { value: '\x01', name: 'SOH', nameType: 'abbreviation' },
  //       { value: '\x02', name: 'START OF TEXT', nameType: 'control' },
  //       { value: '\x02', name: 'CONTROL-0002', nameType: 'label' },
  //       …
  //     ]
  const originalNameDataArray = nameRangeArray
    .map(nameRange => Array.from(NameRangeData.genDataObjects(nameRange)))
    .flat();

  // This is a map from named string values to arrays of sorted name entries:
  //
  //     Map() {
  //       '\x00' ⇒ [
  //         [ 'NULL', 'control' ],
  //         [ 'CONTROL-0000', 'label' ],
  //         [ 'NUL', 'abbreviation' ]
  //       ],
  //       '\x01' ⇒ [
  //         [ 'START OF HEADING', 'control' ],
  //         [ 'CONTROL-0001', 'label' ],
  //         [ 'SOH', 'abbreviation' ]
  //       ],
  //       …
  //     }
  const originalValueToNameEntriesMap =
    NameRangeData.groupToMapByValues(originalNameDataArray);

  // We test that the UninaLibrary can access every single Unicode name defined
  // by the UCD (of which there are more than 285,000). We also test that it
  // can retrieve every named Unicode value by its name. (These tests are
  // dependent on the [`#node/extractor` module][] correctly extracting every
  // name range from the UCD files, as well as the [`#js/name-range` module][]
  // correctly generating every name and value covered by each name range; if
  // either of those modules do not work correctly, then this suite’s tests
  // might miss bugs in UninaLibrary itself.)
  //
  // [`#node/extractor` module]: ../../src/node/extractor.mjs [`#js/name-range`
  // module]: ../../src/js/name-range.mjs

  test('getting names → values', () => {
    for (const { value, name, nameType } of originalNameDataArray) {
      it(`gets value for name “${ name }”`, () => {
        assert.equal(
          Unina.get(name),
          value,
        );
      });
    }
  });

  test('getting values → name entries', () => {
    for (const [ value, nameEntryArray ] of originalValueToNameEntriesMap) {
      it(`gets name entries for ${ JSON.stringify(value) }`, () => {
        assert.deepEqual(
          Unina.getNameEntries(value),
          nameEntryArray,
        );
      });
    }
  });
}
