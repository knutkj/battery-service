/** TypeScript interface representing a ZLF frame of type Data. */
export interface ZlfDataFrame {
  timestamp: Date;
  direction: "incoming" | "outgoing";
  session: number;
  frameType: "Data";
  channel: number;
  speed: number;
  region: number;
  rssi: number;
  homeId: number;
  sourceNodeId: number;
  destinationNodeId: number;
  payload: Buffer;
  checksumOK: boolean;
}

// ----------------------------------------------------------------
// From Z-Wave JS below.
// ----------------------------------------------------------------

/**
 * Retrieves the correct constructor for the next message in the given Buffer.
 * It is assumed that the buffer has been checked beforehand
 */
function getZnifferMessageConstructor(
  raw: ZnifferMessageRaw,
): ZnifferMessageConstructor<ZnifferMessage> {
  // We hardcode the list of constructors here, since the Zniffer protocol has
  // a very limited list of messages
  if (raw.type === ZnifferMessageType.Command) {
    switch (raw.functionType) {
      case ZnifferFunctionType.GetVersion:
        return ZnifferGetVersionResponse as any;
      case ZnifferFunctionType.SetFrequency:
        return ZnifferSetFrequencyResponse;
      case ZnifferFunctionType.GetFrequencies:
        return ZnifferGetFrequenciesResponse as any;
      case ZnifferFunctionType.Start:
        return ZnifferStartResponse;
      case ZnifferFunctionType.Stop:
        return ZnifferStopResponse;
      case ZnifferFunctionType.SetLRChannelConfig:
        return ZnifferSetLRChannelConfigResponse;
      case ZnifferFunctionType.GetLRChannelConfigs:
        return ZnifferGetLRChannelConfigsResponse as any;
      case ZnifferFunctionType.GetLRRegions:
        return ZnifferGetLRRegionsResponse as any;
      case ZnifferFunctionType.SetBaudRate:
        return ZnifferSetBaudRateResponse;
      case ZnifferFunctionType.GetFrequencyInfo:
        return ZnifferGetFrequencyInfoResponse as any;
      default:
        return ZnifferMessage;
    }
  } else if (raw.type === ZnifferMessageType.Data) {
    return ZnifferDataMessage as any;
  } else {
    return ZnifferMessage;
  }
}

export interface ZnifferMessageOptions extends ZnifferMessageBaseOptions {
  type: ZnifferMessageType;
  functionType?: ZnifferFunctionType;
  payload?: Bytes;
}

/** Represents a Zniffer message for communication with the serial interface */
export class ZnifferMessage {
  public constructor(options: ZnifferMessageOptions) {
    this.type = options.type;
    this.functionType = options.functionType;
    this.payload = options.payload || new Bytes();
  }

  public static parse(data: Uint8Array): ZnifferMessage {
    const raw = ZnifferMessageRaw.parse(data);
    const Constructor = getZnifferMessageConstructor(raw);
    return Constructor.from(raw);
  }

  /** Creates an instance of the message that is serialized in the given buffer */
  public static from(raw: ZnifferMessageRaw): ZnifferMessage {
    return new this({
      type: raw.type,
      functionType: raw.functionType,
      payload: raw.payload,
    });
  }

  public type: ZnifferMessageType;
  public functionType?: ZnifferFunctionType;
  public payload: Bytes;

  /** Serializes this message into a Buffer */
  public serialize(): Bytes {
    if (this.type === ZnifferMessageType.Command) {
      return Bytes.concat([
        Bytes.from([this.type, this.functionType!, this.payload.length]),
        this.payload,
      ]);
    } else if (this.type === ZnifferMessageType.Data) {
      const ret = Bytes.concat([[this.type], this.payload]);
      ret[9] = this.payload.length - 10;
      // FIXME: Is this correct? It used to be
      // const ret = new Bytes(this.payload.length + 1);
      // ret[0] = this.type;
      // this.payload.copy(ret, 1);
      // this.payload[9] = this.payload.length - 10;
      return ret;
    } else {
      throw new ZWaveError(
        `Invalid Zniffer message type ${this.type as any}`,
        ZWaveErrorCodes.PacketFormat_InvalidPayload,
      );
    }
  }
}

