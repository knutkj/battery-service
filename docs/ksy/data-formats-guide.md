# Guide for the Kaitai Struct JSON schema

## 🧭 Top-Level Structure

A valid KSY JSON file is a JSON object with the following top-level fields:

| Field       | Required | Type                       | Description                        |
| ----------- | -------- | -------------------------- | ---------------------------------- |
| `meta`      | ✅ Yes   | Object                     | Metadata about the format          |
| `doc`       | ❌ No    | String                     | Description of the format          |
| `doc-ref`   | ❌ No    | String or Array of Strings | External references                |
| `params`    | ❌ No    | Array                      | Parameters passed into this format |
| `seq`       | ❌ No    | Array                      | Main sequence of parsed fields     |
| `types`     | ❌ No    | Object                     | Nested user-defined types          |
| `instances` | ❌ No    | Object                     | Lazily-evaluated fields            |
| `enums`     | ❌ No    | Object                     | Enumerations for values            |

## 🧾 `meta` Section

```json
{ "meta": { "id": "my_format" } }
```

The `meta` section provides metadata about the Kaitai Struct format, including a
required `id` that uniquely identifies the format and optional fields like
`title`, `application`, `file-extension`, and `ks-version`. It also allows
setting global parsing options such as `encoding` and `endian`, and specifying
external references through `xref`. This section does not affect the parsing
logic itself but informs tools, documentation, and compilers about the format's
identity, expected environment, and intended usage.

| Field             | Required | Type                             | Description                             |
| ----------------- | -------- | -------------------------------- | --------------------------------------- |
| `id`              | ✅ Yes   | String                           | Unique identifier for the format        |
| `title`           | ❌ No    | String                           | Human-readable title                    |
| `application`     | ❌ No    | String or Array                  | Applications that use this format       |
| `file-extension`  | ❌ No    | String or Array                  | Associated file extensions              |
| `encoding`        | ❌ No    | String                           | Default character encoding              |
| `endian`          | ❌ No    | `"le"` / `"be"` or switch object | Default byte order                      |
| `ks-version`      | ❌ No    | String or Number                 | Minimum required Kaitai Struct version  |
| `ks-debug`        | ❌ No    | Boolean                          | Enable debug mode                       |
| `ks-opaque-types` | ❌ No    | Boolean                          | Ignore unresolved types                 |
| `imports`         | ❌ No    | Array of Strings                 | Import other KSY files                  |
| `xref`            | ❌ No    | Object                           | Cross-references to external registries |
| `license`         | ❌ No    | String                           | License info                            |

## 📐 `seq` Section

```json
{ "seq": [{ "id": "magic", "type": "u4" }] }
```

The `seq` section defines the main sequence of fields to be parsed in order from
the input stream. Each entry describes one field, including its `id` (required),
type, size, conditions for inclusion (`if`), repetition (`repeat`), and other
parsing behaviors. These fields are read in the order listed, forming the core
structure of the format. The `seq` section is essential for representing formats
with a linear, fixed parsing order and is where most data structure definitions
begin in a Kaitai Struct schema.

| Field         | Required | Type                                | Description                                  |
| ------------- | -------- | ----------------------------------- | -------------------------------------------- |
| `id`          | ✅ Yes   | String                              | Name of the field                            |
| `type`        | ❌ No    | String/Object                       | Field type or conditional type               |
| `size`        | ❌ No    | Number/String                       | Number of bytes (if type not specified)      |
| `repeat`      | ❌ No    | String (`"expr"`/`"eos"`/`"until"`) | Whether field repeats                        |
| `repeat-expr` | ❌ No    | Number/String                       | Number of repetitions if `repeat: "expr"`    |
| `contents`    | ❌ No    | String or Array                     | Fixed expected content                       |
| `if`          | ❌ No    | Boolean/String                      | Conditional parsing                          |
| `enum`        | ❌ No    | String                              | Enum type path                               |
| `doc`         | ❌ No    | String                              | Description                                  |
| `encoding`    | ❌ No    | String                              | Encoding name                                |
| `process`     | ❌ No    | String                              | Processing filter (`xor(...)`, `zlib`, etc.) |

