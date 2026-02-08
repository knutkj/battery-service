# The Z-Wave Alliance Product Catalog

The [Z-Wave Alliance Product Catalog][catalog] is the official directory of
certified Z-Wave devices. Every device that passes Z-Wave certification gets a
product page with photos, specifications, supported command classes, and —
critically — the [device ID triplet][device-id] (Manufacturer ID, Product Type,
Product ID).

## History

Before WordPress, the catalog was a custom certification database where each
product received a sequential numeric ID — a database row key, not a
protocol-level identifier. Products were addressed by this number:
`/products/1403` was the Aeotec MultiSensor 6. The old system also exposed
sub-pages and certification documents under paths that included the numeric ID.
Community tools, forums, and the zwave-js device configuration database all
referenced these numeric IDs as stable links.

In late 2025, the Alliance [migrated to a new Certified Product
Guide][migration] built on WordPress. The migration preserved product content —
names, triplets, photos, command class lists, certification PDFs — but
**discarded the old numeric IDs**. No redirects were created. The old
`/products/<number>` paths return 404. The numeric IDs were internal database
keys with no contractual or protocol-level meaning, so the Alliance had no
obligation to preserve them — but the 1 457 zwave-js config files that reference
`zwaveAllianceId` now point to dead URLs, with no Alliance-side mechanism to
resolve them.

The zwave-js database is now, ironically, one of the richest surviving records
of the old catalog's ID scheme. The `zwaveAllianceId` arrays encode
certification history — multiple IDs for the same product (e.g.
`[1403, 1812, 2714]`) represent re-certifications over time as firmware, SDKs,
and protocol features evolved. Lower numbers correspond to earlier
certifications (Gen5, early Plus era); higher numbers to later ones (Plus v2,
Security S2). This temporal information is not represented anywhere on the
current site.

## The product page

