import type {
  AtlasBrowserCiStabilityLockAudit,
  AtlasBrowserCiStabilityLockClassification,
  AtlasBrowserCiStabilityLockRow,
  AtlasBrowserCiStabilityLockSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION =
  "v94-browser-ci-stability-lock" as const;

export const ATLAS_BROWSER_CI_STABILITY_LOCK_PROFILE =
  "v94-fresh-browser-ci-runtime-stability" as const;

export const V94_BROWSER_CI_STABILITY_LOCK_BOUNDARY =
  "Local v94 browser and CI stability lock for fresh Playwright acceptance, screenshot retry, pixel settle sampling, fresh server teardown, command ownership and known Windows Watchpack noise. It does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification.";

export const V94_BROWSER_CI_STABILITY_LOCK_ROW: AtlasBrowserCiStabilityLockRow = {
  id: "v94-lock-fresh-browser-ci-stability",
  label: "Lock fresh browser CI stability and evidence capture",
  browserFreshCommand: "npm run test:atlas:browser:fresh",
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
  productFullCommand: "npm run verify:atlas:full",
  scientificVerifyCommand: "npm run verify:atlas:scientific",
  freshBrowserPort: 3015,
  screenshotRetryAttempts: 3,
  pixelSettleAttempts: 4,
  watchpackWarningPolicy: "known-windows-noise-non-failing",
  status: "not-run",
  releaseEvidenceStatus: "not-run",
  screenshotRetryStatus: "not-run",
  pixelSettleStatus: "not-run",
  freshServerStatus: "not-run",
  commandOwnershipStatus: "not-run",
  docsBoundaryStatus: "not-run",
  surfaceContractStatus: "not-run",
  protectedMutationStatus: "not-run",
  browserCiStabilityLock: "applied-contract-only",
} as const;

export function createAtlasBrowserCiStabilityLockSummary(
  args: {
    audits?: readonly AtlasBrowserCiStabilityLockAudit[];
    rows?: readonly AtlasBrowserCiStabilityLockRow[];
  } = {},
): AtlasBrowserCiStabilityLockSummary {
  const audits = args.audits ?? [];
  const stabilityRows = [
    args.rows?.find((row) => row.id === V94_BROWSER_CI_STABILITY_LOCK_ROW.id) ??
      V94_BROWSER_CI_STABILITY_LOCK_ROW,
  ];
  const completed = stabilityRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.releaseEvidenceStatus === "pass" &&
        row.screenshotRetryStatus === "pass" &&
        row.pixelSettleStatus === "pass" &&
        row.freshServerStatus === "pass" &&
        row.commandOwnershipStatus === "pass" &&
        row.docsBoundaryStatus === "pass" &&
        row.surfaceContractStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.releaseEvidenceStatus !== "pass" ||
      row.screenshotRetryStatus !== "pass" ||
      row.pixelSettleStatus !== "pass" ||
      row.freshServerStatus !== "pass" ||
      row.commandOwnershipStatus !== "pass" ||
      row.docsBoundaryStatus !== "pass" ||
      row.surfaceContractStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-browser-ci-blocked"
        : ready
          ? "ready-browser-ci-locked"
          : "ready-fresh-teardown-preserved";

  return {
    version: ATLAS_BROWSER_CI_STABILITY_LOCK_VERSION,
    stabilityProfile: ATLAS_BROWSER_CI_STABILITY_LOCK_PROFILE,
    status,
    classification: classifyBrowserCiStabilityLock({
      status,
      audits,
      ready,
    }),
    stabilityRowCount: stabilityRows.length,
    completedStabilityRowCount: completed.length,
    audits,
    stabilityRows,
    readyStabilityRowId: ready?.id ?? "",
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
    trustedBoundary: V94_BROWSER_CI_STABILITY_LOCK_BOUNDARY,
  };
}

function classifyBrowserCiStabilityLock(args: {
  status: AtlasBrowserCiStabilityLockSummary["status"];
  audits: readonly AtlasBrowserCiStabilityLockAudit[];
  ready: AtlasBrowserCiStabilityLockRow | null;
}): AtlasBrowserCiStabilityLockClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.audits.some(
      (audit) => audit.id === "screenshot-retry-lock" && audit.status !== "ready",
    )
  ) {
    return "screenshot-retry-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "pixel-settle-lock" && audit.status !== "ready",
    )
  ) {
    return "pixel-settle-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "fresh-server-lock" && audit.status !== "ready",
    )
  ) {
    return "fresh-server-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "command-ownership-lock" && audit.status !== "ready",
    )
  ) {
    return "command-ownership-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "docs-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-boundary-regression";
  }
  if (args.ready) return "browser-ci-stability-pass";
  return "mixed";
}
