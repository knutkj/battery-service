import fs from "fs";
import readZlfLogicalDataFrame from "./src/zlf/readZlfLogicalDataFrame.js";

const HEADER_SIZE = 2048;
const MAX_LDFS = 5;
const EPOCH_DIFF = 621355968000000000n;
const TICKS_PER_MS = 10000n;
const FRAME_HEADER_SIZE = 13;

/** Convert a 64-bit Windows FILETIME timestamp to JS Date. */
function filetimeToDate(filetimeTicks) {
  const clean = filetimeTicks & ((1n << 62n) - 1n);
  const ms = Number((clean - EPOCH_DIFF) / TICKS_PER_MS);
  return new Date(ms);
}

async function main() {
  const stream = fs.createReadStream("log.zlf", { start: HEADER_SIZE });
  let buffer = Buffer.alloc(0);
  const ldfs = [];

  const timeOpts = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  };

  while (ldfs.length < MAX_LDFS) {
    const { buffer: newBuf, output } = await readZlfLogicalDataFrame({
      stream,
      buffer,
    });
    buffer = newBuf;
    if (!output) break;

    const lastFrame = output[output.length - 1];
    const timestamp = lastFrame.readBigUInt64LE(0);
    const date = filetimeToDate(timestamp);

    const totalPayload = Buffer.concat(
      output.map((f) => f.subarray(FRAME_HEADER_SIZE, f.length - 1)),
    );

    ldfs.push({
      index: ldfs.length + 1,
      timestamp: date.toLocaleString("no", timeOpts),
      parts: output.length,
      length: totalPayload.length,
      hex: totalPayload.toString("hex"),
    });
  }

  const header = "| # | Timestamp | Parts | Length | Payload (hex) |";
  const divider =
    "|-:|---------------------|------:|--------:|:-----------------|";
  const rows = ldfs.map(
    (ldf) =>
      `| ${ldf.index} | ${ldf.timestamp} | ${ldf.parts} | ${ldf.length} | \`${ldf.hex}\` |`,
  );

  fs.writeFileSync("log.md", [header, divider, ...rows].join("\n"));
  console.log(`Wrote ${ldfs.length} logical data frames to log.md`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
