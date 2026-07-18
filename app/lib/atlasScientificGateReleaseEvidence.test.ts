import { describe, expect, it } from "vitest";
import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_PROFILE,
  ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
  V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW,
  createAtlasScientificGateReleaseEvidenceSummary,
} from "./atlasScientificGateReleaseEvidence";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasScientificGateReleaseEvidenceAudit,
  AtlasScientificGateReleaseEvidenceRow,
} from "./simulationDiagnosticsTypes";

describe("v93 scientific gate release evidence bundle", () => {
  it("returns deterministic pending metadata for the release evidence bundle", () => {
    const summary = createAtlasScientificGateReleaseEvidenceSummary();

    expect(summary).toMatchObject({
      version: ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
      releaseEvidenceProfile: ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      releaseEvidenceRowCount: 1,
      completedReleaseEvidenceRowCount: 0,
      readyReleaseEvidenceRowId: "",
      migratedDefaultFixturePath:
        "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
      legacyV75FixturePath: "public/data/horizons-validation-j2000.json",
      migratedFixtureSha256:
        "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D",
      legacyFixtureSha256:
        "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B",
      scientificGateReleaseEvidence: "applied-contract-only",
      defaultGateConfigMutation: "not-applied",
      legacyAuditConfigMutation: "not-applied",
      livePhysicsMutation: "not-applied",
      workerPhysicsMutation: "not-applied",
      rk4DefaultMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      skyAssetMutation: "not-applied",
      backgroundMutation: "not-applied",
      materialMutation: "not-applied",
      fixtureDataMutation: "not-applied",
      budgetMutation: "not-applied",
      certificationClaimMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus:
        "offline-gate-release-evidence-not-nasa-jpl-certified",
    });
    expect(summary.releaseEvidenceRows).toEqual([V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW]);
    expect(summary.trustedBoundary).toContain("release evidence bundle lock");
  });

  it("locks release commands, fixtures, budgets and protected sky identity", () => {
    const row = V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW;
    const summary = createAtlasScientificGateReleaseEvidenceSummary();

    expect(row.productFullCommand).toBe("npm run verify:atlas:full");
    expect(row.scientificVerifyCommand).toBe("npm run verify:atlas:scientific");
    expect(row.maintenanceRunbookCommand).toBe("npm run test:atlas:scientific-gate-runbook");
    expect(row.provenanceFreezeCommand).toBe("npm run test:atlas:horizons-provenance-freeze");
    expect(row.offlineRuntimeBoundaryCommand).toBe("npm run test:atlas:offline-runtime-boundary");
    expect(row.migratedStrictGateCommand).toBe("npm run test:atlas:horizons-scientific-gate");
    expect(row.legacyV75AuditCommand).toBe(
      "npm run test:atlas:horizons-scientific-gate:legacy-v75",
    );
    expect(row.expectedInterpretation).toBe(
      "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only",
    );
    expect(row.status).toBe("not-run");
    expect(row.fixtureEvidenceStatus).toBe("not-run");
    expect(summary.strictBudgetPositionRmsKm).toBe(1_000_000);
    expect(summary.strictBudgetVelocityRmsMs).toBe(10);
    expect(summary.strictBudgetMercuryRatio).toBe(1.02);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm).toBe(1_000_000);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs).toBe(10);
    expect(ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio).toBe(1.02);
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when all release evidence locks and row statuses pass", () => {
    const summary = createAtlasScientificGateReleaseEvidenceSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-release-evidence-locked");
    expect(summary.classification).toBe("release-evidence-pass");
    expect(summary.completedReleaseEvidenceRowCount).toBe(1);
    expect(summary.readyReleaseEvidenceRowId).toBe(
      "v93-lock-offline-scientific-gate-release-evidence",
    );
  });

  it("classifies runbook, freeze, boundary, command, browser and docs regressions", () => {
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("v92-runbook-lock", "regressed")],
      }).classification,
    ).toBe("runbook-regression");
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("v90-provenance-freeze-lock", "regressed")],
      }).classification,
    ).toBe("provenance-freeze-regression");
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("v91-offline-runtime-boundary-lock", "regressed")],
      }).classification,
    ).toBe("offline-runtime-boundary-regression");
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("command-evidence-matrix-lock", "regressed")],
      }).classification,
    ).toBe("command-ownership-regression");
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("browser-evidence-lock", "regressed")],
      }).classification,
    ).toBe("browser-evidence-regression");
    expect(
      createAtlasScientificGateReleaseEvidenceSummary({
        audits: [audit("docs-evidence-lock", "regressed")],
      }).classification,
    ).toBe("docs-evidence-regression");
  });
});

function readyAudits(): readonly AtlasScientificGateReleaseEvidenceAudit[] {
  return [
    audit("v92-runbook-lock", "ready"),
    audit("v91-offline-runtime-boundary-lock", "ready"),
    audit("v90-provenance-freeze-lock", "ready"),
    audit("command-evidence-matrix-lock", "ready"),
    audit("fixture-evidence-lock", "ready"),
    audit("docs-evidence-lock", "ready"),
    audit("browser-evidence-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasScientificGateReleaseEvidenceAudit["id"],
  status: AtlasScientificGateReleaseEvidenceAudit["status"],
): AtlasScientificGateReleaseEvidenceAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v93 test release evidence audit",
  };
}

function completedRow(): AtlasScientificGateReleaseEvidenceRow {
  return {
    ...V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW,
    status: "complete",
    runbookStatus: "pass",
    provenanceFreezeStatus: "pass",
    offlineRuntimeBoundaryStatus: "pass",
    commandMatrixStatus: "pass",
    fixtureEvidenceStatus: "pass",
    docsEvidenceStatus: "pass",
    browserEvidenceStatus: "pass",
    protectedMutationStatus: "pass",
    scientificGateReleaseEvidence: "applied-contract-only",
  };
}
