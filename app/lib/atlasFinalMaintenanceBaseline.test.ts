import { describe, expect, it } from "vitest";
import {
  ATLAS_FINAL_MAINTENANCE_BASELINE_PROFILE,
  ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
  V96_FINAL_MAINTENANCE_BASELINE_ROW,
  createAtlasFinalMaintenanceBaselineSummary,
} from "./atlasFinalMaintenanceBaseline";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasFinalMaintenanceBaselineAudit,
  AtlasFinalMaintenanceBaselineRow,
} from "./simulationDiagnosticsTypes";

describe("v96 final maintenance baseline", () => {
  it("returns deterministic pending metadata for the final maintenance baseline", () => {
    const summary = createAtlasFinalMaintenanceBaselineSummary();

    expect(summary).toMatchObject({
      version: ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
      maintenanceBaselineProfile: ATLAS_FINAL_MAINTENANCE_BASELINE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      baselineRowCount: 1,
      completedBaselineRowCount: 0,
      readyBaselineRowId: "",
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
      maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
      offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
      migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade",
      finalMaintenanceBaseline: "applied-contract-only",
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
      defaultGateConfigMutation: "not-applied",
      releasePackagingMutation: "not-applied",
      certificationClaimMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "final-maintenance-baseline-not-nasa-jpl-certified",
    });
    expect(summary.baselineRows).toEqual([V96_FINAL_MAINTENANCE_BASELINE_ROW]);
    expect(summary.trustedBoundary).toContain("final maintenance baseline");
  });

  it("locks final entrypoints and protected sky identity", () => {
    const row = V96_FINAL_MAINTENANCE_BASELINE_ROW;

    expect(row.productFullCommand).toBe("npm run verify:atlas:full");
    expect(row.scientificVerifyCommand).toBe("npm run verify:atlas:scientific");
    expect(row.releaseArtifactManifestCommand).toBe("npm run test:atlas:release-artifact-manifest");
    expect(row.browserCiStabilityCommand).toBe("npm run test:atlas:browser-ci-stability");
    expect(row.releaseEvidenceCommand).toBe("npm run test:atlas:scientific-gate-release-evidence");
    expect(row.maintenanceRunbookCommand).toBe("npm run test:atlas:scientific-gate-runbook");
    expect(row.provenanceFreezeCommand).toBe("npm run test:atlas:horizons-provenance-freeze");
    expect(row.offlineRuntimeBoundaryCommand).toBe("npm run test:atlas:offline-runtime-boundary");
    expect(row.finalBaselinePolicy).toBe("post-v96-scientific-mainline-requires-intentional-upgrade");
    expect(row.status).toBe("not-run");
    expect(row.finalMaintenanceBaseline).toBe("applied-contract-only");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when every final maintenance baseline lock passes", () => {
    const summary = createAtlasFinalMaintenanceBaselineSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-maintenance-baseline-locked");
    expect(summary.classification).toBe("final-maintenance-baseline-pass");
    expect(summary.completedBaselineRowCount).toBe(1);
    expect(summary.readyBaselineRowId).toBe("v96-lock-final-maintenance-baseline");
  });

  it("classifies full, scientific, artifact, gate, docs and mutation regressions", () => {
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("product-full-verify-entrypoint-lock", "regressed")],
      }).classification,
    ).toBe("full-verify-regression");
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("scientific-verify-entrypoint-lock", "regressed")],
      }).classification,
    ).toBe("scientific-verify-regression");
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("v95-release-artifact-manifest-lock", "regressed")],
      }).classification,
    ).toBe("artifact-manifest-regression");
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("scientific-gate-chain-lock", "regressed")],
      }).classification,
    ).toBe("scientific-gate-regression");
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("docs-baseline-lock", "regressed")],
      }).classification,
    ).toBe("docs-baseline-regression");
    expect(
      createAtlasFinalMaintenanceBaselineSummary({
        audits: [audit("protected-mutation-lock", "regressed")],
      }).classification,
    ).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasFinalMaintenanceBaselineAudit[] {
  return [
    audit("v95-release-artifact-manifest-lock", "ready"),
    audit("product-full-verify-entrypoint-lock", "ready"),
    audit("scientific-verify-entrypoint-lock", "ready"),
    audit("scientific-gate-chain-lock", "ready"),
    audit("post-baseline-policy-lock", "ready"),
    audit("docs-baseline-lock", "ready"),
    audit("browser-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasFinalMaintenanceBaselineAudit["id"],
  status: AtlasFinalMaintenanceBaselineAudit["status"],
): AtlasFinalMaintenanceBaselineAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v96 test final maintenance baseline audit",
  };
}

function completedRow(): AtlasFinalMaintenanceBaselineRow {
  return {
    ...V96_FINAL_MAINTENANCE_BASELINE_ROW,
    status: "complete",
    artifactManifestStatus: "pass",
    productFullEntrypointStatus: "pass",
    scientificVerifyEntrypointStatus: "pass",
    scientificGateChainStatus: "pass",
    postBaselinePolicyStatus: "pass",
    docsBaselineStatus: "pass",
    browserSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    finalMaintenanceBaseline: "applied-contract-only",
  };
}
