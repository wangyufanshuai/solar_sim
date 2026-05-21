/**
 * Binary frame decoder for the launch telemetry WebSocket protocol.
 *
 * Protocol v1 (104 bytes per frame):
 *   Header  (16 bytes): magic "LNCH" | version uint32 | flags uint32 | pad uint32
 *   Time    ( 8 bytes): sim_time_s float64
 *   Payload (88 bytes): 11 x float64 = x, y, z, vx, vy, vz, mass, mach, altitude, q, gamma
 *
 * Little-endian byte order throughout.
 */

import type { LaunchTelemetrySample } from "./launchTelemetryTypes";

const MAGIC = 0x4c4e4348; // "LNCH" in little-endian
const VERSION = 1;

/** Header: 16B (magic 4 + version 4 + flags 4 + pad 4) + Time: 8B = 24B offset to payload */
const PAYLOAD_OFFSET = 24;
/** 11 float64s = 88 bytes */
const EXPECTED_FRAME_SIZE = PAYLOAD_OFFSET + 88;

/**
 * Decode a binary launch telemetry frame.
 *
 * @param buffer - Raw ArrayBuffer from WebSocket.
 * @returns Decoded telemetry sample, or null if frame is invalid.
 */
export function decodeLaunchFrame(
  buffer: ArrayBuffer
): { simTimeS: number; sample: LaunchTelemetrySample } | null {
  if (buffer.byteLength < EXPECTED_FRAME_SIZE) return null;

  const view = new DataView(buffer);

  // Validate header
  const magic = view.getUint32(0, true); // little-endian
  if (magic !== MAGIC) return null;

  const version = view.getUint32(4, true);
  if (version !== VERSION) return null;

  // Sim time at offset 16
  const simTimeS = view.getFloat64(16, true);

  // Payload: 11 float64s starting at offset 24
  let offset = PAYLOAD_OFFSET;
  const readF64 = () => {
    const v = view.getFloat64(offset, true);
    offset += 8;
    return v;
  };

  const sample: LaunchTelemetrySample = {
    t: simTimeS,
    x: readF64(),
    y: readF64(),
    z: readF64(),
    vx: readF64(),
    vy: readF64(),
    vz: readF64(),
    massKg: readF64(),
    mach: readF64(),
    altitudeM: readF64(),
    dynamicPressurePa: readF64(),
    lorentzGamma: readF64(),
  };

  return { simTimeS, sample };
}

/**
 * Encode a launch config command as a JSON string for WebSocket send.
 */
export function encodeLaunchConfig(
  action: string,
  params?: Record<string, unknown>
): string {
  return JSON.stringify({ action, ...params });
}
