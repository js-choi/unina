// # Name utilities
// This universal module exports utilities that sorting Unicode names and
// fragments of Unicode names, as well as “name types”.
//
//! This source code is subject to the [Mozilla Public License v2.0][MPL].
//!
//! [MPL]: https://mozilla.org/MPL/2.0/

// This collator’s `compare` method lexicographically compares two names or
// name fragments, using a Default Unicode Collation Element Table collator,
// and returning a negative number, zero, or a positive number.
export const collator = new Intl.Collator('ducet');

// ## Name types
// A **name type** is one of the following constant values – or `null`. (`null`
// indicates that a Unicode name is a strict character name – i.e., the Name
// character property.)

// This constant indicates that a Unicode name is a correction alias.
export const correctionType = 'correction';

// This constant indicates that a Unicode name signifies a named character
// sequence.
export const sequenceType = 'sequence';

// This constant indicates that a Unicode name is a code-point label like
// `'control-0000'`.
export const labelType = 'label';

// This constant indicates that a Unicode name is a control alias.
export const controlType = 'control';

// This constant indicates that a Unicode name is a alternate alias.
export const alternateType = 'alternate';

// This constant indicates that a Unicode name is a figment alias.
export const figmentType = 'figment';

// This constant indicates that a Unicode name is a abbreviation alias.
export const abbreviationType = 'abbreviation';

const nameTypeOrder = [
  correctionType,
  null,
  sequenceType,
  controlType,
  alternateType,
  labelType,
  figmentType,
  abbreviationType,
];

// Compares two name types by order of name-type preference.
export function compareTypes (nameType0, nameType1) {
  if (nameType0 === nameType1) {
    return 0;
  }

  else {
    for (const preferredNameType of nameTypeOrder) {
      if (nameType0 === preferredNameType) {
        return -1;
      }

      else if (nameType1 === preferredNameType) {
        return +1;
      }
    }
  }
}

// ## Name entries
// A **name entry** is an array pair that looks like `[ name, nameType ]`,
// where `name` is an ASCII string and `nameType` is one of the name-type
// constants defined in the `name` module.
//
// Name entries are returned by the main interface of the `unina` package.
//
// Name entries are sorted first by `nameType` (as per the `compareTypes`
// function from the 'name' module), then lexicographically by `name`.

// This function compares two name entries by order of name-type preference –
// then lexicographically by name.
export function compareEntries (nameEntry0, nameEntry1) {
  const [ name0, nameType0 ] = nameEntry0;
  const [ name1, nameType1 ] = nameEntry1;
  return compareTypes(nameType0, nameType1)
    || collator.compare(name0, name1);
}
