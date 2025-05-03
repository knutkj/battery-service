# Using Kaitai Struct to Describe Z-Wave Binary Formats

This document explains the purpose and intent behind the data format description
files in this repository. It provides background for contributors and serves as
a reference point for others interested in using declarative description
languages to document binary protocols—specifically Z-Wave.

## Motivation

Z-Wave is a wireless communication protocol used in smart home devices. While
many aspects of Z-Wave are documented in official specifications such as ITU-T
G.9959, much of the practical detail—especially at the binary level—is
fragmented, implicit, or reverse-engineered. This project aims to fill that gap.

By using a formal description language to model Z-Wave's binary formats, this
repository becomes a reference point for understanding the protocol and a
foundation for building tools and analysis pipelines. Rather than hard-coding
binary layouts in imperative code, each format is defined once, declaratively,
and can be interpreted by tooling.

## What This Repository Contains

This repository contains JSON files that describe the structure of
Z-Wave–related binary formats using the [Kaitai Struct](https://kaitai.io/)
language. These specifications aim to be:

- **As complete as possible** We attempt to model every meaningful field and
  substructure, including control flags, checksums, conditionally present
  segments, and embedded payloads.

- **Accurate and precise** Structures are based on reverse engineering, official
  documentation, and observed artifacts (e.g. captured packets or extracted
  binary files).

- **Human-readable and tool-friendly** We use JSON format (rather than YAML) to
  allow for processing in JavaScript-based tools and consistent validation
  against Kaitai’s schema.

- **Focused on Z-Wave** The scope includes any binary format encountered in the
  Z-Wave ecosystem. That includes protocol-level packets (e.g. MPDU, MHR),
  diagnostic file formats like `.zlf`, and—potentially—higher-level structures
  if needed.

## Audience

This document is written for:

- **Contributors** who want to add or improve format descriptions
- **Reverse engineers** seeking an entry point into Z-Wave internals
- **Protocol enthusiasts** interested in how declarative formats can model
  real-world binary protocols
- **Tool developers** looking to build on top of a structured understanding of
  Z-Wave data

No prior experience with Kaitai Struct is assumed, though some familiarity with
binary parsing or protocol analysis may help.

## Why Kaitai Struct?

Kaitai Struct is a declarative language for describing binary structures. It
supports:

- Bitfields and byte-aligned fields
- Conditionals (`switch-on`)
- Nested types and sequences
- Derived values (`instances`)
- Code generation for multiple languages
- Visual exploration via [Web IDE](https://ide.kaitai.io)

We chose Kaitai because it balances expressiveness and accessibility, and
because its output is usable across platforms and programming environments.

## Design Choices

- **File format**: We use JSON files matching the
  [Kaitai Struct JSON schema](https://github.com/kaitai-io/ksy_schema/blob/master/ksy_schema.json)
  to describe all data structures.
- **Model completeness**: We strive to express all known fields and behaviors,
  including control flags, header types, lengths, and checksums.
- **Read-only focus**: All specifications are built for parsing (not writing)
  binary data.
- **Reverse engineering basis**: Many structures are derived from observed
  real-world data, supported by official specifications when available.
- **Canonical artifacts**: Example data such as `.zlf` files and raw packet
  dumps guide the structure definitions. These artifacts may be included or
  referenced elsewhere in the repository.

## Example: Z-Wave MPDU Header

One of the first structures modeled is the Z-Wave MAC Protocol Data Unit (MPDU)
header. This is a 9-byte segment that includes the Home ID, source and
destination node IDs, frame control flags, and a total length. Its binary layout
varies slightly by header type, making it a good example of Kaitai Struct’s
ability to handle conditional decoding and bitfield parsing.

## Contribution Guidance

Contributors should follow these general principles:

- Use **JSON** format only (no `.ksy` YAML files).
- Prefer **explicit modeling** of all fields, even those not fully understood.
- Add **short documentation strings** (`doc`) to clarify purpose where known.
- Use **motivating artifacts** (packet logs, file dumps) to justify and verify
  structures.
- Maintain **naming consistency** where possible (e.g. snake_case field names,
  matching Kaitai conventions).

This document may not be updated frequently, but the repository will evolve as
understanding of Z-Wave improves. New binary structures will be added over time.

## Summary

This repository provides a foundation for understanding Z-Wave at the binary
level using a structured, declarative approach. Kaitai Struct enables accurate
modeling of real-world data formats, and we hope these specifications prove
useful to contributors, researchers, and developers alike.

If you're interested in the internals of Z-Wave or in building parsers for
proprietary formats, this is a good place to start.

## Appendix

### Naming Rules in Kaitai Struct

All identifiers (e.g., `id`, `type`, `enum`, `instances`, and all enum values)
must follow these strict rules in both JSON and YAML:

- Must start with a lowercase letter: `a–z`
- Can contain only lowercase letters, digits, and underscores: `[a-z0-9_]`
- Must match the regex: `^[a-z][a-z0-9_]*$`

**Invalid:** `HomeId`, `srcNodeID`, `frame-control`, `AckRequested`,
`Singlecast`  
**Valid:** `home_id`, `src_node_id`, `frame_control`, `ack_requested`,
`singlecast`

Using camelCase, PascalCase, or dashes will result in a parsing error. Enum
values must also use snake_case.
