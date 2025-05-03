/**
 * Compute Z-Wave Channel 1/2 (≤40 kbps) checksum: Byte checksum = 0xFF; for
 * each byte in Data: checksum ^= byte;
 *
 * @param {Uint8Array | Buffer} data All MPDU bytes _except_ the final CS byte.
 * @returns {number} The 8-bit checksum (0–0xFF).
 */
function generateChecksum(data) {
  let cs = 0xff;
  for (const b of data) {
    cs ^= b;
  }
  return cs & 0xff;
}

/**
 * Validate a Z-Wave 40 kbps MPDU buffer by checking its 1-byte XOR checksum.
 *
 * @param {Uint8Array | Buffer} mpdu Entire MPDU, _including_ trailing CS byte.
 * @returns {boolean} True if checksum matches; false otherwise.
 */
export default function validateMpduAt40K(mpdu) {
  if (!Buffer.isBuffer(mpdu) || mpdu.length < 4) {
    throw new Error("Invalid MPDU buffer.");
  }

  const lengthByte = mpdu[0];
  // Total buffer length must equal lengthByte + 1
  // (to account for the length byte itself).
  if (mpdu.length !== lengthByte + 1) {
    return false;
  }

  const without = mpdu.subarray(1);
  console.log("without", without.toString("hex"));
  const payload = without.subarray(0, without.length - 1);
  console.log("payload", payload.toString("hex").toUpperCase());
  const received = mpdu[mpdu.length - 1];
  const computed = generateChecksum(payload);

  console.log({ received, computed });

  return computed === received;
}
