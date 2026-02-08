# Z-Wave Device Identification

A Z-Wave network gives us **node IDs** — small integers (1–232) that the
protocol uses to route frames. A node ID tells us nothing about the physical
device behind it. To show the user that node 5 is a "TZDW-100 Door/Window
Sensor" made by Telldus, we need to cross a gap between protocol-level
addressing and product-level identification.

## What we start with

After parsing a ZLF capture, the prototype knows:

| Field       | Source           | Example    |
| ----------- | ---------------- | ---------- |
| **Home ID** | MPDU header      | `C4A815CD` |
| **Node ID** | MPDU source/dest | `5`        |

Together, `homeId + nodeId` is our **internal key** — the handle we use to
attach product information to a node and persist it across sessions. But the
node ID is opaque. We need two separate identifiers to reach external product
knowledge.

## The two identifiers

### Device ID

The **device ID** is a triplet of Manufacturer ID, Product Type ID, and Product
ID that uniquely identifies a product line. It is the key to the [zwave-js
device configuration database][zwave-js] — the community-maintained repository
of product names, configuration parameters, and manufacturer information on
GitHub. The [device ID article][device-id] covers what the three fields are, how
they are assigned, and how a controller obtains them via the Manufacturer
Specific CC.

### Alliance slug

The **slug** is a WordPress URL identifier — a short, lowercase,
hyphen-separated string used as the last segment of a product's URL (e.g.
`door-window-sensor-5`). It is the key to the [Z-Wave Alliance Product
Catalog][alliance-catalog]. Unlike the device ID, the slug is not part of the
Z-Wave protocol. See the [Alliance catalog article][alliance-catalog] for the
full explanation of slugs and the catalog's WordPress architecture.

### Why we need both

The device ID and the slug serve different external sources:

| Identifier    | Example                | Source for               |
| ------------- | ---------------------- | ------------------------ |
| **Device ID** | `0176-0005-0001`       | zwave-js config (GitHub) |
| **Slug**      | `door-window-sensor-5` | Alliance product page    |

Each can be derived from the other through network requests, but both paths are
expensive — the prototype stores both to avoid repeating the lookups.

## The identification gap

The prototype faces a practical problem: it starts with neither identifier. A
ZLF capture records RF traffic — it sees the Manufacturer Specific Report only
if one happens to fly by during the capture. The Alliance slug is not part of
the protocol at all. In practice, the user needs to supply one or both, and may
arrive with the information in different forms.

```
                          User input
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    Direct triplet    Alliance slug or URL   Pasted table
    0176-0005-0001    (bare slug or          Mfr/Type/ID
          │            full slug URL)             │
          │                   │                   │
          │       ┌───────────┴───────────┐       │
          │       │                       │       │
          │     slug                /z-wave-…/    │
          │     door-…              door-…        │
          │       │                       │       │
          │       └─────────┬─────────────┘       │
          │            fetch page                 │
          │            scrape triplet             │
          │                 │                     │
          ▼                 ▼                     ▼
     ┌────────────────────────────────────────────────┐
     │              device ID (triplet)               │
     │              0176-0005-0001                    │
     └──────────────────────┬─────────────────────────┘
                            │
              ┌─────────────┼─────────────────┐
              │             │                 │
     zwave-js config   local mapping    FacetWP search
     DB (GitHub)       file (0176.json) (live fallback)
              │             │                 │
              │             │          tiered search
              │             │          (see catalog article)
              │             │                 │
              ▼             ▼                 ▼
  ┌──────────────────┐ ┌──────────────────────────────┐
  │ zwave-js config  │ │       Alliance slug          │
  │ file             │ │  door-window-sensor-5        │
  └──────────────────┘ └──────────────────────────────┘
```

The local mapping file is a pre-scraped JSON file keyed by triplet (e.g.
`0176.json`), one per manufacturer, providing instant slug lookups without
hitting the Alliance site at runtime. The live FacetWP search remains as a
fallback for manufacturers not yet scraped. See the [catalog article's lookup
strategies][alliance-catalog-strategies] for details on both approaches.

## Input paths

The following input formats are recognised:

| Format         | Example                                  | Resolution                         |
| -------------- | ---------------------------------------- | ---------------------------------- |
| Direct triplet | `0176-0005-0001`                         | Used directly                      |
| Slug           | `door-window-sensor-5`                   | Fetch product page, scrape triplet |
| Slug URL       | `…/z-wave-product/door-window-sensor-5/` | Extract slug, then as above        |
| Pasted table   | `Manufacturer ID\t0x0176\n…`             | Extract three hex values           |

The slug and slug URL paths work because the Alliance page renders the device ID
in a `<th>`/`<td>` table as ACF custom fields.

## The bridge from zwave-js to the Alliance catalog

Ideally, the zwave-js device configuration database would give us a direct path
to the Alliance product page. It contains several fields that point in that
direction — but each has limitations, and the most obvious one turns out to be a
dead end.

### zwaveAllianceId

Of the 2 337 config files in the [zwave-js database][zwave-js], **1 457**
include a `zwaveAllianceId` — a numeric certification ID from the old Alliance
catalog. These IDs [no longer resolve][alliance-catalog-history] after the
WordPress migration.

There is no known way to map from the old numeric ID to the current slug. The
old ID does not appear anywhere on the current product page HTML, is not exposed
in the WordPress REST API response (`acf`, `meta`, etc.), and is not searchable
via FacetWP. The WordPress post IDs are also different — the MultiSensor 6 was
`1403` in the old system but is post `4622` in WordPress.

`zwaveAllianceId` tells us the product _exists_ in the catalog, but provides no
path to the current page.

### label and description

The `label` (e.g. `ZW100`) and `description` (e.g. `MultiSensor 6`) from the
zwave-js config can be used as search terms. The WordPress REST API supports
text search:

```
GET /wp-json/wp/v2/z-wave-product?search=MultiSensor+6
```

This returns matching posts with their slugs — for the MultiSensor 6, three
regional variants, each with a slug like `multisensor-6`. The same labels can
also be used with FacetWP for [more targeted
results][alliance-catalog-strategies].

The limitation: labels may not match. The zwave-js config for the TellStick ZNet
Lite uses the label `TZNETLIT`, but the Alliance catalog lists it as
`TZNetLite`. Even case-insensitive comparison fails because the zwave-js label
is truncated. The triplet-based lookup in the diagram above avoids this problem
entirely.

## The mapping model

The prototype stores **two identifiers** per node in localStorage, keyed by
`homeId + nodeId`:

| Stored        | Example                | Key to                    |
| ------------- | ---------------------- | ------------------------- |
| **Device ID** | `0176-0005-0001`       | zwave-js config on GitHub |
| **Slug**      | `door-window-sensor-5` | Alliance product page     |

Everything else is derived on demand. No derived URLs are stored.

[device-id]: zwave-device-id.md
[zwave-js]: zwave-js-device-config-database.md
[alliance-catalog]: zwave-alliance-product-catalog.md
[alliance-catalog-history]: zwave-alliance-product-catalog.md#history
[alliance-catalog-strategies]:
  zwave-alliance-product-catalog.md#lookup-strategies
