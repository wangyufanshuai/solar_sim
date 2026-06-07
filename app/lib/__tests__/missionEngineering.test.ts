import { describe, expect, it } from "vitest";
import { AU_METERS, DAY_SECONDS, G_SI } from "../physicalConstants";
import { solveLambertTransfer } from "../lambertSolver";
import { JPL_EPHEMERIS_TABLE, interpolateJplState } from "../jplEphemerisTable";
import {
  MISSION_CONSTRAINT_PRESETS,
  auditMissionPlan,
  injectionDeltaVKms,
  optimizeMission,
  propellantEstimateKg,
} from "../missionOptimizer";
import type {
  MissionPhysicsSnapshot,
  MissionPlan,
  MissionSegment,
} from "../missionDesignerTypes";

const SUN_MU = G_SI * 1.98847e30;

function circularVelocityAuPerDay(radiusAu: number, angleRad: number): [number, number, number] {
  const speedMps = Math.sqrt(SUN_MU / (radiusAu * AU_METERS));
  const speedAuDay = (speedMps * DAY_SECONDS) / AU_METERS;
  return [-Math.sin(angleRad) * speedAuDay, Math.cos(angleRad) * speedAuDay, 0];
}

function body(
  id: "earth" | "venus" | "jupiter" | "saturn",
  radiusAu: number,
  angleRad: number,
) {
  return {
    id,
    name: id,
    massKg: 1,
    posAu: [Math.cos(angleRad) * radiusAu, Math.sin(angleRad) * radiusAu, 0] as [number, number, number],
    velAuPerDay: circularVelocityAuPerDay(radiusAu, angleRad),
  };
}

const snapshot: MissionPhysicsSnapshot = {
  simDays: 0,
  bodies: {
    earth: body("earth", 1, 0),
    venus: body("venus", 0.723, 1.2),
    jupiter: body("jupiter", 5.204, 2.35),
    saturn: body("saturn", 9.58, 3.1),
  },
};

function segment(overrides: Partial<MissionSegment> = {}): MissionSegment {
  return {
    id: "earth-venus",
    fromBody: "earth",
    toBody: "venus",
    departureDay: 0,
    arrivalDay: 155,
    tofDays: 155,
    deltaVKms: 3,
    dsmDeltaVKms: 0.2,
    c3Km2S2: 50,
    lambertConverged: true,
    lambertIterations: 20,
    lambertResidual: 0.5,
    departureVinfinityKms: 4,
    arrivalVinfinityKms: 5,
    periapsisAltitudeKm: 1000,
    flybySafetyMargin: 0.5,
    flybyFeasible: true,
    requiredTurnAngleDeg: 20,
    maxTurnAngleDeg: 40,
    bPlaneRisk: "low",
    closestApproachKm: 7000,
    turnAngleDeg: 20,
    communicationDelayMin: 4,
    burnAttitude: "prograde",
    antennaPointing: "earth",
    solarArrayPointing: "sun",
    kalmanSigmaKm: 100,
    risk: "low",
    trajectoryAu: [[1, 0, 0], [0.7, 0.2, 0]],
    ...overrides,
  };
}

describe("Lambert solver", () => {
  it("converges for a nominal 60-degree heliocentric transfer", () => {
    const angle = Math.PI / 3;
    const result = solveLambertTransfer({
      r1M: [AU_METERS, 0, 0],
      r2M: [Math.cos(angle) * AU_METERS, Math.sin(angle) * AU_METERS, 0],
      tofSeconds: 105 * DAY_SECONDS,
      mu: SUN_MU,
      toleranceSeconds: 2,
    });
    expect(result.converged).toBe(true);
    expect(result.residualSeconds).toBeLessThanOrEqual(105 * DAY_SECONDS * 1e-6);
    expect(result.departureVelocityMps.every(Number.isFinite)).toBe(true);
  });

  it("rejects singular near-180-degree geometry", () => {
    const result = solveLambertTransfer({
      r1M: [AU_METERS, 0, 0],
      r2M: [-AU_METERS, 0, 0],
      tofSeconds: 180 * DAY_SECONDS,
      mu: SUN_MU,
    });
    expect(result.converged).toBe(false);
    expect(result.error).toMatch(/singular/);
  });
});

