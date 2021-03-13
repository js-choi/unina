# Source code
The source code of this project contains:

* **[Universal JavaScript modules][]** which can run in any JavaScript host
  environment, including both web browsers and Node.
* **[Node modules][]** which run in Node only.
* **[UCD files][]** from the Unicode Character Database.

Note that the [scripts directory][] also contains some executable Node scripts.

[Universal JavaScript modules]: ./js/
[Node modules]: ./node/
[UCD files]: ./ucd/
[scripts directory]: ../scripts/

## Terminology
This codebase consistently uses the following terminology for clarity.

As defined in the [Unicode Standard][], a **code point** is an integer between
`0` and `0x10_FFFF` – this range of `16**5 + 16**6` (or 17,825,792) unsigned
integers is also called the Unicode **codespace**. We represent code points
with **hexes** (upper-case hexadecimal strings); two hexes (`16**2`) make up
one byte (`2**8`).

Each code point **encodes** one of three things:
* A **scalar character**,
* A **noncharacter**, or
* A **UTF-16 surrogate**

– or the code point may yet be **unassigned**.

A **UTF-16 surrogate** is a code point that is between `D800` and `DFFF`. There
are therefore `16**4 - (16**2 + 8 * 16**3)` (or 32,512) UTF-16 surrogates.
UTF-16 surrogates are not characters, and they are not even valid code points
on their own, in well-formed Unicode text. They are used only as special byte
units to encode large code points in a certain form of Unicode, UTF-16.

A code point that is not a UTF-16 surrogate is also called a **scalar**;.
A scalar always encodes a scalar character or a noncharacter – or is yet
unassigned. We will prefer the term “scalar” where possible.

A **character** is a string that represents a single unit of writing.

Most characters that we care about are encoded by *single* scalars, which we
call **scalar characters**. All scalar characters have at least one name. In
addition, we can refer to scalar characters by `U+` with their code points’ hex
codes, like `U+0000` or `U+10FFFF`.

Note that not all characters are encoded by only single scalars. **Named
character sequences** – which are encoded by sequences of scalars – are also a
type of character, in the sense that they are string that each represent a
single unit of writing. They are characters in the same way that precomposed
characters (which are encoded by single scalars but may decompose into
character sequences) are also characters. Our algorithms will often split each
named character sequence into its single **head scalar** (the zeroth scalar in
the sequence) and their **tail scalars** (the rest of the scalars in the
sequence).

A **noncharacter** is a code point reserved for usage internally within an
computer system. They are not meant to mean any character but are rather meant
to be useful as “sentinel values” for internal string manipulation.
Noncharacters occur in a regular pattern: they are `FFFE` and `FFFF`, `1FFFE`
and `1FFFF`, `2FFFE` and `2FFFF`, and so on, until `10FFFE` and `10FFFF`.

A **private-use character** is a character to which the Unicode Standard itself
has given no specific meaning. It can be freely used for any purpose. There are
three sets of private-use characters: `U+E000`–`F900` (totaling 6,400),
`U+F0000`–`FFFFD` (totaling 65,534), and `U+100000`–`10FFFD` (totaling 65,534).

When we combine names of many different types (including UTF-16 surrogates)
together, we will refer to their code points as **head points**. The head point
of a named character sequence is its head scalar.

A character may have zero or more **character names**, which includes strict
character names, character name aliases, and the names of named character
sequences.

Every scalar character has one **strict character name** that is defined as its
**`Name`/`na` property**, as declared by the [Unicode Standard][]’s clause D4
(in Chapter 3) and § 4.8 Name (in Chapter 4). For example, the strict character
name of `U+0020` is “SPACE”, and the strict character name of `U+0021` is
“EXCLAMATION MARK”.

[Unicode Standard]: https://www.unicode.org/versions/Unicode14.0.0/

Every scalar character also has zero or more **character name aliases**. For
example, `U+0020` has one alias: the abbreviation `SP`. In contrast, `U+0021`
has no aliases.

Several characters made of multiple scalars are **named character sequences**,
which have their own unique names.

For each named character sequence, any scalars following its first scalar are
its **tail scalars**. It is notable that many named character sequences share
the same tail scalars, varying only in their first code scalars. For instance,
all Keycap named character sequences share the same tail `U+FE0F 20E3`.

Lastly, many scalar characters (and all noncharacters and UTF-16 surrogates) do
not have any strict character name. These include the control characters,
private-use characters, UTF-16 surrogates, noncharacters, and reserved
characters. The Standard therefore gives them **code-point labels** such as
`CONTROL-0009` for `U+0009`, `SURROGATE-D800` for `U+D800`, and
`NONCHARACTER-FFFF` for `U+FFFF`.

Character names and code-point labels are collectively called **Unicode
names**. Other libraries sometimes call these `uname`s.

Lastly, in order to distinguish general Unicode strings from Unicode strings
that have names, we call the latter **named Unicode values**. We avoid simply
calling named Unicode values “characters” because not all named Unicode values
are characters – i.e., the UTF-16 surrogates and the noncharacters.

## License
This documentation is subject to the [Mozilla Public License v2.0][MPL].

[MPL]: https://mozilla.org/MPL/2.0/
