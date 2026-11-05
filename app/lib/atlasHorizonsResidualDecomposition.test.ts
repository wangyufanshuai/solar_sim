import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_PROFILE,
  ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
  createAtlasHorizonsResidualDecompositionSummary,
} from "./atlasHorizonsResidualDecomposition";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  createHorizonsOrbitalResidual,
  createReferenceRtnBasis,
} from "./horizonsResidualFrame";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { AU_METERS, DAY_SECONDS } from "./physicalConstants";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v81 Horizons residual decomposition", () => {
  it("projects position and velocity residuals into the reference RTN basis", () => {
    const oneKilometerAu = 1000 / AU_METERS;
    const oneMeterPerSecondAuD = DAY_SECONDS / AU_METERS;
    const residual = createHorizonsOrbitalResidual({
      referencePositionAu: [1, 0, 0],
      referenceVelocityAuD: [0, 1, 0],
      measuredPositionAu: [
        1 + 2 * oneKilometerAu,
        3 * oneKilometerAu,
        -4 * oneKilometerAu,
      ],
      measuredVelocityAuD: [
        5 * oneMeterPerSecondAuD,
        1 - 6 * oneMeterPerSecondAuD,
        7 * oneMeterPerSecondAuD,
      ],
    });

    expect(residual.basisStatus).toBe("ready");
    expect(residual.radialPositionKm).toBeCloseTo(2, 7);
    expect(residual.transversePositionKm).toBeCloseTo(3, 7);
    expect(residual.normalPositionKm).toBeCloseTo(-4, 7);
    expect(residual.radialVelocityMs).toBeCloseTo(5, 10);
    expect(residual.transverseVelocityMs).toBeCloseTo(-6, 10);
    expect(residual.normalVelocityMs).toBeCloseTo(7, 10);
    expect(residual.positionNormKm).toBeCloseTo(Math.sqrt(29), 7);
    expect(residual.velocityNormMs).toBeCloseTo(Math.sqrt(110), 10);
  });

  it("builds an orthonormal RTN basis and rejects degenerate or non-finite references", () => {
    const basis = createReferenceRtnBasis([2, 1, 0.5], [-0.2, 0.8, 0.1]);
    expect(basis).not.toBeNull();
    if (!basis) return;
    expect(vectorNorm(basis.radial)).toBeCloseTo(1, 12);
    expect(vectorNorm(basis.transverse)).toBeCloseTo(1, 12);
    expect(vectorNorm(basis.normal)).toBeCloseTo(1, 12);
    expect(dot(basis.radial, basis.transverse)).toBeCloseTo(0, 12);
    expect(dot(basis.radial, basis.normal)).toBeCloseTo(0, 12);
    expect(dot(basis.transverse, basis.normal)).toBeCloseTo(0, 12);
    expect(createReferenceRtnBasis([0, 0, 0], [0, 0, 0])).toBeNull();
    expect(createReferenceRtnBasis([Number.NaN, 0, 0], [0, 1, 0])).toBeNull();
  });

  it("marks the Sun-origin residual basis as degenerate without inventing components", () => {
    const residual = createHorizonsOrbitalResidual({
      referencePositionAu: [0, 0, 0],
      referenceVelocityAuD: [0, 0, 0],
      measuredPositionAu: [0, 0, 0],
      measuredVelocityAuD: [0, 0, 0],
    });
    expect(residual).toMatchObject({
      basisStatus: "degenerate",
      radialPositionKm: null,
      transversePositionKm: null,
      normalPositionKm: null,
      positionNormKm: 0,
      velocityNormMs: 0,
    });
  });

  it("returns deterministic pending metadata without runtime residuals", () => {
    const summary = createAtlasHorizonsResidualDecompositionSummary();
    expect(summary).toMatchObject({
      version: ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
      decompositionProfile: ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_PROFILE,
      status: "pending-runtime-run",
      sourceAuditStatus: "pending-runtime-run",
      referenceFrame: "sun-centered-reference-rtn",
      contributionScope: "finite-non-sun-rtn-bodies-per-mode-checkpoint",
      modeCount: 0,
      checkpointCount: 0,
      decomposableBodyCount: 0,
      residualRowCount: 0,
      dominantBodyId: "",
      budgetMutation: "not-applied",
      physicsMutation: "not-applied",
      skyAssetMutation: "not-applied",
      materialMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    });
    expect(summary.trustedBoundary).toContain("do not prove a root cause");
  });

  it("locks budgets and the legacy V9 sky while decomposing the real run", async () => {
    const dataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"),
        "utf8",
      ),
    );
    const run = await runHorizonsValidationDataset(dataset);
    const summary = createAtlasHorizonsResidualDecompositionSummary(run);

    expect(summary.status).toBe("ready-blocked-model-limit");
    expect(summary.sourceAuditStatus).toBe("blocked-model-limit");
    expect(summary.knownScientificBlocker).toBe(
      V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    );
    expect(summary.modeCount).toBe(2);
    expect(summary.checkpointCount).toBe(6);
    expect(summary.decomposableBodyCount).toBe(11);
    expect(summary.residualRowCount).toBe(66);
    expect(summary.tenYearBodyComparisons).toHaveLength(11);

    for (const checkpoint of summary.checkpointSummaries) {
      expect(checkpoint.bodyCount).toBe(11);
      expect(checkpoint.positionContributionTotal).toBeCloseTo(1, 12);
      expect(checkpoint.velocityContributionTotal).toBeCloseTo(1, 12);
      for (const row of checkpoint.rows) {
        expect(
          Math.hypot(
            row.radialPositionKm,
            row.transversePositionKm,
            row.normalPositionKm,
          ),
        ).toBeCloseTo(row.positionNormKm, 7);
        expect(
          Math.hypot(
            row.radialVelocityMs,
            row.transverseVelocityMs,
            row.normalVelocityMs,
          ),
        ).toBeCloseTo(row.velocityNormMs, 7);
      }
    }

    const onePnTenYear = summary.checkpointSummaries.find(
      (checkpoint) =>
        checkpoint.mode === "1pn" && checkpoint.checkpointLabel === "+10y",
    );
    expect(onePnTenYear?.dominantPositionBodyId).toBe("pluto");
    expect(summary.dominantBodyId).toBe("pluto");

    for (const mode of run.modes) {
      for (const checkpoint of mode.checkpoints) {
        for (const body of checkpoint.bodyComparisons) {
          expect(body.orbitalResidual?.positionNormKm).toBeCloseTo(
            body.deltaRKm,
            10,
          );
          expect(body.orbitalResidual?.velocityNormMs).toBeCloseTo(
            body.deltaVMs,
            10,
          );
        }
      }
    }

    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(
      1_000_000,
    );
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    ).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  }, 120_000);
});

function vectorNorm(value: readonly [number, number, number]): number {
  return Math.hypot(value[0], value[1], value[2]);
}

function dot(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}