export interface ZnifferMessageBaseOptions {
  // Intentionally empty
}

export interface ZnifferDataMessageOptions {
  frameType: ZnifferFrameType;
  channel: number;
  protocolDataRate: ZnifferProtocolDataRate;
  region: number;
  rssiRaw: number;
  payload: Bytes;
  checksumOK: boolean;
}

export class ZnifferDataMessage
  extends ZnifferMessage
  implements ZnifferFrameInfo
{
  public constructor(
    options: ZnifferDataMessageOptions & ZnifferMessageBaseOptions,
  ) {
    super({
      type: ZnifferMessageType.Data,
      payload: options.payload,
    });

    this.frameType = options.frameType;
    this.channel = options.channel;
    this.protocolDataRate = options.protocolDataRate;
    this.region = options.region;
    this.rssiRaw = options.rssiRaw;
    this.checksumOK = options.checksumOK;
  }

  public static from(raw: ZnifferMessageRaw): ZnifferDataMessage {
    const frameType: ZnifferFrameType = raw.payload[0];

    // bytes 1-2 are 0
    const channel = raw.payload[3] >>> 5;
    const protocolDataRate: ZnifferProtocolDataRate = raw.payload[3] & 0b11111;
    const checksumLength =
      protocolDataRate >= ZnifferProtocolDataRate.ZWave_100k ? 2 : 1;
    const region = raw.payload[4];
    const rssiRaw = raw.payload[5];
    let checksumOK: boolean;
    let payload: Bytes;

    if (frameType === ZnifferFrameType.Data) {
      validatePayload.withReason(`ZnifferDataMessage[6] = ${raw.payload[6]}`)(
        raw.payload[6] === 0x21,
      );
      validatePayload.withReason(`ZnifferDataMessage[7] = ${raw.payload[7]}`)(
        raw.payload[7] === 0x03,
      );
      // Length is already validated, so we just skip the length byte

      const mpduOffset = 9;
      const checksum = raw.payload.readUIntBE(
        raw.payload.length - checksumLength,
        checksumLength,
      );

      // Compute checksum over the entire MPDU
      const expectedChecksum =
        checksumLength === 1
          ? computeChecksumXOR(
              raw.payload.subarray(mpduOffset, -checksumLength),
            )
          : CRC16_CCITT(raw.payload.subarray(mpduOffset, -checksumLength));

      checksumOK = checksum === expectedChecksum;
      payload = raw.payload.subarray(mpduOffset, -checksumLength);
    } else if (frameType === ZnifferFrameType.BeamStart) {
      validatePayload.withReason(`ZnifferDataMessage[6] = ${raw.payload[6]}`)(
        raw.payload[6] === 0x55,
      );

      // There is no checksum
      checksumOK = true;
      payload = raw.payload.subarray(6);
    } else if (frameType === ZnifferFrameType.BeamStop) {
      // This always seems to contain the same 2 bytes
      // There is no checksum
      checksumOK = true;
      payload = new Bytes();
    } else {
      validatePayload.fail(
        `Unsupported frame type ${getEnumMemberName(
          ZnifferFrameType,
          frameType,
        )}`,
      );
    }

    return new this({
      frameType,
      channel,
      protocolDataRate,
      region,
      rssiRaw,
      payload,
      checksumOK,
    });
  }

  public readonly frameType: ZnifferFrameType;
  public readonly channel: number;
  public readonly protocolDataRate: ZnifferProtocolDataRate;
  public readonly region: number;
  public readonly rssiRaw: number;

  public readonly checksumOK: boolean;
}

export class ZnifferMessageRaw {
  public constructor(
    public readonly type: ZnifferMessageType,
    public readonly functionType: ZnifferFunctionType | undefined,
    public readonly payload: Bytes,
  ) {}

