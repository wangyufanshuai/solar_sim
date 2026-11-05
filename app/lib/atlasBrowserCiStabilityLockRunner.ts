import { createAtlasScientificGateReleaseEvidenceSummary } from "./atlasScientificGateReleaseEvidence";
import {
  runAtlasScientificGateReleaseEvidenceAudit,
} from "./atlasScientificGateReleaseEvidenceRunner";
import {
  V94_BROWSER_CI_STABILITY_LOCK_ROW,
} from "./atlasBrowserCiStabilityLock";
import type {
  AtlasBrowserCiStabilityLockAudit,
  AtlasBrowserCiStabilityLockRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasBrowserCiStabilityLockAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  migratedFixtureAudit?: FixtureEvidenceAudit;
  legacyFixtureAudit?: FixtureEvidenceAudit;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
  freshConfigText?: string;
}): Promise<{
  audits: readonly AtlasBrowserCiStabilityLockAudit[];
  rows: readonly AtlasBrowserCiStabilityLockRow[];
}> {
  const releaseEvidenceAudit = await runAtlasScientificGateReleaseEvidenceAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText: args.docsText,
    surfaceText: [
      args.surfaceText ?? "",
      args.browserSpecText ?? "",
    ].join("\n"),
  });
  const releaseEvidenceSummary = createAtlasScientificGateReleaseEvidenceSummary({
    audits: releaseEvidenceAudit.audits,
    rows: releaseEvidenceAudit.rows,
  });
  const browserSpecText = args.browserSpecText ?? "";
  const freshConfigText = args.freshConfigText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const docsText = args.docsText ?? "";
  const audits = [
    releaseEvidenceLock(releaseEvidenceSummary.status, releaseEvidenceSummary.classification),
    screenshotRetryLock(browserSpecText),
    pixelSettleLock(browserSpecText),
    freshServerLock(freshConfigText, docsText),
    commandOwnershipLock(args.packageScripts),
    docsBoundaryLock(docsText),
    surfaceContractLock(surfaceText, browserSpecText),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasBrowserCiStabilityLockAudit[];

  return {
    audits,
    rows: [browserCiStabilityRow(audits)],
  };
}

function releaseEvidenceLock(
  status: string,
  classification: string,
): AtlasBrowserCiStabilityLockAudit {
  const ready = status === "ready-release-evidence-locked" && classification === "release-evidence-pass";
  return audit(
    "v93-release-evidence-lock",
    "v93 release evidence remains ready",
    ready,
    `${status}; ${classification}`,
    "ready-release-evidence-locked; release-evidence-pass",
    "Browser CI stability can pass only while v93 release evidence remains locked.",
  );
}

function screenshotRetryLock(browserSpecText: string): AtlasBrowserCiStabilityLockAudit {
  const ready =
    browserSpecText.includes("async function captureV50ReviewScreenshot") &&
    browserSpecText.includes("for (let attempt = 0; attempt < 3; attempt += 1)") &&
    browserSpecText.includes("lastError") &&
    browserSpecText.includes("await page.screenshot({ path, fullPage: false })") &&
    browserSpecText.includes("requestAnimationFrame");
  return audit(
    "screenshot-retry-lock",
    "bounded screenshot capture retry helper",
    ready,
    ready ? "3-attempt screenshot retry helper present" : "screenshot retry helper missing",
    "3-attempt screenshot retry helper present",
    "Fresh browser screenshots must tolerate one transient Chrome protocol failure without relaxing assertions.",
  );
}

function pixelSettleLock(browserSpecText: string): AtlasBrowserCiStabilityLockAudit {
  const ready =
    browserSpecText.includes("for (let attempt = 0; attempt < 4; attempt += 1)") &&
    browserSpecText.includes("backdropPixelMetricsPass(metrics, mode)") &&
    browserSpecText.includes("closeupMaterialMetricsPass(metrics, target)") &&
    browserSpecText.includes("async function resetBrowserForVisualSampling") &&
    browserSpecText.includes('await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" })') &&
    browserSpecText.includes("await page.waitForTimeout(attempt === 0 ? 220 : 450)") &&
    browserSpecText.includes("expect(metrics!.highBrightRatio") &&
    browserSpecText.includes("expect(metrics!.highRatio");
  return audit(
    "pixel-settle-lock",
    "stable pixel sampling without threshold relaxation",
    ready,
    ready ? "4-attempt pixel settle helpers and fresh visual checkpoints preserve assertions" : "pixel settle helper missing",
    "4-attempt pixel settle helpers and fresh visual checkpoints preserve assertions",
    "Pixel budgets must use fresh visual sampling checkpoints and wait for render settle while keeping the same backdrop and material thresholds.",
  );
}

