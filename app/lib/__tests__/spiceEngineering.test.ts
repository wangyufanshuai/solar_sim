import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { SolarSystemPhysicsRef } from "../solarSystemRef";
import {
  installSpiceEphemerisForTests,
  interpolateSpiceState,
  type SpiceEphemerisManifest,
} from "../spiceEphemerisTable";
import { solarOcclusionFactor } from "../solarOcclusion";
import { NASA_MASS_KG } from "../../data/nasaMasses";
import { auditPlanHighFidelity } from "../missionHighFidelity";
import { optimizeMission } from "../missionOptimizer";
import type { MissionBodyId, MissionPhysicsSnapshot } from "../missionDesignerTypes";

const manifest = JSON.parse(
  readFileSync("public/data/spice-ephemeris-v1-manifest.json", "utf8"),
) as SpiceEphemerisManifest;
const binary = readFileSync("public/data/spice-ephemeris-v1.bin");
const values = new Float64Array(
  binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength),
);
installSpiceEphemerisForTests(manifest, values);

describe("SPICE table interpolation", () => {
  it("returns exact table endpoints and valid brackets", () => {
    const first = interpolateSpiceState("earth", manifest.startSimDay);
    const last = interpolateSpiceState("saturn", manifest.stopSimDay);
    expect("reason" in first).toBe(false);
    expect("reason" in last).toBe(false);
    if ("reason" in first || "reason" in last) return;
    expect(first.bracket[0]).toBe(manifest.startSimDay);
    expect(last.bracket[1]).toBe(manifest.stopSimDay);
    expect(first.positionAu.every(Number.isFinite)).toBe(true);
    expect(last.velocityAuPerDay.every(Number.isFinite)).toBe(true);
  });

  it("rejects missing bodies and out-of-range epochs", () => {
    expect(interpolateSpiceState("earth", manifest.stopSimDay + 1)).toHaveProperty("reason");
    expect(interpolateSpiceState("venus", manifest.startSimDay - 1)).toHaveProperty("reason");
  });
});

describe("high-fidelity mission audit", () => {
  it("produces deterministic positive covariance growth", () => {
    const ids: MissionBodyId[] = ["earth", "venus", "jupiter", "saturn"];
    const bodies = Object.fromEntries(ids.map((id) => {
      const state = interpolateSpiceState(id, 0);
      if ("reason" in state) throw new Error(state.reason);
      return [id, {
        id,
        name: id,
        massKg: NASA_MASS_KG[id]!,
        posAu: state.positionAu,
        velAuPerDay: state.velocityAuPerDay,
      }];
    })) as MissionPhysicsSnapshot["bodies"];
    const snapshot: MissionPhysicsSnapshot = { simDays: 0, bodies };
    const result = optimizeMission({
      sequence: ids,
      departureStartDay: 35,
      departureWindowDays: 720,
      departureStepDays: 45,
      maxCandidates: 1,
      includeRelativity: true,
      ephemerisMode: "spice-table",
      constraintPreset: "aggressive",
    }, snapshot);
    expect(result.bestPlan).not.toBeNull();
    const first = auditPlanHighFidelity(result.bestPlan!, true);
    const second = auditPlanHighFidelity(result.bestPlan!, true);
    expect(first.covarianceAudit?.positiveSemidefinite).toBe(true);
    expect(first.covarianceAudit).toEqual(second.covarianceAudit);
    const nodes = first.covarianceAudit?.nodeThreeSigma ?? [];
    expect(nodes).toHaveLength(3);
    expect(nodes[2]!.positionKm).toBeGreaterThan(nodes[0]!.positionKm);
  });
});

describe("analytic solar occlusion", () => {
  const bodyIds = ["sun", "earth", "moon"] as const;

  it("detects an Earth eclipse at the Moon", () => {
    const physics = {
      n: 3,
      posAu: new Float64Array([0, 0, 0, 1, 0, 0, 1.00257, 0, 0]),
    } as unknown as SolarSystemPhysicsRef;
    expect(solarOcclusionFactor(physics, 2, bodyIds)).toBeLessThan(0.05);
  });

  it("returns full sunlight away from conjunction", () => {
    const physics = {
      n: 3,
      posAu: new Float64Array([0, 0, 0, 1, 0, 0, 1, 0.00257, 0]),
    } as unknown as SolarSystemPhysicsRef;
    expect(solarOcclusionFactor(physics, 2, bodyIds)).toBeGreaterThan(0.99);
  });
});