Each product page uses a slug-based URL (see
[Appendix](#appendix-what-is-a-slug)) and contains:

| Section            | Content                                            |
| ------------------ | -------------------------------------------------- |
| Title & photo      | Product name, official image                       |
| Product identifier | Model code (e.g. `TZDW-100`, `ZW100`)              |
| Device ID triplet  | Manufacturer ID, Product Type ID, Product ID (hex) |
| Command classes    | Supported CCs with controlled/supported roles      |
| Endpoints          | Multi-channel endpoint configuration               |
| Certification      | Z-Wave Plus role type, certification date          |

### The triplet on the page

The device ID triplet appears in a table — the only place on the web where a
product's triplet is authoritatively linked to its certification record:

```html
<th class="th-min-with" scope="col">Manufacturer ID</th>
<td>0x0176</td>
<th class="th-min-with" scope="col">Product Type ID</th>
<td>0x0005</td>
<th class="th-min-with" scope="col">Product ID</th>
<td>0x0001</td>
```

## The WordPress architecture

The catalog runs on WordPress with a custom post type (`z-wave-product`) and
[Advanced Custom Fields (ACF)][acf] for the structured product data.

### What the REST API exposes

The standard WordPress REST API serves product posts:

```
GET /wp-json/wp/v2/z-wave-product?slug=door-window-sensor-5
```

This returns the post's title, slug, featured image, and `content.rendered` —
but the rendered content does **not** include the ACF fields. The triplet, model
code, command class list, and endpoint configuration are all ACF fields,
invisible to `wp/v2/` queries without the [ACF to REST API][acf-rest] plugin.

The REST API does support paginated enumeration of all products:

```
GET /wp-json/wp/v2/z-wave-product?per_page=100&page=1&_fields=id,slug,title
X-WP-Total: 4301    X-WP-TotalPages: 44
```

This returns the WordPress post ID, slug, and title for every product in 44
requests — useful for building a complete slug inventory without scraping.

## FacetWP: the search engine underneath

The catalog's search interface uses [FacetWP][facetwp], a WordPress plugin that
provides faceted filtering. FacetWP indexes post content _and_ ACF custom
fields, which means it can search data that the REST API cannot.

### The refresh endpoint

FacetWP exposes a single POST endpoint:

```
POST /wp-json/facetwp/v1/refresh
```

The request body is `application/json` with `action` set to `"facetwp_refresh"`
and `data` as a nested object (not a JSON-encoded string):

```jsonc
{
  "action": "facetwp_refresh",
  "data": {
    "facets": {
      "zwa_search": "0x0176", // free-text search across all indexed fields
      "zwa_brand": [], // filter by manufacturer name
      "zwa_category": [], // filter by product category
      "zwa_device_type": [], // filter by device type
      "zwa_region": [], // filter by region
      "zwa_frequency": [], // filter by frequency band
      "zwa_pagination": [], // page selector
    },
    "http_params": { "get": [], "uri": "product-explorer", "url_vars": {} },
    "template": "zwa_products_test",
    "extras": { "selections": true, "sort": "default" },
    "soft_refresh": 0,
    "is_bfcache": 1,
    "first_load": 0,
    "paged": 1,
  },
}
```

Page size is fixed at 12 results per page server-side. The `zwa_per_page` facet
appears in the DOM but has no effect on the response.

### The response

The response JSON contains a `template` field with rendered HTML product cards:

```html
<a
  href="https://products.z-wavealliance.org/z-wave-product/door-window-sensor-5/"
>
  <h3>Door/Window Sensor</h3>
  <p>TZDW-100</p>
</a>
```

### What FacetWP indexes

FacetWP indexes ACF custom field values — searching for `0x0176` returns all
products from that manufacturer because the Manufacturer ID field is indexed.

## Lookup strategies

### Strategy 1: search by manufacturer hex ID + match triplet

Given a device ID like `0176-0005-0001`, search FacetWP by manufacturer hex ID,
fetch each candidate page, extract its triplet, and match:

```
Search FacetWP: "0x0176"
  → 5 product cards (all Telldus products)
    → Fetch each page, extract triplet
      → Match 0x0176 / 0x0005 / 0x0001
        → "Door/Window Sensor" (TZDW-100) ✓
```

Using the `zwa_brand` facet instead of `zwa_search` is more precise: filtering
by `zwa_brand=["telldus"]` returns exactly 5 products with no false positives.

The limitation is scale. With page size fixed at 12, a single request only
returns the first page. Telldus (5 products) fits in one page; Heiman (20)
needs two; Aeotec (248) needs 21. Pagination is required for larger
manufacturers, or the target product may not appear in the results.

### Strategy 2: search by product label

If the zwave-js device config has already been found, search FacetWP with the
product label (e.g. `HS1MS-Z`, `AN180`). This is the most targeted approach:

| Label search | Results | vs. manufacturer hex |
| ------------ | ------- | -------------------- |
| `HS1MS-Z`    | 1       | 20 for `0x0260`      |
| `AN180`      | 2       | 118 for `0x0060`     |
| `ZW100`      | 13      | 181 for `0x0086`     |

Caveats:

- Requires a prior zwave-js lookup to obtain the label.
- FacetWP uses fuzzy matching — `FGSD-002` returns 71 results dominated by
  `FGD-212` (the search engine treats the strings as similar).
- Labels may not match exactly between zwave-js and the catalog (see the
  [identification article's investigation][identification]).

### Strategy 3: slug URL → triplet (reverse lookup)

Fetch the full page for a known slug and extract the triplet directly:

```
URL: /z-wave-product/tellstick-znet-lite/
  → Fetch full HTML page
    → Extract: 0x0176 / 0x0001 / 0x0002
      → Store triplet, look up in zwave-js database
```

This can be applied at catalog scale: enumerate all slugs via the REST API, then
scrape each page for its triplet.

### Combining strategies: tiered search

The strategies above can be combined in order of specificity:

1. **Label** (Strategy 2) — narrowest, typically 1–13 results.
2. **Brand + product type hex** — e.g. `zwa_brand=["heiman"]` +
   `zwa_search="0x8001"` returns 2 results.
3. **Manufacturer hex** (Strategy 1) — broadest fallback.

Each tier fetches candidate pages and compares the full triplet. The search
stops at the first match, so most lookups never reach tier 3.

## Extracting the triplet

```js
const html = await fetch(pageUrl).then((r) => r.text());

const mfr = html.match(
  /Manufacturer\s+ID<\/th>\s*<td[^>]*>\s*(0x[0-9a-fA-F]{4})/,
)?.[1];
const pType = html.match(
  /Product\s+Type\s+ID<\/th>\s*<td[^>]*>\s*(0x[0-9a-fA-F]{4})/,
)?.[1];
const pId = html.match(
  /Product\s+ID<\/th>\s*<td[^>]*>\s*(0x[0-9a-fA-F]{4})/,
)?.[1];
```

## CORS

The Alliance site does not set `Access-Control-Allow-Origin` headers. Browser
applications cannot call the REST API or FacetWP endpoints directly — all
requests must go through a server-side proxy.

## Cross-referencing with zwave-js

| Data                      | zwave-js | Alliance |
| ------------------------- | -------- | -------- |
| Product name              | ✓        | ✓        |
| Manufacturer name         | ✓        | ✓        |
| Device ID triplet         | ✓        | ✓        |
| Configuration parameters  | ✓        | ✗        |
| Association groups        | ✓        | ✗        |
| User instructions         | ✓        | ✗        |
| Product photos            | ✗        | ✓        |
| Supported command classes | ✗        | ✓        |
| Certification details     | ✗        | ✓        |
| Multi-channel endpoints   | ✗        | ✓        |

See the [identification article][identification] for a comparison of all bridge
strategies between the two databases.

## Observations

- FacetWP is not a documented public API. It is a WordPress plugin used by the
  catalog's front end, and the endpoint happens to be accessible.
- The catalog indexes 4 301 products (as of February 2026). A search with no
  filters returns the full count.
- Product pages occasionally have inconsistent formatting; the regex may need
  adjustment for edge cases.
- The `zwa_brand` facet lists 505 brands. It uses the manufacturer brand name
  (e.g. `"telldus"`), not the manufacturer hex ID.
- A single brand can span multiple manufacturer IDs. NEXA has products under
  `0x0060` (5 products) and `0x0268` (1); Namron under `0x0438` (5) and `0x0431`
  (1). Brand and manufacturer ID are not 1:1 — likely the result of acquisitions
  or OEM arrangements.

## Appendix: what is a slug?

The term _slug_ comes from WordPress. A slug is a short, lowercase,
hyphen-separated string derived from a post's title, used as the last segment of
its permalink URL. For the Telldus TZDW-100 door sensor, the slug is
`door-window-sensor-5`:

```
https://products.z-wavealliance.org/z-wave-product/door-window-sensor-5/
                                                    ^^^^^^^^^^^^^^^^^^^^
                                                          slug
```

The REST API exposes slugs via `wp/v2/z-wave-product?slug=…` (see
[above](#what-the-rest-api-exposes)). The slug is the only stable product
identifier — the old numeric IDs no longer resolve (see [History](#history)).
The zwave-js database does not store slugs; building triplet-to-slug mapping
files bridges this gap. See the [identification article][identification] for the
full mapping strategy.

[catalog]: https://products.z-wavealliance.org/
[device-id]: zwave-device-id.md
[acf]: https://www.advancedcustomfields.com/
[acf-rest]: https://github.com/developer-starter/acf-to-rest-api
[facetwp]: https://facetwp.com/
[identification]: zwave-device-identification.md
[migration]: https://z-wavealliance.org/z-wave-certified-product-guide/
