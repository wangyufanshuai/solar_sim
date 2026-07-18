import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import {
  ATLAS_RELEASE_READINESS_PROFILE,
  ATLAS_RELEASE_READINESS_VERSION,
  createAtlasReleaseReadinessSummary,
} from "./atlasReleaseReadiness";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v79 release readiness gate semantics", () => {
  it("exposes deterministic product-ready and scientific-blocker documentation metadata", () => {
    const summary = createAtlasReleaseReadinessSummary();

    expect(summary).toMatchObject({
      version: ATLAS_RELEASE_READINESS_VERSION,
      readinessProfile: ATLAS_RELEASE_READINESS_PROFILE,
      productReleaseGateStatus: "pass",
      scientificHorizonsGateStatus: "pending-runtime-run",
      productFullCommand: "npm run verify:atlas:full",
      scientificFullCommand: "npm run verify:atlas:scientific",
      strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate",
      knownScientificBlocker: V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
      releaseSemantics: "product-ready-scientific-horizons-blocked",
      documentationScope: "readme-technical-overview-evidence-validation-dom",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.trustedBoundary).toContain("does not relax Horizons thresholds");
  });

  it("keeps strict Horizons budgets and locked v9 sky unchanged", () => {
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.desktopBase).toBe("/textures/sky/orbit-atlas-v9-base-8k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileBase).toBe("/textures/sky/orbit-atlas-v9-base-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });

  it("reports the current strict Horizons run as a scientific certification blocker only", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"), "utf8"),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasReleaseReadinessSummary(run);

    expect(summary.productReleaseGateStatus).toBe("pass");
    expect(summary.scientificHorizonsGateStatus).toBe("blocked-model-limit");
    expect(summary.knownScientificBlocker).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
  }, 120_000);

  it("documents the package command split without rebinding product full verification to strict Horizons", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts["verify:atlas:full"]).toBe("npm run verify:atlas && npm run test:atlas:browser:fresh");
    expect(pkg.scripts["verify:atlas:full"]).not.toContain("horizons");
    expect(pkg.scripts["verify:atlas:scientific"]).toContain("test:atlas:horizons-scientific-gate");
    expect(pkg.scripts["test:atlas:horizons-gate"]).toBe("npm run test:atlas:horizons-scientific-gate");
  });
});
