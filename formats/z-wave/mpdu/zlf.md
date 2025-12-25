# Z-Wave Log File (ZLF)

## Binary Layout

| Size | Type             | Values | Description                                  |
| ---: | ---------------- | ------ | -------------------------------------------- |
|    ? |                  |        | 2048-byte metadata header (skip, not parsed) |
|   64 | u8               |        | Windows FILETIME (mask upper 2 bits)         |
|    8 | u1               |        | Bit 7 = Direction, Bits 0-6 = Session ID     |
|   32 | u4               |        | Payload length (LE32)                        |
|    8 | u1               |        |                                              |
|    ? | \[object Object] |        |                                              |
|    8 | u1               |        | Reserved; read and ignored                   |
