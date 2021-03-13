// # Noncharacter name ranges
// This universal module exports a function that generates name ranges for all
// noncharacters. For information on name ranges, see the [name-range
// readme][].
//
// [name-range readme]: ./README.md
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

import * as NameCounter from '#js/name-counter';
import * as Name from '#js/name';
import { getInteger } from '#js/util/hex';
import * as IterableUtil from '#js/util/iterable';

// There is a range of 32 noncharacters starting inclusively at `U+FDD0` and
// ending inclusively at `U+FDEF`.
export const noncharacterRangeFromFDD0 = {
  initialHeadPoint: 0xFDD0,
  length: 0x20,
  nameStem: 'NONCHARACTER',
  nameCounterType: NameCounter.hyphenHexType,
  nameType: Name.labelType,
};

const sizeOfPlane = 0x1_0000;
const numOfPlanes = 0x11; // There are seventeen Unicode planes.

// This generator yields name ranges for all noncharacters. In addition to the
// 47 noncharacters defined by `noncharacterRangeFromFDD0`, there are two
// noncharacters at the end of each Unicode plane containing `0x1_0000`
// integers: `U+FFFE` and `U+FFFF`, `U+1FFFE` and `U+1FFFF`, `U+2FFFE` and
// `U+2FFFF`, …, up to `U+10FFFE` and `U+10FFFF`.
export default function * generate () {
  yield noncharacterRangeFromFDD0;
  for (const planeIndex of IterableUtil.range(0, numOfPlanes)) {
    yield {
      // This is `0x0_FFFE`, `0x1_FFFE`, `0x2_FFFE`, etc.
      initialHeadPoint: planeIndex * sizeOfPlane + sizeOfPlane - 2,
      length: 2,
      nameStem: 'NONCHARACTER',
      nameCounterType: NameCounter.hyphenHexType,
      nameType: Name.labelType,
    };
  }
}
