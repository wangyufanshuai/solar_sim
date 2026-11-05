import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { LivingConstellationRangeV592 } from "../workers/livingStarfieldV592.worker";
import { raDecToCelestialPositionV590 } from "./celestialDeepSpaceV590";
import {
  CONSTELLATION_ART_COVERAGE_V592,
  CONSTELLATION_ART_RADIUS_V592,
  buildConstellationEngravingGeometryV592,
} from "./constellationArtV592";

type BindingV592 = Readonly<{
  iauCode: string;
  name: string;
  waypoints: readonly Readonly<{ anchorRaDeg: number; anchorDecDeg: number }>[];
}>;

const packet = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json"), "utf8")) as {
  bindings: readonly BindingV592[];
};
const referenceReceipt = JSON.parse(readFileSync(resolve(process.cwd(), "docs/release/v592/constellation-art-reference-receipt-v592.json"), "utf8")) as {
  source: { implementation: { sha256: string } };
  admission: { admittedCount: number; uniqueSignatureCount: number };
  entries: readonly { code: string; signature: string }[];
};

function geometryInputV592(binding: BindingV592): { segments: Float32Array; range: LivingConstellationRangeV592 } {
  const directions = binding.waypoints.map((waypoint) => raDecToCelestialPositionV590(waypoint.anchorRaDeg, waypoint.anchorDecDeg, CONSTELLATION_ART_RADIUS_V592));
  const segments: number[] = [];
  for (let index = 0; index + 1 < directions.length; index += 1) segments.push(...directions[index]!, ...directions[index + 1]!);
  const center = directions.reduce((sum, direction) => [sum[0] + direction[0], sum[1] + direction[1], sum[2] + direction[2]] as [number, number, number], [0, 0, 0] as [number, number, number]);
  const length = Math.hypot(...center) || 1;
  return {
    segments: new Float32Array(segments),
    range: {
      code: binding.iauCode,
      name: binding.name,
      segmentOffset: 0,
      segmentCount: Math.max(0, directions.length - 1),
      center: [center[0] / length * CONSTELLATION_ART_RADIUS_V592, center[1] / length * CONSTELLATION_ART_RADIUS_V592, center[2] / length * CONSTELLATION_ART_RADIUS_V592],
    },
  };
}

describe("v592 data-derived constellation engraving", () => {
  it("builds finite, deterministic and uniquely signed geometry for all 88 Gaia-bound constellations", () => {
    expect(packet.bindings).toHaveLength(CONSTELLATION_ART_COVERAGE_V592.requiredCount);
    const signatures = new Set<string>();
    const referenceSignatures = new Map(referenceReceipt.entries.map((entry) => [entry.code, entry.signature]));
    for (const binding of packet.bindings) {
      const input = geometryInputV592(binding);
      const first = buildConstellationEngravingGeometryV592(input.segments, input.range);
      const replay = buildConstellationEngravingGeometryV592(input.segments, input.range);
      expect(first.signature, binding.iauCode).toBe(replay.signature);
      expect(first.signature, `${binding.iauCode}:reference-receipt`).toBe(referenceSignatures.get(binding.iauCode));
      expect([...first.outlinePositions], binding.iauCode).toEqual([...replay.outlinePositions]);
      expect(first.uniqueAnchorCount, binding.iauCode).toBeGreaterThanOrEqual(2);
      expect(first.outlinePositions.length, binding.iauCode).toBeGreaterThanOrEqual(12);
      expect(first.innerOutlinePositions.length, binding.iauCode).toBe(first.outlinePositions.length);
      expect(first.fillTrianglePositions.length, binding.iauCode).toBe(first.outlinePositions.length * 3);
      expect([...first.outlinePositions, ...first.innerOutlinePositions, ...first.hatchSegmentPositions, ...first.fillTrianglePositions].every(Number.isFinite), binding.iauCode).toBe(true);
      signatures.add(first.signature);
    }
    expect(signatures.size).toBe(88);
    expect(referenceReceipt.admission).toEqual(expect.objectContaining({ admittedCount: 88, uniqueSignatureCount: 88 }));
    expect(referenceReceipt.source.implementation.sha256).toBe(createHash("sha256").update(readFileSync(resolve(process.cwd(), "app/lib/constellationArtV592.ts"))).digest("hex"));
  });

  it("rejects a missing asterism rather than drawing a fallback glyph", () => {
    expect(() => buildConstellationEngravingGeometryV592(new Float32Array(), {
      code: "Bad",
      name: "Blocked",
      segmentOffset: 0,
      segmentCount: 0,
      center: [0, 0, CONSTELLATION_ART_RADIUS_V592],
    })).toThrow("v592-constellation-art-empty:Bad");
  });
});
