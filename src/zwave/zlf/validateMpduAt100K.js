import { crc16ccitt } from "crc";

/**
 * Validate a Z-Wave 100 kbps (R2) MPDU buffer.
 *
 * Frame format: [0] LENGTH byte (L = number of bytes following, including CRC)
 * [1..L-2] payload (TYPE, COMMAND CLASS, parameters…) [L-1..L] 2-byte
 * CRC-16/CCITT
 *
 * Checksum is computed over bytes [1] through [L-2] using: poly=0x1021,
 * init=0x1D0F, no reflect, xorOut=0x0000
 *
 * @param {Buffer} mpdu – full MPDU (length + payload + CRC)
 * @returns {boolean} – true if length matches and CRC is valid
 */
export default function validateMpduAt100K(mpdu) {
  if (!Buffer.isBuffer(mpdu) || mpdu.length < 4) {
    throw new Error("Invalid MPDU buffer.");
  }

  const lengthByte = mpdu[0];
  // Total buffer length must equal lengthByte + 1
  // (to account for the length byte itself).
  if (mpdu.length !== lengthByte + 1) {
    return false;
  }

  // Payload is everything after the length byte,
  // up to but excluding the final 2 CRC bytes.
  const payload = mpdu.slice(1, mpdu.length - 2);

  // Read the received CRC (big-endian) from the last two bytes.
  const recvCrc = mpdu.readUInt16BE(mpdu.length - 2);

  // Compute CRC-16/CCITT over payload with Z-Wave init value.
  const calcCrc = crc16ccitt(payload, 0x1d0f);

  return calcCrc === recvCrc;
}
