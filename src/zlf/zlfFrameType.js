/**
 * Identifies the frame type of a ZLF payload.
 *
 * @param {Buffer} payload - The payload extracted from a ZLF frame.
 * @returns {"Command" | "Data" | "Unknown"} - The identified Zniffer message
 *   type.
 */
export default function zlfFrameType(payload) {
  if (!payload || payload.length === 0) {
    return "Unknown";
  }

  const type = payload[0];

  switch (type) {
    case 0x23: // ZnifferMessageType.Command (SOCF)
      return "Command";
    case 0x21: // ZnifferMessageType.Data (SODF)
      return "Data";
    default:
      return "Unknown";
  }
}