describe("mission engineering calculations", () => {
  it("uses parking altitude in injection delta-v", () => {
    expect(injectionDeltaVKms(3.2, 300)).toBeGreaterThan(3);
    expect(injectionDeltaVKms(3.2, 1000)).not.toBe(injectionDeltaVKms(3.2, 300));
  });

  it("uses the rocket equation for configurable dry mass and Isp", () => {
    const lowIsp = propellantEstimateKg(3, 4200, 320);
    const highIsp = propellantEstimateKg(3, 4200, 450);
    expect(lowIsp).toBeGreaterThan(highIsp);
    expect(propellantEstimateKg(0, 4200, 450)).toBe(0);
  });

  it("marks exact limits as pass and exceeded limits as fail", () => {
    const constraints = MISSION_CONSTRAINT_PRESETS.nominal;
    const base = {
      segments: [
        segment({ c3Km2S2: constraints.maxC3Km2S2, periapsisAltitudeKm: constraints.minVenusFlybyAltitudeKm }),
        segment({
          id: "venus-jupiter",
          fromBody: "venus",
          toBody: "jupiter",
          periapsisAltitudeKm: constraints.minJupiterFlybyAltitudeKm,
        }),
      ],
      totalDeltaVKms: constraints.maxTotalDeltaVKms,
      dsmReserveDeltaVKms: constraints.maxDsmDeltaVKms,
      durationDays: constraints.maxDurationDays,
      navigationUncertaintyKm: constraints.maxNavigationUncertaintyKm,
    } satisfies Pick<MissionPlan, "segments" | "totalDeltaVKms" | "dsmReserveDeltaVKms" | "durationDays" | "navigationUncertaintyKm">;
    expect(auditMissionPlan(base, constraints).status).toBe("warning");
    expect(auditMissionPlan({ ...base, totalDeltaVKms: constraints.maxTotalDeltaVKms + 0.01 }, constraints).status).toBe("fail");
  });

  it("keeps failed candidates out of feasible ranking and produces deterministic sensitivity", () => {
    const options = {
      sequence: ["earth", "venus", "jupiter", "saturn"] as const,
      departureStartDay: 35,
      departureWindowDays: 180,
      departureStepDays: 45,
      maxCandidates: 5,
      includeRelativity: false,
      ephemerisMode: "live-circular" as const,
      constraintPreset: "aggressive" as const,
    };
    const first = optimizeMission({ ...options, sequence: [...options.sequence] }, snapshot);
    const second = optimizeMission({ ...options, sequence: [...options.sequence] }, snapshot);
    expect(first.plans.every((plan) => plan.validationStatus !== "fail")).toBe(true);
    expect(first.rejectedPlans.every((plan) => plan.validationStatus === "fail")).toBe(true);
    expect(first.plans.map((plan) => plan.sensitivitySummary)).toEqual(second.plans.map((plan) => plan.sensitivitySummary));
  });

  it("interpolates JPL table endpoints and rejects missing coverage", () => {
    const earth0 = interpolateJplState("earth", 0);
    expect("reason" in earth0).toBe(false);
    if ("reason" in earth0) return;
    expect(earth0.positionAu.every(Number.isFinite)).toBe(true);
    expect(earth0.velocityAuPerDay.every(Number.isFinite)).toBe(true);
    const earthMid = interpolateJplState("earth", JPL_EPHEMERIS_TABLE.stepDays * 0.5);
    expect("reason" in earthMid).toBe(false);
    const out = interpolateJplState("earth", JPL_EPHEMERIS_TABLE.stopSimDay + 10);
    expect("reason" in out).toBe(true);
  });

  it("uses JPL table provenance and ephemeris audit in optimizer output", () => {
    const result = optimizeMission({
      sequence: ["earth", "venus", "jupiter", "saturn"],
      departureStartDay: 35,
      departureWindowDays: 90,
      departureStepDays: 45,
      maxCandidates: 4,
      includeRelativity: false,
      ephemerisMode: "jpl-table",
      constraintPreset: "aggressive",
    }, snapshot);
    const plan = result.bestPlan ?? result.rejectedPlans[0];
    expect(plan).toBeTruthy();
    expect(plan?.solverProvenance.ephemerisSource).toBe("JPL Horizons table interpolation");
    expect(plan?.ephemerisAudit.mode).toBe("jpl-table");
    expect(plan?.ephemerisAudit.liveVsTableDelta.length).toBeGreaterThan(0);
  });

  it("rejects JPL candidates outside table coverage without silent live fallback", () => {
    const result = optimizeMission({
      sequence: ["earth", "venus", "jupiter", "saturn"],
      departureStartDay: JPL_EPHEMERIS_TABLE.stopSimDay + 50,
      departureWindowDays: 45,
      departureStepDays: 45,
      maxCandidates: 3,
      includeRelativity: false,
      ephemerisMode: "jpl-table",
      constraintPreset: "aggressive",
    }, snapshot);
    expect(result.plans.length).toBe(0);
    expect(result.rejectedPlans.length).toBeGreaterThan(0);
    expect(result.rejectedPlans[0]?.rejectionReasons.join(" ")).toMatch(/JPL table coverage/);
  });
});