  public static parse(data: Uint8Array): ZnifferMessageRaw {
    // Assume that we're dealing with a complete frame
    const type = data[0];
    if (type === ZnifferMessageType.Command) {
      const functionType = data[1];
      const length = data[2];
      const payload = Bytes.view(data.subarray(3, 3 + length));

      return new ZnifferMessageRaw(type, functionType, payload);
    } else if (type === ZnifferMessageType.Data) {
      // The ZnifferParser takes care of segmenting frames, so here we
      // only cut off the type byte from the payload
      const payload = Bytes.view(data.subarray(1));
      return new ZnifferMessageRaw(type, undefined, payload);
    } else {
      throw new ZWaveError(
        `Invalid Zniffer message type ${type as any}`,
        ZWaveErrorCodes.PacketFormat_InvalidPayload,
      );
    }
  }

  public withPayload(payload: Bytes): ZnifferMessageRaw {
    return new ZnifferMessageRaw(this.type, this.functionType, payload);
  }
}

export enum ZnifferFunctionType {
  GetVersion = 0x01,
  SetFrequency = 0x02,
  GetFrequencies = 0x03,
  Start = 0x04,
  Stop = 0x05,
  SetLRChannelConfig = 0x06,
  GetLRChannelConfigs = 0x07,
  GetLRRegions = 0x08,
  SetBaudRate = 0x0e,
  GetFrequencyInfo = 0x13,
  GetLRChannelConfigInfo = 0x14,
}

export enum ZnifferMessageHeaders {
  SOCF = 0x23, // commmand frame
  SODF = 0x21, // data frame
}

export enum ZnifferMessageType {
  Command = ZnifferMessageHeaders.SOCF,
  Data = ZnifferMessageHeaders.SODF,
}

export interface MPDU {
  frameInfo: ZnifferFrameInfo;
  homeId: number;
  sourceNodeId: number;
  ackRequested: boolean;
  headerType: MPDUHeaderType;
  sequenceNumber: number;
  payload: Bytes;
}

export interface ZnifferFrameInfo {
  readonly frameType: ZnifferFrameType;
  readonly channel: number;
  readonly protocolDataRate: ZnifferProtocolDataRate;
  readonly region: number;
  readonly rssiRaw: number;
  rssi?: RSSI;
}

export enum MPDUHeaderType {
  Singlecast = 0x1,
  Multicast = 0x2,
  Acknowledgement = 0x3,
  Explorer = 0x5,
  Routed = 0x8,
}

export enum ZnifferFrameType {
  Command = 0x00,
  Data = 0x01,
  BeamFrame = 0x02,
  BeamStart = 0x04,
  BeamStop = 0x05,
}

// Like ProtocolDataRate, but for use in the Zniffer protocol, which
// shifts the values by one for some reason
export enum ZnifferProtocolDataRate {
  ZWave_9k6 = 0x00,
  ZWave_40k = 0x01,
  ZWave_100k = 0x02,
  LongRange_100k = 0x03,
}

/**
 * A number between -128 and +124 dBm or one of the special values in
 * {@link RssiError} indicating an error
 */

export type RSSI = number | RssiError;

export enum RssiError {
  NotAvailable = 127,
  ReceiverSaturated = 126,
  NoSignalDetected = 125,
}

export function isRssiError(rssi: RSSI): rssi is RssiError {
  return rssi >= RssiError.NoSignalDetected;
}
/**
 * Averages RSSI measurements using an exponential moving average with the given
 * weight for the accumulator
 */

export function averageRSSI(
  acc: number | undefined,
  rssi: RSSI,
  weight: number,
): number {
  if (isRssiError(rssi)) {
    switch (rssi) {
      case RssiError.NotAvailable:
        // If we don't have a value yet, return 0
        return acc ?? 0;
      case RssiError.ReceiverSaturated:
        // Assume rssi is 0 dBm
        rssi = 0;
        break;
      case RssiError.NoSignalDetected:
        // Assume rssi is -128 dBm
        rssi = -128;
        break;
    }
  }

  if (acc == undefined) return rssi;
  return Math.round(acc * weight + rssi * (1 - weight));
}
/**
 * Converts an RSSI value to a human readable format, i.e. the measurement
 * including the unit or the corresponding error message.
 */

export function rssiToString(rssi: RSSI): string {
  switch (rssi) {
    case RssiError.NotAvailable:
      return "N/A";
    case RssiError.ReceiverSaturated:
      return "Receiver saturated";
    case RssiError.NoSignalDetected:
      return "No signal detected";
    default:
      return `${rssi} dBm`;
  }
}
