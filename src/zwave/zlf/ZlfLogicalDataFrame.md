# `ZlfLogicalDataFrame` Implementation Status

**Date**: 2025-05-01 (Corrected)

This document describes the current implementation status of the
`ZlfLogicalDataFrame` class, which reconstructs Logical Data Frames (LDFs) by
merging a base ZLF Data Frame with any continuation frames. It shows which
fields are correctly parsed, skipped, or explicitly unimplemented.

- ✅ = Implemented / Parsed
- ❌ = Unimplemented / Ignored
- ⚠️ = Throws or explicitly marked as not implemented

## LDF Payload Layout (Z-Wave Data Frame)

| Offset(s) | Size      | Field Name            | Status                              |
| --------- | --------- | --------------------- | ----------------------------------- |
| 0         | 1 byte    | `Message Type`        | ✅ (validated by constructor)       |
| 1         | 1 byte    | `Frame Type`          | ❌ (not parsed or exposed)          |
| 2–3       | 2 bytes   | `Reserved`            | ❌ (not parsed)                     |
| 4         | 1 byte    | `Channel / Speed`     | ✅ (`channel()` and `speed()`)      |
| 5         | 1 byte    | `Region`              | ⚠️ (`region` accessor throws)       |
| 6         | 1 byte    | `RSSI`                | ✅ (`rssi`)                         |
| 7–8       | 2 bytes   | `Length Marker`       | ⚠️ (`lengthMarker` accessor throws) |
| 9         | 1 byte    | `MPDU Length`         | ❌ (available via `payload()` only) |
| 10–13     | 4 bytes   | `Home ID`             | ✅ (`homeId`)                       |
| 14        | 1 byte    | `Source Node ID`      | ✅ (`sourceNodeId`)                 |
| 15        | 1 byte    | `Frame Control (LSB)` | ❌ (not parsed)                     |
| 16        | 1 byte    | `Frame Control (MSB)` | ❌ (not parsed)                     |
| 17        | 1 byte    | `Payload Length`      | ❌ (not parsed)                     |
| 18        | 1 byte    | `Destination Node ID` | ✅ (`destinationNodeId`)            |
| 19+       | variable  | `Application Payload` | ❌ (treated as opaque blob)         |
| Tail      | 1–2 bytes | `Checksum`            | ❌ (not validated)                  |

## Frame Metadata (Outer ZLF Frame Structure)

| Field Name        | Size    | Status                                   |
| ----------------- | ------- | ---------------------------------------- |
| `Timestamp`       | 8 bytes | ✅ (`timestamp`)                         |
| `Control Byte`    | 1 byte  | ✅ (`control`, `direction`, `sessionId`) |
| `Payload`         | N bytes | ✅ (`payload`)                           |
| `Trailing Marker` | 1 byte  | ❌ (not read)                            |

## Logical Data Frame Metadata

| Field Name     | Description                           | Status |
| -------------- | ------------------------------------- | ------ |
| `frames`       | All `ZlfFrame` instances contributing | ✅     |
| `sourceFrames` | Alias for `frames`                    | ✅     |
| `type`         | Constant string `"ldf"`               | ✅     |
| `payload`      | Concatenated MPDU and checksum bytes  | ✅     |
| `timestamp`    | Taken from last frame in sequence     | ✅     |

## Unimplemented Features

| Feature                  | Reason or Notes                                           |
| ------------------------ | --------------------------------------------------------- |
| `region` accessor        | Not visible in Zniffer UI; method throws if accessed      |
| `lengthMarker` accessor  | Not always present; method throws                         |
| Frame Control parsing    | MAC flags not needed in current decoding layer            |
| MPDU length / Frame type | Not exposed via high-level API                            |
| Checksum validation      | Required but not implemented yet                          |
| Payload decoding         | Considered out of scope for this low-level reassembly API |
