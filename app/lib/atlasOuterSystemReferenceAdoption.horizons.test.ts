import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasOuterSystemReferenceAdoptionSummary,
} from "./atlasOuterSystemReferenceAdoption";
import {
  runAtlasOuterSystemReferenceAdoptionPreflight,
  v85StrictBudgetContract,
} from "./atlasOuterSystemReferenceAdoptionRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v85 outer-system reference adoption preflight matrix", () => {
  it("proves the v84 fixture plus DE440 system GM as a non-applied adoption candidate", async () => {
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

    const { lockAudits, rows } = await runAtlasOuterSystemReferenceAdoptionPreflight({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
    });
    const summary = createAtlasOuterSystemReferenceAdoptionSummary({
      lockAudits,
      rows,
    });
    const row = summary.candidateRows[0]!;

    expect(v85StrictBudgetContract()).toEqual({
      horizonsPositionRmsKm: 1_000_000,
      horizonsVelocityRmsMs: 10,
      horizonsMercuryOnePnToNewtonRatio: 1.02,
    });
    expect(summary.status).toBe("ready-adoption-candidate");
    expect(summary.classification).toBe("default-gate-not-migrated");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v75-strict-fixture-lock", "ready"],
      ["v84-reference-fixture-provenance", "ready"],
      ["v82-legacy-candidate-provenance", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.datasetVariant).toBe("v84-outer-system-barycenter-reference");
    expect(row.massProfile).toBe("de440-system-gm");
    expect(row.dtDays).toBe(0.125);
    expect(row.softeningAu).toBe(0);
    expect(row.candidateBudgetStatus).toBe("pass");
    expect(row.onePnRmsPositionKm).toBeLessThan(1_000_000);
    expect(row.onePnRmsVelocityMs).toBeLessThan(10);
    expect(row.mercuryOnePnToNewtonRatio).toBeLessThan(1.02);
    expect(row.plutoPositionKm).toBeLessThan(10);
    expect(summary.defaultStrictFixtureMutation).toBe("not-applied");
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
    expect(summary.referenceFixtureAdoptionMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "candidate-only-default-gate-blocked",
    );
    expect(summary.trustedBoundary).toContain("does not replace the v75 strict fixture");
  }, 420_000);
});
