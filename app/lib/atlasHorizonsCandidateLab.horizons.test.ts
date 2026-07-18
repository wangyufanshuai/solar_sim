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
  createAtlasHorizonsCandidateLabSummary,
} from "./atlasHorizonsCandidateLab";
import { runAtlasHorizonsCandidateMatrix } from "./atlasHorizonsCandidateLabRunner";
import {
  HORIZONS_VALIDATION_DT_DAYS,
  runHorizonsValidationDataset,
} from "./horizonsValidationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";
import type { AtlasHorizonsCandidateProfileId } from "./simulationDiagnosticsTypes";

describe("v82 Horizons candidate matrix", () => {
  it("runs non-applied GM, softening, step, and hierarchy candidates", async () => {
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

    const strictRun = await runHorizonsValidationDataset(baselineDataset);
    const rows = await runAtlasHorizonsCandidateMatrix({
      baselineDataset,
      hierarchyDataset,
    });
    const summary = createAtlasHorizonsCandidateLabSummary(rows);

    expect(HORIZONS_VALIDATION_DT_DAYS).toBe(0.25);
    expect(summary.strictGateBaselineMeasured).toBe(
      V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    );
    expect(summary.candidateCount).toBe(5);
    expect(summary.completedCandidateCount).toBe(5);
    expect(summary.candidateMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");

    const baseline = row(summary, "baseline-v75-strict");
    const solarGm = row(summary, "de440-solar-gm");
    const halfStep = row(
      summary,
      "de440-solar-gm-zero-softening-half-step",
    );
    const hierarchy = row(
      summary,
      "de440-system-gm-zero-softening-half-step-hierarchy",
    );

    const strictOnePn = strictRun.modes.find((mode) => mode.mode === "1pn");
    expect(baseline.onePnRmsPositionKm).toBeCloseTo(
      strictOnePn?.rmsPositionKm ?? Number.NaN,
      6,
    );
    expect(baseline.onePnRmsVelocityMs).toBeCloseTo(
      strictOnePn?.rmsVelocityMs ?? Number.NaN,
      10,
    );
    expect(baseline.onePnRmsPositionKm).toBeGreaterThan(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    );
    expect(baseline.onePnRmsVelocityMs).toBeGreaterThan(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    );

    expect(solarGm.mercuryVelocityImprovementVsBaseline).toBeGreaterThan(50);
    expect(halfStep.onePnRmsVelocityMs).toBeLessThan(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    );
    expect(hierarchy.datasetRole).toBe("v82-hierarchy-reference");
    expect(hierarchy.plutoPositionImprovementVsBaseline).toBeGreaterThan(1);
    expect(hierarchy.onePnRmsPositionKm).toBeGreaterThan(
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    );
    expect(summary.status).toBe("candidate-partial-unapplied");
  }, 300_000);
});

function row(
  summary: ReturnType<typeof createAtlasHorizonsCandidateLabSummary>,
  id: AtlasHorizonsCandidateProfileId,
) {
  const found = summary.candidateRows.find((item) => item.id === id);
  if (!found) throw new Error(`Missing candidate row ${String(id)}`);
  expect(found.status).toBe("complete");
  return found;
}
