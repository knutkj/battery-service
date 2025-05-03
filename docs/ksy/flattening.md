# Kaitai Struct Flattener – Specification v1

## Objective

This flattener transforms a `.ksy` file into a single-level `.flat.ksy`
representation with no nested types, no switch-on logic, no repetition, and no
expressions. The resulting file remains a valid Kaitai Struct specification and
preserves parsing order and semantics to the extent permitted by the supported
feature set.

## Input

- A valid Kaitai Struct `.ksy` file conforming to the \[ksy-schema.json]
  specification.
- May include nested types (`types`), instances, enums, and imports.

## Output

- A new `.ksy` file with the same contents, **flattened**, written to a filename
  ending in `_flat.ksy`.
- The `meta.id` field will be rewritten as `${original_id}_flat`.

## Flattening Rules

### 1. `types` Inlining

- Each field in `seq` or `instances` with a `type` referencing a user-defined
  type must be inlined recursively.
- Inlined fields from subtypes are **prefixed** with the name of the parent
  field, followed by an underscore.
- The `types:` block will be **removed** after inlining.

Example:

```yaml
seq:
  - id: header
    type: header_type
```

Transformed to:

```yaml
seq:
  - id: header_magic
    ...
  - id: header_length
    ...
```

### 2. `instances`

- All `instances` will be moved to `seq`, and their `pos` and `size` attributes
  preserved **only if** they are constants (i.e., not expressions).
- Names will be prefixed just like in `seq`.
- Lazy-loading behavior is lost — fields are parsed eagerly.

### 3. `enums`

- All enums are hoisted to top-level.
- Enum names are prefixed with the `meta.id` of the file they originated from.
- The `enum:` references in attributes are updated accordingly.

### 4. `imports`

- All imported types must be resolved and inlined as if they were local.
- After flattening, the `imports:` block is **removed**.

## Constraints and Unsupported Features

The following features are **not supported** in this version and will cause the
flattener to **throw immediately with an explanatory error**:

| Feature                                          | Behavior                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `switch-on`                                      | Throw: “switch-on is not supported in flattened format”                  |
| `if` conditions                                  | Throw: “conditional fields are not supported”                            |
| `repeat`                                         | Throw: “repeated fields are not supported”                               |
| Non-constant `size`, `pos`, or other expressions | Throw: “expressions in size/pos/value not supported”                     |
| Shared type references (used more than once)     | Throw: “type `foo` is referenced multiple times, reuse is not supported” |
| Value instances (`value:`)                       | Throw: “computed instances are not supported”                            |

## Output Formatting

- Output format is YAML.
- Output will be formatted using the emitting YAML library’s defaults.
- Comments in the input `.ksy` are not preserved.

## Field Ordering

- All fields in `seq`, `instances`, and `enums` will appear in the order they
  are encountered during traversal of the original spec.

## Enum Deduplication

- Enum name collisions are avoided by prefixing enum names with the `meta.id` of
  the original spec or imported file.

## Schema Validity

- The output will conform to the same schema as the input (`ksy-schema.json`),
  with a reduced subset of supported features.
