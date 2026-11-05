import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { JULIAN_DATE_J2000_V592 } from "./celestialClockV592";
import {
  MAJOR_MOON_ASSET_BLOCKED_IDS_V592,
  MAJOR_MOON_IDS_V592,
  MAJOR_MOON_MODELS_V592,
  MAJOR_MOON_MOTION_REFERENCE_COUNT_V592,
  MAJOR_MOON_PACKET_SHA256_V592,
  MAJOR_MOON_VISUAL_ASSET_ADMISSION_COUNT_V592,
  resolveMajorMoonRotationV592,
  serializeMajorMoonReplayV592,
} from "./majorMoonsV592";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("major moons v592", () => {
  it("admits all twelve NASA/JPL motion references while keeping every missing visual asset blocked", () => {
    expect(MAJOR_MOON_IDS_V592).toHaveLength(12);
    expect(new Set(MAJOR_MOON_IDS_V592).size).toBe(12);
    expect(MAJOR_MOON_MOTION_REFERENCE_COUNT_V592).toBe(12);
    expect(MAJOR_MOON_VISUAL_ASSET_ADMISSION_COUNT_V592).toBe(0);
    expect(MAJOR_MOON_ASSET_BLOCKED_IDS_V592).toEqual(MAJOR_MOON_IDS_V592);
    for (const moon of MAJOR_MOON_MODELS_V592) {
      expect(moon.visualAsset.proceduralFallbackAllowed).toBe(false);
      expect(moon.visualAsset.coloredPlaceholderAllowed).toBe(false);
      expect(moon.scientificPayloadWriteback).toBe(false);
    }
  });

  it("binds each moon to an existing J2000 Horizons state and parent identity", () => {
    for (const moon of MAJOR_MOON_MODELS_V592) {
      expect(moon.orbitStateAtJ2000.epochJdTdb).toBe(JULIAN_DATE_J2000_V592);
      expect(moon.orbitStateAtJ2000.relationshipStatus).toBe("existing-horizons-state-and-parent-identity-admitted");
      expect(moon.orbitStateAtJ2000.positionAu.every(Number.isFinite)).toBe(true);
      expect(moon.orbitStateAtJ2000.velocityAuPerDay.every(Number.isFinite)).toBe(true);
    }
  });

  it("preserves prograde and retrograde IAU prime-meridian signs", () => {
    expect(resolveMajorMoonRotationV592("io", JULIAN_DATE_J2000_V592).direction).toBe("prograde");
    expect(resolveMajorMoonRotationV592("titan", JULIAN_DATE_J2000_V592).direction).toBe("prograde");
    expect(resolveMajorMoonRotationV592("triton", JULIAN_DATE_J2000_V592).direction).toBe("retrograde");
    expect(resolveMajorMoonRotationV592("miranda", JULIAN_DATE_J2000_V592).direction).toBe("retrograde");
  });

  it("replays absolute prime meridians deterministically", () => {
    const epoch = JULIAN_DATE_J2000_V592 + 1_234.56789;
    expect(serializeMajorMoonReplayV592(epoch)).toBe(serializeMajorMoonReplayV592(epoch));
    for (const bodyId of MAJOR_MOON_IDS_V592) {
      const state = resolveMajorMoonRotationV592(bodyId, epoch);
      expect(state.primeMeridianDeg).toBeGreaterThanOrEqual(0);
      expect(state.primeMeridianDeg).toBeLessThan(360);
      expect(Math.hypot(...state.quaternionScene)).toBeCloseTo(1, 12);
      expect(state.scientificPayloadWriteback).toBe(false);
    }
  });

  it("rejects invalid epoch and unknown identities", () => {
    expect(() => resolveMajorMoonRotationV592("io", Number.NaN)).toThrow("v592-major-moon-julian-date");
    expect(() => resolveMajorMoonRotationV592("unknown" as never, JULIAN_DATE_J2000_V592)).toThrow("v592-major-moon-id:unknown");
  });

  it("seals the packet and generated identity", () => {
    const path = resolve(process.cwd(), "public/data/living-universe-v592/major-moons-reference.json");
    const packet = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const unsigned = { ...packet };
    delete unsigned.packetSha256;
    expect(packet.packetSha256).toBe(canonicalSha(unsigned));
    expect(packet.packetSha256).toBe(MAJOR_MOON_PACKET_SHA256_V592);
  });
});
