# Name ranges
A **name range** is an object that represents (“covers”) a set of named Unicode
values and the values’ names, such that the values have **contiguous head
points** and the names **conform to the same name-counter rule**.

Name ranges are useful for building, testing, and benchmarking the database,
although the database itself does not necessarily use name ranges.

Each name range has the following properties:

* `initialHeadPoint`: An integer. The **head point** of a name is its value’s
  zeroth scalar or – if it is the label of a UTF-16 surrogate – that
  surrogate’s code point. The **initial head point** of a name *range* is its
  *initial* name’s head point. (For a name range over named character
  sequences, this is the zeroth character sequence’s zeroth scalar.) The
  **final head point** of a name range is the sum of its initial head point and
  its length.

* `length`: An optional integer. This is how many names are in this range. By
  default, this is `1`.

* `nameStem`: A string. All names in a name range start with the same **name
  stem**, which is then followed by a **name counter** that is derived from the
  name’s head point and the name’s name-counter type.

* `nameCounterType`: An optional string that must be one of the name-counter
  types (which are all string constants) that are defined in the
  [`#js/name-counter` module][].

* `nameType`: An optional string that must be one of the name types (which are
  all string constants) that are defined in the [`#js/name` module][]. If this
  property is absent, then the name range’s name(s) are strict character names
  (i.e., null name types).

* `tailScalarArray`: An optional array of scalar integers that is present only
  if the name range is over named character sequence(s). **Tail scalars** are
  the remaining scalar that follow each named character sequence’s head point.
  All named character sequences that are under the same name range must share
  the same tail scalars.

[`#js/name-counter` module]: ../name-counter.mjs
[`#js/name` module]: ../name.mjs

For example, the following two name ranges each contain only one name for one
named value:
```js
{
  initialHeadPoint: 0x28,
  nameStem: 'LEFT PARENTHESIS',
}
```
```js
{
  initialHeadPoint: 0x100,
  nameStem: 'LATIN CAPITAL LETTER A WITH MACRON AND GRAVE',
  nameType: 'sequence',
  tailScalarArray: [ 0x300 ],
}
```

In contrast, this name range contains 6400 (`0x1900`) names for 6,400
characters, starting with `'PRIVATE-USE-E000'`, and ending with
`'PRIVATE-USE-18FF'`:
```js
{
  initialHeadPoint: 0xE000,
  length: 0x1900,
  nameStem: 'PRIVATE-USE',
  nameCounterType: NameCounter.hyphenHexType,
}
```

Name ranges are sorted first by `initialHeadPoint`, then by `tailScalarArray`
(objects without `tailScalarArray`s are sorted before objects that do, after
which the `tailScalarArray`s are stringified and compared lexicographically),
then by `nameType` (as per the `compareTypes` function from the '#js/name'
module).

A name range that covers only one name and one named value is a **singleton
range**; otherwise it is a **multiplex** range.

The universal modules in this directory deal with name ranges:

*[`#js/name-range/comparator`](./comparator.mjs)* exports a function that
compares name ranges for sorting.

*[`#js/name-range/name-data`](./name-data.mjs)* exports a function that
generates data about individual names or named Unicode values from name ranges.

*[`#js/name-range/ucd`](./ucd.mjs)* exports a function that generates name
ranges from UCD files (This module does not manage fetching the UCD source
files; the source files’ data have to be supplied as arguments to this module’s
functions.)

This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
