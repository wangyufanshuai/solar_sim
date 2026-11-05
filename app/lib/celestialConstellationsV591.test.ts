import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONSTELLATION_FROZEN_BINDING_SHA256_V591,
  CONSTELLATION_FROZEN_SOURCE_FILE_SHA256_V591,
  CONSTELLATION_LABEL_FONT_SHA256_V591,
  CONSTELLATION_PACKET_URL_V591,
  parseConstellationPacketV591,
  canonicalConstellationPacketJsonV591,
} from "./celestialConstellationsV591";
import {
  CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591,
  CONSTELLATION_PACKET_BYTES_V591,
  CONSTELLATION_PACKET_FILE_SHA256_V591,
  CONSTELLATION_PACKET_SHA256_V591,
} from "../data/celestialConstellationsV591.generated";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => (
    [key, canonicalize((value as Record<string, unknown>)[key])]
  )));
}
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));

function loadPacket(): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), `public${CONSTELLATION_PACKET_URL_V591}`), "utf8"));
}

describe("v591-owned Gaia constellation packet", () => {
  it("locks raw packet, frozen source, canonical binding and local font identities", () => {
    const packet = loadPacket();
    const packetBytes = readFileSync(resolve(process.cwd(), `public${CONSTELLATION_PACKET_URL_V591}`));
    expect(packetBytes.byteLength).toBe(CONSTELLATION_PACKET_BYTES_V591);
    expect(sha256(packetBytes)).toBe(CONSTELLATION_PACKET_FILE_SHA256_V591);
    expect(sha256(canonicalConstellationPacketJsonV591(packet))).toBe(CONSTELLATION_PACKET_SHA256_V591);
    expect(parseConstellationPacketV591(packet).metrics).toMatchObject({
      constellationCount: 88,
      waypointCount: 484,
      uniqueGaiaSourceIdCount: 420,
      maximumAngularDistanceDeg: 1.4008261815085659,
      medianAngularDistanceDeg: 0.4760630074038235,
      thresholdDeg: 1.5,
    });
    const frozenBytes = readFileSync(resolve(process.cwd(), "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json"));
    expect(sha256(frozenBytes)).toBe(CONSTELLATION_FROZEN_SOURCE_FILE_SHA256_V591);
    const frozen = JSON.parse(frozenBytes.toString("utf8"));
    const frozenUnsigned = { ...frozen };
    delete frozenUnsigned.bindingSha256;
    expect(canonicalSha(frozenUnsigned)).toBe(CONSTELLATION_FROZEN_BINDING_SHA256_V591);
    expect(sha256(readFileSync(resolve(process.cwd(), "public/fonts/candidate-v591/ibm-plex-sans-condensed-latin-500.woff2")))).toBe(CONSTELLATION_LABEL_FONT_SHA256_V591);
    const parsed = parseConstellationPacketV591(packet);
    expect(sha256(readFileSync(resolve(process.cwd(), `public${parsed.labelAtlas.path}`)))).toBe(parsed.labelAtlas.sha256);
    expect(parsed.labelAtlas.sha256).toBe(CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591);
    expect(parsed.labelAtlas).toMatchObject({
      width: 2048,
      height: 1024,
      entryCount: 88,
      runtimeFontWorkerRequired: false,
      resourceOwner: "v591-celestial-convergence",
    });
  });

  it("fails closed on packet, source-id, duplicate-code and threshold mutation", () => {
    const source = loadPacket();
    expect(() => parseConstellationPacketV591({ ...source, packetSha256: "0".repeat(64) })).toThrow("v591-constellation-packet-identity");
    expect(() => parseConstellationPacketV591({ ...source, frozenSource: { ...(source.frozenSource as object), fileSha256: "0".repeat(64) } })).toThrow("v591-constellation-packet-identity");
    const duplicate = structuredClone(source);
    const duplicateBindings = duplicate.bindings as Array<Record<string, unknown>>;
    duplicateBindings[1]!.iauCode = duplicateBindings[0]!.iauCode;
    expect(() => parseConstellationPacketV591(duplicate)).toThrow("v591-constellation-binding-identity");
    const invalidSourceId = structuredClone(source);
    ((invalidSourceId.bindings as Array<{ waypoints: Array<Record<string, unknown>> }>)[0]!.waypoints[0]!).sourceId = "synthetic";
    expect(() => parseConstellationPacketV591(invalidSourceId)).toThrow("v591-constellation-waypoint-identity");
    const overThreshold = structuredClone(source);
    ((overThreshold.bindings as Array<{ waypoints: Array<Record<string, unknown>> }>)[0]!.waypoints[0]!).angularDistanceDeg = 1.500001;
    expect(() => parseConstellationPacketV591(overThreshold)).toThrow("v591-constellation-waypoint-identity");
    const duplicateAtlasCode = structuredClone(source);
    const atlasEntries = (duplicateAtlasCode.labelAtlas as { entries: Array<Record<string, unknown>> }).entries;
    atlasEntries[1]!.iauCode = atlasEntries[0]!.iauCode;
    expect(() => parseConstellationPacketV591(duplicateAtlasCode)).toThrow("v591-constellation-atlas-entry-identity");
  });
});
