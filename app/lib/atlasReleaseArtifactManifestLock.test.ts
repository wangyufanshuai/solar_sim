import { describe, expect, it } from "vitest";
import {
  ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_PROFILE,
  ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
  V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW,
  createAtlasReleaseArtifactManifestLockSummary,
} from "./atlasReleaseArtifactManifestLock";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasReleaseArtifactManifestLockAudit,
  AtlasReleaseArtifactManifestLockRow,
} from "./simulationDiagnosticsTypes";

describe("v95 release artifact manifest lock", () => {
  it("returns deterministic pending metadata for the release artifact manifest", () => {
    const summary = createAtlasReleaseArtifactManifestLockSummary();

    expect(summary).toMatchObject({
      version: ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
      artifactManifestProfile: ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      manifestRowCount: 1,
      completedManifestRowCount: 0,
      readyManifestRowId: "",
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      freshBrowserPort: 3015,
      v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png",
      v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png",
      rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only",
      releaseArtifactManifestLock: "applied-contract-only",
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
      scientificCertificationStatus: "release-artifact-manifest-lock-not-nasa-jpl-certified",
    });
    expect(summary.manifestRows).toEqual([V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW]);
    expect(summary.trustedBoundary).toContain("release artifact manifest lock");
  });

  it("locks artifact manifest row shape and protected sky identity", () => {
    const row = V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW;

    expect(row.productFullCommand).toBe("npm run verify:atlas:full");
    expect(row.scientificVerifyCommand).toBe("npm run verify:atlas:scientific");
    expect(row.releaseEvidenceCommand).toBe("npm run test:atlas:scientific-gate-release-evidence");
    expect(row.browserCiStabilityCommand).toBe("npm run test:atlas:browser-ci-stability");
    expect(row.browserFreshCommand).toBe("npm run test:atlas:browser:fresh");
    expect(row.freshBrowserPort).toBe(3015);
    expect(row.v93ScreenshotGlob).toBe("test-results/v93-scientific-gate-release-evidence-lock/**/*.png");
    expect(row.v94ScreenshotGlob).toBe("test-results/v94-browser-ci-stability-lock/**/*.png");
    expect(row.rollbackInterpretation).toBe("legacy-v75-rollback-blocker-evidence-only");
    expect(row.status).toBe("not-run");
    expect(row.releaseArtifactManifestLock).toBe("applied-contract-only");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when every artifact manifest lock passes", () => {
    const summary = createAtlasReleaseArtifactManifestLockSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-artifact-manifest-locked");
    expect(summary.classification).toBe("release-artifact-manifest-pass");
    expect(summary.completedManifestRowCount).toBe(1);
    expect(summary.readyManifestRowId).toBe("v95-lock-release-artifact-manifest");
  });

  it("classifies command, fixture, browser, docs, rollback and mutation regressions", () => {
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("command-matrix-artifact-lock", "regressed")],
      }).classification,
    ).toBe("command-matrix-regression");
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("fixture-artifact-lock", "regressed")],
      }).classification,
    ).toBe("fixture-artifact-regression");
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("browser-artifact-lock", "regressed")],
      }).classification,
    ).toBe("browser-artifact-regression");
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("docs-artifact-lock", "regressed")],
      }).classification,
    ).toBe("docs-artifact-regression");
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("rollback-boundary-lock", "regressed")],
      }).classification,
    ).toBe("rollback-boundary-regression");
    expect(
      createAtlasReleaseArtifactManifestLockSummary({
        audits: [audit("protected-mutation-lock", "regressed")],
      }).classification,
    ).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasReleaseArtifactManifestLockAudit[] {
  return [
    audit("v93-release-evidence-lock", "ready"),
    audit("v94-browser-ci-stability-lock", "ready"),
    audit("command-matrix-artifact-lock", "ready"),
    audit("fixture-artifact-lock", "ready"),
    audit("browser-artifact-lock", "ready"),
    audit("docs-artifact-lock", "ready"),
    audit("rollback-boundary-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasReleaseArtifactManifestLockAudit["id"],
  status: AtlasReleaseArtifactManifestLockAudit["status"],
): AtlasReleaseArtifactManifestLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v95 test release artifact manifest audit",
  };
}

function completedRow(): AtlasReleaseArtifactManifestLockRow {
  return {
    ...V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW,
    status: "complete",
    releaseEvidenceStatus: "pass",
    browserCiStabilityStatus: "pass",
    commandMatrixStatus: "pass",
    fixtureArtifactStatus: "pass",
    browserArtifactStatus: "pass",
    docsArtifactStatus: "pass",
    rollbackBoundaryStatus: "pass",
    protectedMutationStatus: "pass",
    releaseArtifactManifestLock: "applied-contract-only",
  };
}
