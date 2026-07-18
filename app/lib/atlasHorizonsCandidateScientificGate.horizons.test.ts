import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasHorizonsCandidateScientificGateSummary,
} from "./atlasHorizonsCandidateScientificGate";
import {
  runAtlasHorizonsCandidateScientificGatePreflight,
  v86StrictBudgetContract,
} from "./atlasHorizonsCandidateScientificGateRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v86 Horizons candidate scientific gate preflight", () => {
  it("proves the v85 adoption path as a non-applied candidate scientific gate", async () => {
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json"),
        "utf8",
      ),
    );
    const v82HierarchyDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(
          process.cwd(),
          "public/data/horizons-validation-j2000-barycenter-candidate.json",
        ),
        "utf8",
      ),
    );
    const v84OuterSystemDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(
          process.cwd(),
          "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
        ),
        "utf8",
      ),
    );

    expect(baselineDataset.variant).toBeUndefined();
    expect(baselineDataset.targetProvenance).toBeUndefined();
    expect(v84OuterSystemDataset.variant).toBe(
      "v84-outer-system-barycenter-reference",
    );

    const { lockAudits, rows } = await runAtlasHorizonsCandidateScientificGatePreflight({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
    });
    const summary = createAtlasHorizonsCandidateScientificGateSummary({
      lockAudits,
      rows,
    });
    const row = summary.candidateRows[0]!;

    expect(v86StrictBudgetContract()).toEqual({
      horizonsPositionRmsKm: 1_000_000,
      horizonsVelocityRmsMs: 10,
      horizonsMercuryOnePnToNewtonRatio: 1.02,
    });
    expect(summary.status).toBe("candidate-gate-pass-unapplied");
    expect(summary.classification).toBe("candidate-budget-pass");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v75-strict-fixture-lock", "ready"],
      ["v84-reference-fixture-provenance", "ready"],
      ["v85-adoption-candidate-budget", "ready"],
      ["default-strict-scientific-gate-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.sourceAdoptionCandidateId).toBe(
      "v85-outer-system-barycenter-system-gm-adoption",
    );
    expect(row.datasetVariant).toBe("v84-outer-system-barycenter-reference");
    expect(row.massProfile).toBe("de440-system-gm");
    expect(row.dtDays).toBe(0.125);
    expect(row.softeningAu).toBe(0);
    expect(row.candidateBudgetStatus).toBe("pass");
    expect(row.defaultScientificGateStatus).toBe("expected-fail-unchanged");
    expect(row.onePnRmsPositionKm).toBeLessThan(1_000_000);
    expect(row.onePnRmsVelocityMs).toBeLessThan(10);
    expect(row.mercuryOnePnToNewtonRatio).toBeLessThan(1.02);
    expect(row.plutoPositionKm).toBeLessThan(10);
    expect(summary.defaultStrictFixtureMutation).toBe("not-applied");
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
    expect(summary.referenceFixtureAdoptionMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "candidate-only-default-gate-blocked",
    );
    expect(summary.trustedBoundary).toContain("does not migrate the default strict Horizons gate");
  }, 420_000);
});
