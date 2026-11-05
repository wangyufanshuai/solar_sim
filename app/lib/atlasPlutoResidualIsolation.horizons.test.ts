import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  createAtlasPlutoResidualIsolationSummary,
} from "./atlasPlutoResidualIsolation";
import {
  runAtlasPlutoResidualIsolationMatrix,
} from "./atlasPlutoResidualIsolationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v83 Pluto residual isolation matrix", () => {
  it("runs targeted non-applied outer-system candidates and keeps strict Horizons blocked", async () => {
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"),
        "utf8",
      ),
    );
    const hierarchyDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(
          process.cwd(),
          "public/data/horizons-validation-j2000-barycenter-candidate.json",
        ),
        "utf8",
      ),
    );

    const rows = await runAtlasPlutoResidualIsolationMatrix({
      baselineDataset,
      hierarchyDataset,
    });
    const summary = createAtlasPlutoResidualIsolationSummary(rows);

    expect(summary.strictBlocker).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
    expect(summary.candidateCount).toBe(6);
    expect(summary.completedCandidateCount).toBe(6);
    expect(summary.status).toBe("ready-candidate-limited");
    expect(summary.classification).toMatch(
      /likely-force-model-limit|likely-reference-model-limit|likely-integrator-limit|mixed/,
    );
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "blocked-by-strict-horizons-gate",
    );

    expect(summary.baselinePlutoPlus10y.candidateId).toBe(
      "v82-solar-gm-zero-softening-half-step",
    );
    expect(summary.baselinePlutoPlus10y.positionKm).toBeGreaterThan(0);
    expect(summary.bestCandidatePlutoPlus10y.positionKm).toBeGreaterThan(0);
    expect(summary.bestCandidatePlutoPlus10y.improvementVsBaseline).toBeGreaterThan(0);
    expect(summary.bestCandidatePlutoPlus10y.onePnRmsPositionKm).toBeGreaterThan(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    );
    expect(summary.plutoExcludedAggregate.excludedBodyId).toBe("pluto");
    expect(summary.plutoExcludedAggregate.bodyCount).toBeGreaterThanOrEqual(9);
    expect(summary.plutoExcludedAggregate.onePnRmsPositionKm).toBeGreaterThan(0);
    expect(summary.plutoExcludedAggregate.onePnRmsVelocityMs).toBeGreaterThan(0);
    expect(summary.dominantRtnComponent).toMatch(/radial|transverse|normal/);

    for (const row of summary.candidateRows) {
      expect(row.status).toBe("complete");
      expect(row.mutationStatus).toBe("not-applied");
      expect(row.plutoPositionKm).toBeGreaterThan(0);
      expect(row.plutoVelocityMs).toBeGreaterThan(0);
      expect(row.plutoRtn.basisStatus).toBe("ready");
      expect(row.plutoRtn.positionNormKm).toBeCloseTo(row.plutoPositionKm ?? Number.NaN, 6);
      expect(row.plutoExcludedAggregate.excludedBodyId).toBe("pluto");
    }
  }, 420_000);
});
