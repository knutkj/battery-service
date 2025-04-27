# Parse the ZLF file format header: Learnings So Far

**Goal:** Extract metadata from the **2048-byte ZLF header** block at the start
of `.zlf`/`.zwlf` files produced by Silicon Labs **Z-Wave Zniffer** tool.

## What We've Tried So Far

| Attempt | Strategy                                                                                 | Tools Used                                                         | Result                                                    |
| :------ | :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------- |
| 1       | Decode header as **UTF-16LE**, split on nulls, look for `Key=Value` strings.             | Manual UTF-16 decode + `split('\\u0000')`.                         | No key-value pairs found; empty object.                   |
| 2       | Decode header as **UTF-8**, split on nulls, look for `Key=Value`.                        | UTF-8 fallback.                                                    | Still no key-value pairs found.                           |
| 3       | Try **regex scanning** for `Key=Value` patterns across UTF-16LE and Latin1 decoded text. | Regex `/([A-Za-z0-9_-]+)=([^\\r\\n\\0;]+)/g`.                      | No matches; still empty.                                  |
| 4       | **Manual ASCII scan** for printable segments containing `=` or `:` separators.           | Byte scan, `latin1`, regex `[\\x20-\\x7E]{5,}` to extract strings. | Found segments, but still no valid key-value data parsed. |
| 5       | Validate header input buffer length and types to rule out stream read problems.          | Buffer length and type checks.                                     | Confirmed input correctness but parsing still failed.     |

## Resources Used

- Silicon Labs Zniffer documentation (`INS10249-6` Zniffer User Guide).
- Zniffer tool version 4+ behavior (local experiments + forum references).
- Community reverse-engineering notes (Stack Overflow, Z-Wave developer forums).
- Node.js Buffer encoding documentation.
- General Z-Wave Sniffer .zlf format usage discussions.

**Key insight from resources:** None of the official materials **publish a
detailed breakdown** of the internal ZLF header structure.  
Most tools **simply skip the header without parsing it**.

## Why Parsing Failed So Far

- It’s very possible the header is **mostly binary**, **compressed**, or
  **custom-encoded** rather than plain text.
- While there may be small **human-readable parts** embedded inside, they could
  be padded, interleaved with binary, or hidden inside a more structured binary
  format (e.g., length-prefixed blocks, or protobuf-style serialization).
- Our assumption that the header consists of "simple UTF-16LE or ASCII key=value
  strings" may be **wrong**.

## Specification for parseZlfHeader (Next Steps)

### Observations

- **Input must be a Buffer of exactly 2048 bytes**.
- **No assumptions about text encoding**.
- **Most fields may be binary data** — not printable.
- **Printable text, if any, could be surrounded by binary garbage**.

### New Plan (Moving Forward)

1. **Hexdump and manual exploration**:

   - Manually hex dump a real `.zlf` header.
   - Look for patterns (e.g., known words, timestamps, Home IDs).
   - Identify if there are structured areas.

2. **Search for common Z-Wave parameters**:

   - Look for specific sequences (e.g., `HomeID` is 4 bytes, maybe fixed
     offset?).
   - Look for any consistent offsets.

3. **Treat header as binary structure**: Maybe: [uint32_t] version + [char[]]
   hostname + [char[]] username + [HomeID] + etc.

4. **Online search for private/internal Silicon Labs format**: Developer SDKs
   sometimes have unofficial info about older Zniffer formats.

5. **Fallback Plan**:

   - Continue **skipping** the header unless a reliable pattern emerges.
   - Document this as **expected** behavior for first phase PoC.

## Example Specification Draft (Learning-Informed)

| Item              | Behavior                                                              |
| :---------------- | :-------------------------------------------------------------------- |
| Input Validation  | Buffer of length exactly 2048.                                        |
| Decoding Attempts | Optional: UTF-16LE, UTF-8, ASCII, Latin1, but expect failure.         |
| Data Extraction   | Future: offset-based binary field parsing if format known.            |
| Default Behavior  | If format unknown or unreadable, skip header safely.                  |
| Errors            | Fail gracefully if header is too small, wrong type, or stream errors. |
