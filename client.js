// client.js
import fs from "fs";
import ZlfReadFrameOperation from "./src/zlf/ZlfReadFrameOperation.js";
import ZlfFrame from "./src/zlf/ZlfFrame.js";
import ZlfDataFrame from "./src/zlf/ZlfDataFrame.js";

async function main() {
  const filePath = "log.zlf";
  // Skip the 2048-byte header by starting the stream at byte offset 2048
  const stream = fs.createReadStream(filePath, { start: 2048 });
  const op = new ZlfReadFrameOperation();
  let receiveBuffer = Buffer.alloc(0);

  try {
    // Read exactly one full recognizable message.
    let buffer = null;
    do {
      console.log("Reading chunk ...");
      const res = await op.run(stream, receiveBuffer);
      receiveBuffer = res.receiveBuffer;
      buffer = res.output;
    } while (!isDataFrame(buffer));

    if (buffer) {
      console.log("Read one ZLF message (hex):");
      console.log(buffer.toString("hex"));
      const frame = ZlfFrame.fromBuffer(buffer);
      console.log(frame);
      console.log(frame.payload.toString("hex"));
      console.log(ZlfDataFrame.fromBuffer(frame));
    } else {
      console.log("No complete message available in log.zlf");
    }
  } finally {
    // Clean up
    stream.destroy();
  }
}

main().catch((err) => {
  console.error("Error reading message:", err);
  process.exit(1);
});

/**
 * Identifies the command type from a Command frame payload.
 *
 * @param {Buffer} payload - The payload extracted from a ZLF frame.
 * @returns {string | null} - The identified command type or null if not
 *   applicable.
 */
export function identifyCommandType(payload) {
  if (!payload || payload.length < 2) {
    return null;
  }

  const commandType = payload[1];

  switch (commandType) {
    case 0x01:
      return "GetVersion";
    case 0x02:
      return "SetFrequency";
    case 0x03:
      return "GetFrequencies";
    case 0x04:
      return "Start";
    case 0x05:
      return "Stop";
    case 0x06:
      return "SetLRChannelConfig";
    case 0x07:
      return "GetLRChannelConfigs";
    case 0x08:
      return "GetLRRegions";
    case 0x0e:
      return "SetBaudRate";
    case 0x13:
      return "GetFrequencyInfo";
    case 0x14:
      return "GetLRChannelConfigInfo";
    default:
      return "UnknownCommand";
  }
}

/**
 * Checks if the given ZLF frame buffer contains a Data frame.
 *
 * @param {Buffer} frameBuffer - The complete ZLF frame buffer.
 * @returns {boolean} - True if the frame is of type Data, false otherwise.
 */
export function isDataFrame(frameBuffer) {
  if (!frameBuffer || frameBuffer.length < 14) {
    return false;
  }

  // Frame header is 13 bytes: [8-byte timestamp][1-byte control][4-byte payload length]
  // Payload starts immediately after the header
  const payloadType = frameBuffer[13];
  return payloadType === 0x21;
}
