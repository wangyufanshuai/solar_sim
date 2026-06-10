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
import {
  appendMissionRun,
  createMissionProject,
  createMissionScenario,
  missionComparisonRows,
  missionEngineeringMatrix,
  missionLegsToCsv,
  parseMissionProjectJson,
} from "../missionProject";
import { missionPlanToCcsdsOem, missionPlanToCcsdsOpm } from "../missionCcsds";
import { auditPlanHighFidelity } from "../missionHighFidelity";
import { MISSION_REPORT_CAVEAT, missionPlanToMarkdown, missionPlanToReportJson } from "../missionReport";
import {
  DEFAULT_MONTE_CARLO_CONFIG,
  appendMissionNotebookEntry,
  appendMissionRiskResult,
  createMissionNotebookEntry,
  createMissionReviewPackage,
  missionManeuverEventsToCsv,
  missionReviewPackageToMarkdown,
  missionStateHistoryToCsv,
  runMissionMonteCarloLite,
  trajectoryInspectionSamples,
} from "../missionReview";
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
    departurePositionAu: [1, 0, 0],
    arrivalPositionAu: [0.7, 0.2, 0],
    departureVelocityAuPerDay: [0, 0.017, 0],
    arrivalVelocityAuPerDay: [-0.01, 0.014, 0],
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

  it("exports deterministic mission report JSON and Markdown with audit provenance", () => {
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
    if (!plan) return;

    const advisor = {
      summary: "Local summary",
      fuelTradeoff: "Fuel note",
      gravityAssist: "Assist note",
      risk: "Risk note",
      communication: "Comms note",
      recommendation: "Recommendation",
      tags: ["local-ai"],
      provider: "local" as const,
    };
    const json = missionPlanToReportJson(plan, advisor, result);
    expect(json.caveat).toBe(MISSION_REPORT_CAVEAT);
    expect(json.plan.solverProvenance.ephemerisSource).toBe("JPL Horizons table interpolation");
    expect(json.resultSummary?.bestPlanId).toBe(result.bestPlan?.id ?? null);
    expect(json.advisor?.summary).toBe("Local summary");

    const markdown = missionPlanToMarkdown(plan, advisor, result);
    expect(markdown).toContain(MISSION_REPORT_CAVEAT);
    expect(markdown).toContain("## Ephemeris Audit");
    expect(markdown).toContain("JPL Horizons table interpolation");
    expect(markdown).toContain("## Constraint Checks");
    expect(markdown).toContain("## Rejected Candidates");
    expect(markdown).toContain("Local summary");
  });

  it("round-trips Project v2, migrates v1, appends runs, and exports CCSDS OEM/OPM", () => {
    const options = {
      sequence: ["earth", "venus", "jupiter", "saturn"] as const,
      departureStartDay: 35,
      departureWindowDays: 90,
      departureStepDays: 45,
      maxCandidates: 4,
      includeRelativity: false,
      ephemerisMode: "jpl-table" as const,
      constraintPreset: "aggressive" as const,
    };
    const result = optimizeMission({ ...options, sequence: [...options.sequence] }, snapshot);
    const plan = result.bestPlan ?? result.rejectedPlans[0];
    expect(plan).toBeTruthy();
    if (!plan) return;

    const scenario = createMissionScenario({
      name: "EVJS demo",
      epochSimDays: snapshot.simDays,
      options: { ...options, sequence: [...options.sequence] },
      constraints: MISSION_CONSTRAINT_PRESETS.aggressive,
      selectedPlanId: plan.id,
    });
    const project = createMissionProject({ name: "Solar Sim demo project", scenario, result });
    const restored = parseMissionProjectJson(JSON.stringify(project));
    expect(restored.schemaVersion).toBe(2);
    expect(restored.scenarios[0]?.selectedPlanId).toBe(plan.id);
    expect(restored.runs[0]?.result.bestPlan?.id ?? restored.runs[0]?.result.rejectedPlans[0]?.id).toBeTruthy();

    const matrix = missionEngineeringMatrix(result);
    expect(matrix.length).toBe(result.plans.length + result.rejectedPlans.length);
    expect(matrix.filter((row) => row.verdict !== "fail").every((row) => row.reportReady)).toBe(true);
    expect(matrix.filter((row) => row.verdict === "fail").every((row) => !row.reportReady)).toBe(true);
    expect(result.plans.every((candidate) => candidate.lowThrustSolutions.every((solution) => solution.status !== "seed"))).toBe(true);

    const appended = appendMissionRun(project, scenario.id, result, plan.id);
    expect(appended.runs).toHaveLength(2);
    expect(project.runs).toHaveLength(1);
    expect(appended.runs[0]).not.toBe(appended.runs[1]);
    const compare = missionComparisonRows(appended, appended.runs.map((run) => run.id));
    expect(compare).toHaveLength(2);
    expect(compare.every((row) => row.monteCarloSuccessRate === null)).toBe(true);

    const v1 = {
      ...project,
      schemaVersion: 1,
      scenarios: project.scenarios.map((item) => ({ ...item, schemaVersion: 1 })),
      runs: project.runs.map(({ schemaVersion: _schemaVersion, inputHash: _inputHash, solverVersion: _solverVersion, spiceChecksum: _spiceChecksum, constraintsSnapshot: _constraintsSnapshot, status: _status, reportReadiness: _reportReadiness, ...run }) => run),
    };
    const migrated = parseMissionProjectJson(JSON.stringify(v1));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.runs[0]?.inputHash).toMatch(/^fnv1a-/);

    const csv = missionLegsToCsv(plan);
    expect(csv).toContain('"leg","departure_day","arrival_day"');
    expect(csv).toContain('"earth-venus"');

    const auditedPlan = auditPlanHighFidelity(plan, false);
    const riskA = runMissionMonteCarloLite(auditedPlan, appended.runs[1]!.id, {
      ...DEFAULT_MONTE_CARLO_CONFIG,
      samples: 32,
      seed: "deterministic-test",
    });
    const riskB = runMissionMonteCarloLite(auditedPlan, appended.runs[1]!.id, {
      ...DEFAULT_MONTE_CARLO_CONFIG,
      samples: 32,
      seed: "deterministic-test",
    });
    expect(riskA.successRate).toBe(riskB.successRate);
    expect(riskA.deltaV.p50).toBe(riskB.deltaV.p50);
    const riskProject = appendMissionRiskResult(appended, riskA);
    const compareWithRisk = missionComparisonRows(riskProject, riskProject.runs.map((run) => run.id));
    expect(compareWithRisk.some((row) => row.monteCarloSuccessRate !== null)).toBe(true);
    const notebook = createMissionNotebookEntry({
      run: riskProject.runs[1]!,
      note: "Risk review captured",
      decision: "Keep as preliminary baseline",
      riskTags: ["navigation", "finite-thrust"],
    });
    const notebookProject = appendMissionNotebookEntry(riskProject, notebook);
    expect(notebookProject.runs[1]).toBe(riskProject.runs[1]);
    expect(notebookProject.runNotebooks?.[0]?.auditSnapshot.inputHash).toBe(riskProject.runs[1]!.inputHash);
    const review = createMissionReviewPackage({
      project: notebookProject,
      run: notebookProject.runs[1]!,
      comparisonRows: compareWithRisk,
      engineeringMatrix: matrix,
      monteCarlo: riskA,
    });
    expect(review.caveat).toContain("Not GMAT/STK/SPICE certification");
    expect(review.monteCarlo?.dominantFailureReason).toBeTruthy();
    expect(missionReviewPackageToMarkdown(review)).toContain("## Monte Carlo Lite");

    const stateCsv = missionStateHistoryToCsv(auditedPlan);
    expect(stateCsv).toContain('"epoch_tdb_jd"');
    expect(stateCsv).toContain('"vx_km_s"');
    const maneuverCsv = missionManeuverEventsToCsv(auditedPlan);
    expect(maneuverCsv).toContain('"dv_mag_km_s"');
    const samples = trajectoryInspectionSamples(auditedPlan);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.every((sample, index) => index === 0 || sample.simDay >= samples[index - 1]!.simDay)).toBe(true);

    const oem = missionPlanToCcsdsOem(auditedPlan);
    expect(oem).toContain("CCSDS_OEM_VERS = 3.0");
    expect(oem).toContain("CENTER_NAME = SUN");
    expect(oem).toContain("REF_FRAME = ECLIPJ2000");
    expect(oem).toContain("TIME_SYSTEM = TDB");
    const epochs = oem
      .split("\n")
      .filter((line) => /^\d{4}-\d{2}-\d{2}T/.test(line))
      .map((line) => line.split(" ")[0]!);
    expect(epochs.length).toBeGreaterThan(1);
    expect(epochs.every((epoch, index) => index === 0 || epoch >= epochs[index - 1]!)).toBe(true);
    expect(auditedPlan.cowellAudit?.stateHistory.length).toBeGreaterThan(auditedPlan.segments.length);
    expect(auditedPlan.cowellAudit?.stateHistory.every((sample) =>
      sample.positionKm.every(Number.isFinite) && sample.velocityKmS.every(Number.isFinite),
    )).toBe(true);

    const opm = missionPlanToCcsdsOpm(auditedPlan);
    expect(opm).toContain("CCSDS_OPM_VERS = 3.0");
    expect(opm).toContain("COV_REF_FRAME = ECLIPJ2000");
    expect(opm).toContain("MAN_EPOCH_IGNITION");
    expect(opm).toContain("MAN_REF_FRAME = ECLIPJ2000");
  });
});
