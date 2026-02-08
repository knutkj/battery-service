# The zwave-js Device Configuration Database

The [zwave-js][repo] repository contains a community-maintained device
configuration database covering 2 337 Z-Wave products from 362 manufacturers. It
maps every known [device ID][device-id] to a human-readable product name,
manufacturer, configuration parameters, association groups, and more — all in
plain JSON files that can be used independently of the zwave-js runtime.

## Repository layout

The database lives inside the `@zwave-js/config` package:

```
packages/config/config/
├── manufacturers.json        ← manufacturer ID → name (786 entries)
└── devices/
    ├── templates/            ← shared parameter templates
    ├── 0x0002/               ← Danfoss
    ├── 0x0086/               ← Aeotec (AEON Labs)
    │   ├── templates/        ← Aeotec-specific templates
    │   ├── zw100.json        ← MultiSensor 6
    │   └── ...
    ├── 0x0176/               ← Telldus Technologies AB
    │   ├── tzdw-100.json     ← Door/Window Sensor
    │   └── ...
    └── ... (362 manufacturer folders)
```

Each manufacturer gets a folder named by its hex manufacturer ID. Inside, each
product gets a JSON file named after the product model.

## manufacturers.json

A flat map from manufacturer ID (hex string) to name — 786 entries covering the
ecosystem:

```json
{
  "0x0086": "AEON Labs",
  "0x010f": "Fibargroup",
  "0x0176": "Telldus Technologies AB"
}
```

## Device configuration files

Each JSON file describes one product (simpler devices use the same structure
with fewer fields). Here is the Aeotec MultiSensor 6 — a config with regional
variants and most optional fields populated:

```json
{
  "manufacturer": "AEON Labs",
  "manufacturerId": "0x0086",
  "label": "ZW100",
  "description": "MultiSensor 6",
  "devices": [
    {
      "productType": "0x0002",
      "productId": "0x0064",
      "zwaveAllianceId": [1403, 1812, 2714]
    },
    {
      "productType": "0x0102",
      "productId": "0x0064",
      "zwaveAllianceId": [1390, 1810, 2684]
    }
  ],
  "firmwareVersion": {
    "min": "0.0",
    "max": "255.255"
  },
  "associations": {...},
  "paramInformation": [...],
  "compat": {...},
  "metadata": {
    "inclusion": "Short press the Z-Wave button...",
    "exclusion": "Short press the Z-Wave button...",
    "reset": "Press and hold for 20 seconds...",
    "manual": "https://products.z-wavealliance.org/..."
  }
}
```

### Top-level fields

| Field              | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `manufacturer`     | Human-readable manufacturer name                     |
| `manufacturerId`   | Hex manufacturer ID (e.g. `"0x0086"`)                |
| `label`            | Product model label (e.g. `"ZW100"`)                 |
| `description`      | Human-readable product name (e.g. `"MultiSensor 6"`) |
| `devices`          | Array of product type/ID variants this config covers |
| `firmwareVersion`  | Firmware version range (`min`/`max`)                 |
| `associations`     | Association group definitions (optional)             |
| `paramInformation` | Configuration parameter definitions (optional)       |
| `compat`           | Compatibility quirks and workarounds (optional)      |
| `metadata`         | User-facing instructions (optional)                  |

### The devices array

A single config file can cover multiple product variants — regional SKUs,
hardware revisions, or re-branded versions of the same product. Each entry in
the `devices` array has:

- `productType` — hex product type ID
- `productId` — hex product ID
- `zwaveAllianceId` — optional Z-Wave Alliance certification ID(s)

The `zwaveAllianceId` is a numeric certification ID from the old Alliance
catalog — the old URLs [no longer resolve][catalog-history], but the IDs still
serve as cross-references in zwave-js import scripts.

### Configuration parameters

The `paramInformation` array describes every user-configurable parameter the
device supports. Each entry includes the parameter number, label, value size,
min/max/default values, unit, and — for enumerated values — an `options` array
with human-readable labels.

Parameters can be conditional on firmware version using `$if` expressions:

