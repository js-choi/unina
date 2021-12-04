// # Name entries
// This universal module exports utilities for sorting **name types**.
// A name type is one of the following values:
// * `'correction'` for when a character name is a correction alias.
// * `null` for when a character name is a strict Name property value.
// * `'sequence'` for when a character name signifies a named character
//   sequence.
// * `'control'` for when a character name is a control alias.
// * `'alternate'` for when a character name is an alternate alias.
// * `'label'` for when a character name is a code-point label like
//   `'control-0000'`.
// * `'figment'` for when a character name is a figment alias.
// * `'abbreviation'` for when a character name is an abbreviation alias.
//
// This source code is subject to the [Mozilla Public License v2.0][MPL].
// [MPL]: https://mozilla.org/MPL/2.0/

const nameTypeOrder = [
  'correction', null, 'sequence',
  'control', 'alternate', 'label', 'figment', 'abbreviation',
];

// Compares two name types by order of name-type preference.
export function compareNameTypes (nameType0, nameType1) {
  if (nameType0 === nameType1)
    return 0;
  else {
    for (const preferredNameType of nameTypeOrder) {
      if (nameType0 === preferredNameType)
        return -1;
      else if (nameType1 === preferredNameType)
        return +1;
    }
  }
}
