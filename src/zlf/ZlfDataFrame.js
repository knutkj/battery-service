import zlfFrameType from "./zlfFrameType.js";

export default class ZlfDataFrame {
  /**
   * Creates a ZlfDataFrame instance from a ZlfFrame.
   *
   * @param {ZlfFrame} frame - The parsed ZlfFrame.
   * @returns {ZlfDataFrame}
   */
  static fromBuffer(frame) {
    const payload = frame.payload;

    if (!payload || payload.length < 6) {
      throw new Error("Invalid ZLF Data Frame payload length.");
    }

    // Extract information from payload
    const frameType = zlfFrameType(payload);

    if (frameType !== "Data") {
      // ZnifferFrameType.Data
      throw new Error("Payload is not a Data frame.");
    }

    const channel = payload[3] >>> 5;
    const speed = payload[3] & 0b11111;
    const region = payload[4];
    const rssiRaw = payload[5];

    const mpduOffset = 9;
    const checksumLength = speed >= 2 ? 2 : 1;
    const checksum = payload.readUIntBE(
      payload.length - checksumLength,
      checksumLength,
    );

    const payloadWithoutMeta = payload.subarray(
      mpduOffset,
      payload.length - checksumLength,
    );

    // Home ID (first 4 bytes)
    const homeId = payloadWithoutMeta.readUInt32BE(0);

    // Source and Destination IDs
    const sourceNodeId = payloadWithoutMeta[4];
    const destinationNodeId = payloadWithoutMeta[5];

    // Calculate checksum
    const expectedChecksum =
      checksumLength === 1
        ? computeChecksumXOR(payloadWithoutMeta)
        : CRC16_CCITT(payloadWithoutMeta);

    const checksumOK = checksum === expectedChecksum;

    return {
      timestamp: frame.timestamp,
      direction: frame.direction,
      session: frame.session,
      frameType: "Data",
      channel,
      speed,
      region,
      rssi: rssiRaw,
      homeId,
      sourceNodeId,
      destinationNodeId,
      payload: payloadWithoutMeta,
      checksumOK,
    };
  }
}

// Dummy checksum functions for completeness:
function computeChecksumXOR(buffer) {
  let checksum = 0;
  for (const byte of buffer) {
    checksum ^= byte;
  }
  return checksum;
}

function CRC16_CCITT(buffer) {
  let crc = 0x1d0f;
  for (const byte of buffer) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc;
}