```json
{
  "#": "81",
  "$if": "firmwareVersion >= 1.10 && firmwareVersion <= 1.12",
  "label": "LED Blinking",
  "valueSize": 1,
  "defaultValue": 1,
  "options": [
    { "label": "Enable", "value": 0 },
    { "label": "Disable (Only when PIR is triggered)", "value": 1 },
    { "label": "Disable completely", "value": 2 }
  ]
}
```

### Metadata

The optional `metadata` object contains user-facing instructions:

| Field       | Description                              |
| ----------- | ---------------------------------------- |
| `inclusion` | How to include the device into a network |
| `exclusion` | How to exclude the device from a network |
| `reset`     | How to factory-reset the device          |
| `wakeup`    | How to wake up a sleeping device         |
| `manual`    | URL to the product manual                |

## The template system

To avoid duplicating parameter definitions across similar devices, the database
uses a `$import` mechanism. A parameter can import its definition from a shared
template:

```json
{
  "#": "39",
  "$import": "templates/aeotec_template.json#low_battery_threshold",
  "defaultValue": 20
}
```

Import paths are relative to the device file's directory. A `~/` prefix
references the global templates directory. Local properties (like `defaultValue`
above) override the template.

Templates live in two places:

- `devices/templates/` — global templates shared across all manufacturers
- `devices/0x0086/templates/` — manufacturer-specific templates

## Looking up a device by device ID

Given a device ID — for example `0176-0005-0001` (a Telldus TZDW-100) — the
lookup works in two steps:

1. **Find the manufacturer folder** — the manufacturer ID `0x0176` maps to the
   folder `devices/0x0176/`.

2. **Scan the JSON files** — read each `.json` file in that folder and check
   whether any entry in its `devices` array matches the product type (`0x0005`)
   and product ID (`0x0001`).

In JavaScript:

```js
import { readdir, readFile } from "node:fs/promises";

async function lookupDevice(mfrId, productType, productId) {
  const dir = `devices/${mfrId}`;
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const config = JSON.parse(await readFile(`${dir}/${file}`, "utf-8"));
    const match = config.devices?.some(
      (d) => d.productType === productType && d.productId === productId,
    );
    if (match) return config;
  }

  return null;
}

const config = await lookupDevice("0x0176", "0x0005", "0x0001");
// config.label        → "TZDW-100"
// config.description  → "Door/window Sensor"
// config.manufacturer → "Telldus Technologies AB"
```

## What's not in the database

- **Product images** — available in the [Alliance catalog][alliance-catalog],
  but `zwaveAllianceId` [no longer resolves][catalog-history] to a page URL.
- **Supported command classes** — comes from the NIF at the protocol level, or
  from the Alliance catalog.
- **Battery type / sensor capabilities** — not tracked; configuration parameters
  describe settings, not hardware.

## Using it offline

The JSON files are self-contained (after template resolution) and need no
runtime dependencies. Bundle them into a web app, fetch from GitHub at runtime,
or shallow-clone with
`git clone --depth 1 --single-branch --no-tags --filter=blob:none`. The database
is actively maintained; new devices are added regularly through pull requests.

## Appendix: contributing Alliance slugs

The `zwaveAllianceId` stores numeric certification IDs that [no longer
resolve][catalog-history]. Working product URLs now use **slugs** (e.g.
`multisensor-6`), but the zwave-js schema has no field for them. Two possible
contributions:

1. **A slug field** — add `zwaveAllianceSlug` to the `devices` array, giving
   every consumer a direct path to the current product page.
2. **An old-ID-to-slug mapping** — for the 1 457 configs (62%) with a
   `zwaveAllianceId`, a mapping file would bridge the gap without schema
   changes.

Neither exists today. To contribute to the database: fork the
[repository][repo], edit under `packages/config/config/devices/<mfrId>/`, run
`yarn run lint:zwave` and `yarn run lint:configjson`, then open a PR. See the
[contributing guide][contributing] for details.

[repo]: https://github.com/zwave-js/zwave-js
[device-id]: zwave-device-id.md
[alliance-catalog]: zwave-alliance-product-catalog.md
[catalog-history]: zwave-alliance-product-catalog.md#history
[contributing]:
  https://zwave-js.github.io/zwave-js/#/config-files/contributing-files
