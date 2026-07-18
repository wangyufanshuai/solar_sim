import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
} from "./atlasHorizonsGateAudit";
import {
  createAtlasOuterSystemForceModelPreflightSummary,
} from "./atlasOuterSystemForceModelPreflight";
import {
  auditOuterSystemFixtureProvenance,
  runAtlasOuterSystemForceModelPreflightMatrix,
} from "./atlasOuterSystemForceModelPreflightRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v84 outer-system force-model preflight matrix", () => {
  it("audits fixture provenance and runs non-applied outer-system candidates", async () => {
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
    expect(v84OuterSystemDataset.variant).toBe(
      "v84-outer-system-barycenter-reference",
    );
    expect(v84OuterSystemDataset.targetProvenance?.length).toBe(12);
    expect(
      v84OuterSystemDataset.targetProvenance?.filter(
        (item) => item.role === "system-barycenter-reference",
      ).length,
    ).toBe(6);

    const oldAudit = auditOuterSystemFixtureProvenance({
      id: "v82-hierarchy-candidate",
      label: "v82 hierarchy candidate",
      baselineDataset,
      candidateDataset: v82HierarchyDataset,
      expectedVariant: "v82-hierarchy-barycenter-candidate",
    });
    const newAudit = auditOuterSystemFixtureProvenance({
      id: "v84-outer-system-barycenter",
      label: "v84 outer-system barycenter",
      baselineDataset,
      candidateDataset: v84OuterSystemDataset,
      expectedVariant: "v84-outer-system-barycenter-reference",
    });

    expect(oldAudit.status).toBe("provenance-insufficient");
    expect(oldAudit.outerSystemJ2000DeltaAu).toBe(0);
    expect(newAudit.status).toBe("ready");
    expect(newAudit.outerSystemJ2000DeltaAu).toBeGreaterThan(0);
    expect(newAudit.barycenterTargetCount).toBe(6);

    const { fixtureAudits, rows } = await runAtlasOuterSystemForceModelPreflightMatrix({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
    });
    const summary = createAtlasOuterSystemForceModelPreflightSummary({
      fixtureAudits,
      rows,
    });

    expect(summary.strictBlocker).toBe(V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED);
    expect(summary.candidateCount).toBe(5);
    expect(summary.completedCandidateCount).toBe(4);
    expect(summary.status).toMatch(
      /ready-upgrade-path-limited|ready-upgrade-path-actionable/,
    );
    expect(summary.classification).toMatch(
      /barycenter-reference-limit|missing-perturber-limit|gm-parity-limit|mixed/,
    );
    expect(summary.fixtureProvenanceMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "blocked-by-strict-horizons-gate",
    );
    expect(
      summary.fixtureAudits.find((audit) => audit.id === "v82-hierarchy-candidate")
        ?.status,
    ).toBe("provenance-insufficient");
    expect(
      summary.fixtureAudits.find((audit) => audit.id === "v84-outer-system-barycenter")
        ?.status,
    ).toBe("ready");
    expect(
      summary.candidateRows.find((row) => row.id === "v84-tno-kuiper-metadata-only")
        ?.status,
    ).toBe("metadata-only");
    for (const row of summary.candidateRows.filter((item) => item.status === "complete")) {
      expect(row.mutationStatus).toBe("not-applied");
      expect(row.onePnRmsPositionKm).toBeGreaterThan(0);
      expect(row.onePnRmsVelocityMs).toBeGreaterThan(0);
      expect(row.plutoPositionKm).toBeGreaterThan(0);
      expect(row.plutoVelocityMs).toBeGreaterThan(0);
    }
  }, 420_000);
});
