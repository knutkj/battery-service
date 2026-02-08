# Z-Wave Device ID

Every certified Z-Wave device carries a three-field identification triplet
reported by the **Manufacturer Specific Command Class** (CC 0x72). This article
explains what the fields are, where they come from, and how to use them.

## The three fields

| Field           | Size   | Assigned by             | Example  |
| --------------- | ------ | ----------------------- | -------- |
| Manufacturer ID | 16-bit | Z-Wave Alliance         | `0x0086` |
| Product Type ID | 16-bit | The device manufacturer | `0x0002` |
| Product ID      | 16-bit | The device manufacturer | `0x0064` |

Together they form a device ID such as `0086-0002-0064` — an Aeotec
MultiSensor 6.

**Manufacturer ID** is assigned centrally by the Z-Wave Alliance (administered
by Silicon Labs). Each manufacturer receives a unique 16-bit value. The full
registry is not publicly downloadable, but community databases like the
[zwave-js device config][zwave-js-config] maintain comprehensive mappings.

**Product Type ID** and **Product ID** are chosen by the manufacturer. There is
no prescribed scheme — some manufacturers use sequential numbers, others encode
hardware revisions or regional variants. The two fields together identify a
specific product within a manufacturer's portfolio.

## How the device ID is obtained

A Z-Wave controller gets the device ID by sending a **Manufacturer Specific
Get** command (0x72 0x04). The device responds with a **Manufacturer Specific
Report** (0x72 0x05) containing all three fields in a 6-byte payload:

```
┌──────────────────┬──────────────────┬──────────────────┐
│  Manufacturer ID │  Product Type ID │  Product ID      │
│  (2 bytes, BE)   │  (2 bytes, BE)   │  (2 bytes, BE)   │
└──────────────────┴──────────────────┴──────────────────┘
```

This exchange normally happens during the **device interview** — the automated
query sequence a controller runs after including a new node. Battery-powered
devices are only reachable when awake, so the interview happens during inclusion
or on the next wakeup.

A passive sniffer (like the Zniffer) can capture this exchange if it happens
during the trace. The same three fields also appear in the **Node Information
Frame** (NIF) on some controller implementations.

## What the device ID is used for

The device ID is the primary key for looking up device-specific information:

- **Device configuration databases** — [zwave-js][database-article], OpenZWave,
  and OpenSmartHouse all use the triplet to match a node to its configuration
  file (parameters, associations, quirks).
- **Product catalog lookup** — the [Z-Wave Alliance Product Catalog][catalog]
  lists every certified device with photos, specs, and certification details.
  See the [Alliance catalog article][alliance-catalog] for lookup strategies.
- **Firmware updates** — the Firmware Update CC uses the manufacturer ID and a
  firmware ID to identify the correct image.

## Terminology

The Z-Wave specification names each field individually but does not give the
combination a collective term. In practice:

| Term                | Used by                                  |
| ------------------- | ---------------------------------------- |
| Device ID           | zwave-js (`DeviceID` interface)          |
| config fingerprint  | zwave-js telemetry (informal)            |
| fingerprint         | Home Assistant, community databases      |
| Product ID (TLV)    | SmartStart QR provisioning specification |
| vendor/product info | Z-Way documentation                      |

This project uses **"device ID"** for the triplet and spells out the individual
fields as Manufacturer ID, Product Type ID, and Product ID.

## Version 2: Device Specific Get

Version 2 of the Manufacturer Specific CC added the **Device Specific Get/
Report** commands (0x72 0x06/0x07), which return a device-unique serial number.
The serial number type is specified by a `DeviceIdType` parameter:

| Type | Name          | Format               |
| ---- | ------------- | -------------------- |
| 0    | OEM Factory   | Manufacturer-defined |
| 1    | Serial Number | UTF-8 or hex string  |

This is distinct from the device ID — it identifies a specific physical unit,
not a product line.

## Examples from a real network

| Device ID        | Manufacturer          | Product               |
| ---------------- | --------------------- | --------------------- |
| `0176-0005-0001` | Telldus (`0x0176`)    | TZDW-100 door sensor  |
| `0086-0002-0064` | Aeotec (`0x0086`)     | MultiSensor 6 (ZW100) |
| `0260-8001-1000` | Heiman (`0x0260`)     | HS1MS-Z motion sensor |
| `010f-0c02-1003` | Fibaro (`0x010f`)     | FGSD-002 smoke sensor |
| `0060-0004-0007` | Everspring (`0x0060`) | AN15x plug-in switch  |
| `0438-0202-0002` | Namron (`0x0438`)     | Switch/dimmer module  |

These are the actual devices in the cabin network (TellStick ZNet Lite v2, Home
ID `C4A815CD`). The device ID was obtained from the TellStick API's `model`
field, which encodes the triplet as `<productType>:<productId>` under a
manufacturer-keyed protocol string.

### Brand vs manufacturer ID

The manufacturer ID identifies the silicon and firmware origin, not necessarily
the retail brand. Two patterns cause mismatches:

- **OEM / rebrand** — NEXA sells Everspring hardware under its own brand. Those
  devices report `0x0060` (Everspring), not `0x0268` (Nexa Trading AB). Only
  NEXA's own designs (like the NEXA Bridge) use `0x0268`.
- **Acquisitions** — Fibaro was acquired by Nice Group. The manufacturer ID
  `0x010f` is now registered to Nice Polska Sp. z o.o., though existing devices
  still report the original ID and the Fibaro brand name remains in common use.

The [Alliance catalog][alliance-catalog] groups products by brand name, so
searching for "NEXA" returns products under both `0x0060` and `0x0268`. See the
[catalog article's observations][catalog-observations] for more on brand/ID
mismatches.

[zwave-js-config]:
  https://github.com/zwave-js/zwave-js/tree/master/packages/config
[catalog]: https://products.z-wavealliance.org/
[alliance-catalog]: zwave-alliance-product-catalog.md
[catalog-observations]: zwave-alliance-product-catalog.md#observations
[database-article]: zwave-js-device-config-database.md
