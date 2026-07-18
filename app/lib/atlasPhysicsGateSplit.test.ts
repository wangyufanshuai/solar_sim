import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_PHYSICS_GATE_SPLIT_PROFILE,
  ATLAS_PHYSICS_GATE_SPLIT_VERSION,
  createAtlasPhysicsGateSplitSummary,
} from "./atlasPhysicsGateSplit";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { createAtlasCloseupVisualFidelitySummary } from "./atlasCloseupVisualFidelity";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v78 product/scientific physics gate split", () => {
  it("returns deterministic product-ready and strict-Horizons-blocked metadata", () => {
    const summary = createAtlasPhysicsGateSplitSummary();

    expect(summary).toMatchObject({
      version: ATLAS_PHYSICS_GATE_SPLIT_VERSION,
      gateSplitProfile: ATLAS_PHYSICS_GATE_SPLIT_PROFILE,
      productReleaseGateStatus: "pass",
      scientificHorizonsGateStatus: "pending-runtime-run",
      scientificFailureClassification: "pending",
      strictHorizonsFailureMeasured: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      strictHorizonsThreshold: "RMS < 1,000,000 km / 10 m/s; Mercury +10y ratio < 1.02",
      strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate",
      productFullCommand: "npm run verify:atlas:full",
      scientificFullCommand: "npm run verify:atlas:scientific",
      releaseSemantics: "product-full-excludes-strict-horizons-scientific-gate",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.trustedBoundary).toContain("does not relax v75 Horizons thresholds");
  });

  it("keeps v75 budgets, v69/v71 sky, and v76 product-ready visual contract unchanged", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
    expect(createAtlasCloseupVisualFidelitySummary().fullReleaseGateStatus).toBe(
      "product-ready-scientific-horizons-blocked",
    );
  });

  it("classifies the current strict Horizons blocker as scientific model-limit only", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"), "utf8"),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasPhysicsGateSplitSummary(run);

    expect(summary.productReleaseGateStatus).toBe("pass");
    expect(summary.scientificHorizonsGateStatus).toBe("blocked-model-limit");
    expect(summary.scientificFailureClassification).toBe("model-limit");
    expect(summary.strictHorizonsFailureMeasured).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
  }, 120_000);

  it("splits package scripts between product full verification and scientific certification", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts["verify:atlas:full"]).toBe("npm run verify:atlas && npm run test:atlas:browser:fresh");
    expect(pkg.scripts["test:atlas:horizons-gate"]).toBe("npm run test:atlas:horizons-scientific-gate");
    expect(pkg.scripts["test:atlas:horizons-scientific-gate"]).toBe(
      "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    );
    expect(pkg.scripts["verify:atlas:scientific"]).toBe(
      "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
    );
  });
});