## 🧬 `types` Section

```json
{ "types": { "header": { "seq": [{ "id": "version", "type": "u2" }] } } }
```

The `types` section defines named, reusable substructures (types) within a
Kaitai Struct format. Each entry maps a type name to a definition that can
include its own `seq`, `params`, `instances`, `enums`, or even nested `types`.
These types act like classes in programming languages and can be referenced by
name elsewhere in the format, including within the main `seq` or in other
`types`. This allows complex formats to be modeled in a modular and hierarchical
way, improving clarity and reuse.

| Field       | Required | Type         | Description                |
| ----------- | -------- | ------------ | -------------------------- |
| `meta`      | ❌ No    | Object       | Metadata for this type     |
| `params`    | ❌ No    | Array        | Parameters for the type    |
| `seq`       | ❌ No    | Array        | Main sequence in this type |
| `types`     | ❌ No    | Object       | Subtypes                   |
| `enums`     | ❌ No    | Object       | Enums in this type         |
| `instances` | ❌ No    | Object       | Lazily-loaded fields       |
| `doc`       | ❌ No    | String       | Description                |
| `doc-ref`   | ❌ No    | String/Array | Reference to documentation |

## 🏷 `params`, `enums`, `instances`

The `params`, `enums`, and `instances` sections provide extensibility and
precision in defining Kaitai Struct formats. `params` allows a type to accept
input parameters—useful for defining variable-length or context-dependent
fields. `enums` defines named mappings from numeric constants to symbolic names,
enhancing readability and supporting symbolic interpretation of field values.
`instances` describes calculated or lazily-parsed fields that aren’t read in
sequence but are instead computed or located on demand, often using offsets or
expressions. Together, these sections enable more expressive and modular binary
format definitions.

### `params` (for parameterized types)

```json
{ "params": [{ "id": "entry_count", "type": "u2" }] }
```

The `params` section defines input parameters for a type, allowing it to be
parameterized when used in other contexts. Each parameter has an `id` (required)
and may specify a `type`, `enum`, and documentation. These parameters can
control parsing behavior dynamically—for example, specifying the length of a
field or selecting a conditional branch. This mechanism enables the reuse of
types in different contexts by passing in values that influence how the type
interprets the binary data.

| Field  | Required | Type   | Description    |
| ------ | -------- | ------ | -------------- |
| `id`   | ✅ Yes   | String | Parameter name |
| `type` | ❌ No    | String | Parameter type |
| `enum` | ❌ No    | String | Enum path      |
| `doc`  | ❌ No    | String | Description    |

### `enums`

```json
{ "enums": { "file_type": { "0": "binary", "1": "text" } } }
```

The `enums` section defines symbolic names for numeric constants used in the
format, mapping integers to meaningful labels. This improves readability and
maintainability by allowing fields to be interpreted as named values rather than
raw numbers. Enums are defined as objects where each key is a numeric value (as
a string) and the value is either a symbolic name or an object containing an
`id` and optional metadata like `doc`. These enums can be referenced in `seq`,
`params`, or `instances` by using the `enum` field, making it easier to
interpret values in a human-friendly way.

### `instances`

The `instances` section defines fields that are computed or parsed on demand
rather than as part of the main sequential flow (`seq`). These are typically
used for data located at known offsets, requiring a seek (`pos`), or for values
derived through expressions (`value`). Each instance behaves like a
lazily-evaluated property: it's only read or computed when accessed. Instances
can be used to expose footer structures, index tables, or checksums that aren't
naturally part of the main stream, allowing complex formats to be modeled
cleanly without disrupting sequential parsing logic.

```json
{ "instances": { "footer": { "pos": "size - 4", "type": "u4" } } }
```

| Field    | Required | Type   | Description                                        |
| -------- | -------- | ------ | -------------------------------------------------- |
| `pos`    | ❌ No    | String | Offset to seek                                     |
| `type`   | ❌ No    | String | Type to parse                                      |
| `value`  | ❌ No    | Any    | Calculated value                                   |
| _Others_ | ❌ No    | —      | Same fields as in `seq` (e.g. `doc`, `if`, `enum`) |
