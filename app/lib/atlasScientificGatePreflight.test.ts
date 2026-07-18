import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { createAtlasCloseupVisualFidelitySummary } from "./atlasCloseupVisualFidelity";
import { createAtlasPhysicsGateSplitSummary } from "./atlasPhysicsGateSplit";
import { createAtlasReleaseReadinessSummary } from "./atlasReleaseReadiness";
import {
  ATLAS_SCIENTIFIC_GATE_PREFLIGHT_PROFILE,
  ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
  createAtlasScientificGatePreflightSummary,
} from "./atlasScientificGatePreflight";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v80 scientific Horizons closure preflight", () => {
  it("returns deterministic product-ready and strict-scientific-blocked preflight metadata", () => {
    const summary = createAtlasScientificGatePreflightSummary();

    expect(summary).toMatchObject({
      version: ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
      preflightProfile: ATLAS_SCIENTIFIC_GATE_PREFLIGHT_PROFILE,
      status: "product-ready-strict-scientific-blocked-preflight-ready",
      productReleaseGateStatus: "pass",
      scientificHorizonsGateStatus: "pending-runtime-run",
      knownScientificBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      candidatePathCount: 3,
      strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate",
      productFullCommand: "npm run verify:atlas:full",
      scientificFullCommand: "npm run verify:atlas:scientific",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.trustedBoundary).toContain("does not relax v75 thresholds");
  });

  it("locks the three candidate upgrade paths as not-applied roadmap entries", () => {
    const summary = createAtlasScientificGatePreflightSummary();

    expect(summary.candidatePaths.map((path) => path.id)).toEqual([
      "ephemeris-initial-state-upgrade",
      "solar-system-force-model-upgrade",
      "high-order-integrator-upgrade",
    ]);
    for (const path of summary.candidatePaths) {
      expect(path.status).toBe("not-applied");
      expect(path.target).toBeTruthy();
      expect(path.rationale).toBeTruthy();
      expect(path.expectedEvidence).toBeTruthy();
      expect(path.physicsMutation).toBe("not-applied");
      expect(path.budgetMutation).toBe("not-applied");
    }
  });

  it("keeps v75 budgets, v69/v71 sky, v76 visual, v78 split and v79 readiness unchanged", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
    expect(createAtlasCloseupVisualFidelitySummary().fullReleaseGateStatus).toBe(
      "product-ready-scientific-horizons-blocked",
    );
    expect(createAtlasPhysicsGateSplitSummary().releaseSemantics).toBe(
      "product-full-excludes-strict-horizons-scientific-gate",
    );
    expect(createAtlasReleaseReadinessSummary().releaseSemantics).toBe(
      "product-ready-scientific-horizons-blocked",
    );
  });

  it("reports the current strict Horizons run as blocked while keeping preflight ready", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"), "utf8"),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasScientificGatePreflightSummary(run);

    expect(summary.productReleaseGateStatus).toBe("pass");
    expect(summary.scientificHorizonsGateStatus).toBe("blocked-model-limit");
    expect(summary.knownScientificBlocker).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
    expect(summary.status).toBe("product-ready-strict-scientific-blocked-preflight-ready");
  }, 120_000);
});
