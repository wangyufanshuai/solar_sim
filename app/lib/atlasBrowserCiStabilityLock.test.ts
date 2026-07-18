import { describe, expect, it } from "vitest";
import {
  ATLAS_BROWSER_CI_STABILITY_LOCK_PROFILE,
  ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
  V94_BROWSER_CI_STABILITY_LOCK_ROW,
  createAtlasBrowserCiStabilityLockSummary,
} from "./atlasBrowserCiStabilityLock";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasBrowserCiStabilityLockAudit,
  AtlasBrowserCiStabilityLockRow,
} from "./simulationDiagnosticsTypes";

describe("v94 browser CI stability lock", () => {
  it("returns deterministic pending metadata for browser CI stability", () => {
    const summary = createAtlasBrowserCiStabilityLockSummary();

    expect(summary).toMatchObject({
      version: ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
      stabilityProfile: ATLAS_BROWSER_CI_STABILITY_LOCK_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      stabilityRowCount: 1,
      completedStabilityRowCount: 0,
      readyStabilityRowId: "",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      freshBrowserPort: 3015,
      screenshotRetryAttempts: 3,
      pixelSettleAttempts: 4,
      watchpackWarningPolicy: "known-windows-noise-non-failing",
      browserCiStabilityLock: "applied-contract-only",
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
      certificationClaimMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      scientificCertificationStatus: "browser-ci-stability-lock-not-nasa-jpl-certified",
    });
    expect(summary.stabilityRows).toEqual([V94_BROWSER_CI_STABILITY_LOCK_ROW]);
    expect(summary.trustedBoundary).toContain("browser and CI stability lock");
  });

  it("locks fresh browser command shape, retry counts and protected sky identity", () => {
    const row = V94_BROWSER_CI_STABILITY_LOCK_ROW;

    expect(row.browserFreshCommand).toBe("npm run test:atlas:browser:fresh");
    expect(row.browserCiStabilityCommand).toBe("npm run test:atlas:browser-ci-stability");
    expect(row.productFullCommand).toBe("npm run verify:atlas:full");
    expect(row.scientificVerifyCommand).toBe("npm run verify:atlas:scientific");
    expect(row.freshBrowserPort).toBe(3015);
    expect(row.screenshotRetryAttempts).toBe(3);
    expect(row.pixelSettleAttempts).toBe(4);
    expect(row.watchpackWarningPolicy).toBe("known-windows-noise-non-failing");
    expect(row.status).toBe("not-run");
    expect(row.screenshotRetryStatus).toBe("not-run");
    expect(row.pixelSettleStatus).toBe("not-run");
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
  });

  it("reports ready only when every browser CI stability lock passes", () => {
    const summary = createAtlasBrowserCiStabilityLockSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-browser-ci-locked");
    expect(summary.classification).toBe("browser-ci-stability-pass");
    expect(summary.completedStabilityRowCount).toBe(1);
    expect(summary.readyStabilityRowId).toBe("v94-lock-fresh-browser-ci-stability");
  });

  it("classifies screenshot, pixel, fresh server, command and docs regressions", () => {
    expect(
      createAtlasBrowserCiStabilityLockSummary({
        audits: [audit("screenshot-retry-lock", "regressed")],
      }).classification,
    ).toBe("screenshot-retry-regression");
    expect(
      createAtlasBrowserCiStabilityLockSummary({
        audits: [audit("pixel-settle-lock", "regressed")],
      }).classification,
    ).toBe("pixel-settle-regression");
    expect(
      createAtlasBrowserCiStabilityLockSummary({
        audits: [audit("fresh-server-lock", "regressed")],
      }).classification,
    ).toBe("fresh-server-regression");
    expect(
      createAtlasBrowserCiStabilityLockSummary({
        audits: [audit("command-ownership-lock", "regressed")],
      }).classification,
    ).toBe("command-ownership-regression");
    expect(
      createAtlasBrowserCiStabilityLockSummary({
        audits: [audit("docs-boundary-lock", "regressed")],
      }).classification,
    ).toBe("docs-boundary-regression");
  });
});

function readyAudits(): readonly AtlasBrowserCiStabilityLockAudit[] {
  return [
    audit("v93-release-evidence-lock", "ready"),
    audit("screenshot-retry-lock", "ready"),
    audit("pixel-settle-lock", "ready"),
    audit("fresh-server-lock", "ready"),
    audit("command-ownership-lock", "ready"),
    audit("docs-boundary-lock", "ready"),
    audit("surface-contract-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasBrowserCiStabilityLockAudit["id"],
  status: AtlasBrowserCiStabilityLockAudit["status"],
): AtlasBrowserCiStabilityLockAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v94 test browser CI stability audit",
  };
}

function completedRow(): AtlasBrowserCiStabilityLockRow {
  return {
    ...V94_BROWSER_CI_STABILITY_LOCK_ROW,
    status: "complete",
    releaseEvidenceStatus: "pass",
    screenshotRetryStatus: "pass",
    pixelSettleStatus: "pass",
    freshServerStatus: "pass",
    commandOwnershipStatus: "pass",
    docsBoundaryStatus: "pass",
    surfaceContractStatus: "pass",
    protectedMutationStatus: "pass",
    browserCiStabilityLock: "applied-contract-only",
  };
}