function freshServerLock(
  freshConfigText: string,
  docsText: string,
): AtlasBrowserCiStabilityLockAudit {
  const ready =
    freshConfigText.includes('const baseUrl = "http://127.0.0.1:3015"') &&
    freshConfigText.includes('globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts"') &&
    freshConfigText.includes("reuseExistingServer: false") &&
    freshConfigText.includes("timeout: 120_000") &&
    docsText.includes("3015") &&
    docsText.includes("Watchpack") &&
    docsText.includes("DumpStack.log.tmp") &&
    docsText.includes("pagefile.sys");
  return audit(
    "fresh-server-lock",
    "fresh browser server and Windows warning policy",
    ready,
    ready ? "fresh 3015 server and Watchpack warning policy locked" : "fresh server policy missing",
    "fresh 3015 server and Watchpack warning policy locked",
    "Fresh browser acceptance must use a clean 3015 server with teardown and document known Windows Watchpack noise.",
  );
}

function commandOwnershipLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasBrowserCiStabilityLockAudit {
  const measured = [
    packageScripts?.["test:atlas:browser:fresh"] ?? "missing",
    packageScripts?.["test:atlas:browser-ci-stability"] ?? "missing",
    packageScripts?.["verify:atlas:full"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
  ].join(" | ");
  const expected = [
    "playwright test -c playwright.atlas.fresh.config.ts",
    "vitest run app/lib/atlasBrowserCiStabilityLock.horizons.test.ts",
    "npm run verify:atlas && npm run test:atlas:browser:fresh",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
  ].join(" | ");
  return audit(
    "command-ownership-lock",
    "browser CI command ownership",
    measured === expected,
    measured,
    expected,
    "Browser CI stability must keep fresh acceptance, v94 audit, full verify and scientific verify command ownership separate.",
  );
}

function docsBoundaryLock(docsText: string): AtlasBrowserCiStabilityLockAudit {
  const ready =
    docsText.includes("v94 Browser/CI Stability Lock") &&
    docsText.includes("browser and CI stability lock") &&
    docsText.includes("not a scientific model") &&
    docsText.includes("does not change live runtime physics") &&
    docsText.includes("does not modify sky/background") &&
    docsText.includes("known Windows Watchpack noise");
  return audit(
    "docs-boundary-lock",
    "v94 browser CI documentation boundary",
    ready,
    ready ? "v94 browser CI docs present" : "v94 browser CI docs missing",
    "v94 browser CI docs present",
    "Documentation must present v94 as a browser and CI stability lock, not a science or visual model upgrade.",
  );
}

function surfaceContractLock(
  surfaceText: string,
  browserSpecText: string,
): AtlasBrowserCiStabilityLockAudit {
  const combined = `${surfaceText}\n${browserSpecText}`;
  const ready =
    combined.includes("data-atlas-browser-ci-stability-lock-version") &&
    combined.includes("data-atlas-browser-ci-stability-lock-strip") &&
    combined.includes("data-atlas-browser-ci-stability-lock-table") &&
    combined.includes("browser-ci-stability-lock") &&
    combined.includes("v94-browser-ci-stability-lock");
  return audit(
    "surface-contract-lock",
    "root DOM, Observable, Evidence and Validation browser CI surface",
    ready,
    ready ? "v94 browser CI surface present" : "v94 browser CI surface missing",
    "v94 browser CI surface present",
    "Rendered surfaces and browser acceptance must expose v94 stability markers.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasBrowserCiStabilityLockAudit {
  const required = [
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "materialMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "defaultGateConfigMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "protected browser CI stability mutation flags",
    ready,
    ready ? "all protected browser CI mutation flags not-applied" : "protected browser CI mutation flag missing",
    "all protected browser CI mutation flags not-applied",
    "The v94 contract must keep runtime, asset, fixture, budget, default gate and certification mutation flags not-applied.",
  );
}

function browserCiStabilityRow(
  audits: readonly AtlasBrowserCiStabilityLockAudit[],
): AtlasBrowserCiStabilityLockRow {
  const statusFor = (ids: readonly AtlasBrowserCiStabilityLockAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V94_BROWSER_CI_STABILITY_LOCK_ROW,
    status: ready ? "complete" : "blocked",
    releaseEvidenceStatus: statusFor(["v93-release-evidence-lock"]),
    screenshotRetryStatus: statusFor(["screenshot-retry-lock"]),
    pixelSettleStatus: statusFor(["pixel-settle-lock"]),
    freshServerStatus: statusFor(["fresh-server-lock"]),
    commandOwnershipStatus: statusFor(["command-ownership-lock"]),
    docsBoundaryStatus: statusFor(["docs-boundary-lock"]),
    surfaceContractStatus: statusFor(["surface-contract-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    browserCiStabilityLock: "applied-contract-only",
  };
}

function audit(
  id: AtlasBrowserCiStabilityLockAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasBrowserCiStabilityLockAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v94BrowserCiStabilityCommandContract(): Readonly<{
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  freshBrowserPort: 3015;
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  watchpackWarningPolicy: "known-windows-noise-non-failing";
}> {
  return {
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
    productFullCommand: "npm run verify:atlas:full",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    freshBrowserPort: 3015,
    screenshotRetryAttempts: 3,
    pixelSettleAttempts: 4,
    watchpackWarningPolicy: "known-windows-noise-non-failing",
  };
}
