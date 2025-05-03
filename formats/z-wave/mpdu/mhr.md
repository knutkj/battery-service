# Z-Wave MPDU MAC Header (MHR)

**Description:** Z-Wave singlecast MAC header: Home ID, node IDs, frame control,
length.

## Binary Layout

| Size | Type | Values                                 | Description     |
| ---: | ---- | -------------------------------------- | --------------- |
|   32 | u4   |                                        | Home ID         |
|    8 | u1   |                                        | Source node ID  |
|    1 | b1   | `true`, `false`                        | Routed frame    |
|    1 | b1   | `true`, `false`                        | ACK requested   |
|    1 | b1   | `true`, `false`                        | Low power       |
|    1 | b1   | `true`, `false`                        | Speed modified  |
|    4 | b4   | `"singlecast"`, `"multicast"`, `"ack"` | Header type     |
|    2 | b2   | `"none"`, `"short"`, `"long"`          | Beaming info    |
|    2 | b2   |                                        | Reserved        |
|    4 | b4   |                                        | Sequence number |
|    8 | u1   |                                        | MPDU length     |
|    8 | u1   |                                        | Target node ID  |
