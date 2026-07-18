import { describe, expect, it } from "vitest";
import {
  ATLAS_NUMERICAL_INTEGRITY_VERSION,
  classifyNumericalIntegrityDrift,
  createAtlasNumericalIntegritySummary,
  createNumericalIntegrityUnitAuditCoverage,
  runNumericalIntegrityTimeReversalFixture,
  runNumericalIntegrityTimestepSensitivityFixture,
} from "./atlasNumericalIntegrity";
import type { SimulationDiagnostics } from "./simulationDiagnosticsTypes";

describe("createAtlasNumericalIntegritySummary", () => {
  it("is deterministic with null diagnostics", () => {
    expect(createAtlasNumericalIntegritySummary(null)).toEqual(createAtlasNumericalIntegritySummary(null));
  });

  it("reports v54 metadata and local-test coverage without runtime claims", () => {
    const summary = createAtlasNumericalIntegritySummary(null);
    expect(summary).toEqual(
      expect.objectContaining({
        version: ATLAS_NUMERICAL_INTEGRITY_VERSION,
        integrityStatus: "informational",
        energyDriftTrend: "insufficient-data",
        angularMomentumDriftTrend: "insufficient-data",
        timestepSensitivityCoverage: "covered-by-local-tests-not-runtime-claimed",
        timeReversalCoverage: "covered-by-local-tests-not-runtime-claimed",
        unitAuditCoverage: "covered-by-local-tests-not-runtime-claimed",
        runtimeBenchmarkExecution: "not-run-in-runtime-ui",
        runtimeCertificationStatus: "not-claimed-in-app",
        ciCertificationStatus: "not-claimed",
        scientificCertificationStatus: "not-claimed",
        onlineValidationStatus: "not-claimed",
        physicsMutation: "not-applied",
      })
    );
    expect(summary.benchmarkDescriptors).toHaveLength(4);
    expect(JSON.stringify(summary)).not.toContain("trustScore");
    expect(JSON.stringify(summary)).not.toContain("online validation passed");
    expect(JSON.stringify(summary)).not.toContain("physics mutation");
    expect(JSON.stringify(summary)).not.toContain("CI certified");
  });

  it("derives ready drift trends from diagnostics", () => {
    const diagnostics = {
      relEnergyDrift: 8e-6,
      relAngMomDrift: 6e-6,
      energyHistory: [0, 2e-6, 5e-6],
      angMomHistory: [0, 1e-6, 4e-6],
    } as unknown as SimulationDiagnostics;

    const summary = createAtlasNumericalIntegritySummary(diagnostics);
    expect(summary.integrityStatus).toBe("ready");
    expect(summary.status).toBe("ready");
    expect(summary.energyDriftTrend).toBe("stable");
    expect(summary.angularMomentumDriftTrend).toBe("stable");
    expect(summary.currentEnergyDrift).toBe(8e-6);
    expect(summary.maxAngularMomentumDrift).toBe(6e-6);
  });

  it("classifies drift slopes as stable, watch, and warning", () => {
    expect(classifyNumericalIntegrityDrift([0, 1e-6, 2e-6], 3e-6).trend).toBe("stable");
    expect(classifyNumericalIntegrityDrift([0, 7e-6, 1.5e-5, 2.4e-5], 3.1e-5).trend).toBe("watch");
    expect(classifyNumericalIntegrityDrift([0, 4e-5, 8e-5, 1.2e-4], 1.6e-4).trend).toBe("warning");
    expect(classifyNumericalIntegrityDrift([], null).trend).toBe("insufficient-data");
  });

  it("keeps deterministic timestep sensitivity coverage outside runtime UI", () => {
    const first = runNumericalIntegrityTimestepSensitivityFixture();
    const second = runNumericalIntegrityTimestepSensitivityFixture();
    expect(first).toEqual(second);
    expect(first.fineNotWorse).toBe(true);
    expect(first.finePositionErrorMeters).toBeLessThanOrEqual(first.coarsePositionErrorMeters * 1.05);
    expect(first.coverage).toBe("covered-by-local-tests-not-runtime-claimed");
  });

  it("keeps deterministic time-reversal coverage outside runtime UI", () => {
    const first = runNumericalIntegrityTimeReversalFixture();
    const second = runNumericalIntegrityTimeReversalFixture();
    expect(first).toEqual(second);
    expect(first.positionRelativeError).toBeLessThan(1e-9);
    expect(first.velocityRelativeError).toBeLessThan(1e-9);
    expect(first.coverage).toBe("covered-by-local-tests-not-runtime-claimed");
  });

  it("audits units and the Kerr kernel boundary deterministically", () => {
    const audit = createNumericalIntegrityUnitAuditCoverage();
    expect(audit.auMeters).toBeGreaterThan(1e11);
    expect(audit.daySeconds).toBe(86_400);
    expect(audit.cMetersPerSecond).toBe(299_792_458);
    expect(audit.cAuPerDay).toBeGreaterThan(170);
    expect(audit.defaultSofteningMetersSquared).toBeGreaterThan(0);
    expect(audit.mercuryPrecessionTargetArcsecPerCentury).toBe(43);
    expect(audit.kerrKernelBoundary).toBe("eih-1pn+kerr-geodesic-v17");
    expect(audit.coverage).toBe("covered-by-local-tests-not-runtime-claimed");
  });
});
