// hex-to-bin.mjs
import { writeFileSync } from "fs";

/**
 * Writes a binary file from a hex string.
 *
 * @param {string} hex - The hex string (e.g., "deadbeef").
 * @param {string} outFile - The output file path.
 */
export function hexToBinFile(hex, outFile) {
  const cleanHex = hex.replace(/[^a-fA-F0-9]/g, "");
  const buffer = Buffer.from(cleanHex, "hex");
  writeFileSync(outFile, buffer);
  console.log(`Wrote ${buffer.length} bytes to ${outFile}`);
}

// CLI usage: node hex-to-bin.mjs "deadbeef" output.bin
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const [, , hex, outFile] = process.argv;
  if (!hex || !outFile) {
    console.error("Usage: node hex-to-bin.mjs <hexstring> <outputfile>");
    process.exit(1);
  }
  hexToBinFile(hex, outFile);
}
