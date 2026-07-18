import {
  createAtlasBrowserResourcePerformanceSummary,
} from "./atlasBrowserResourcePerformanceLock";
import { runAtlasBrowserResourcePerformanceAudit } from "./atlasBrowserResourcePerformanceLockRunner";
import {
  ATLAS_MAINTENANCE_EVIDENCE_INDEX_BOUNDARY,
  V102_MAINTENANCE_EVIDENCE_INDEX_ROW,
} from "./atlasMaintenanceEvidenceIndex";
import type {
  AtlasMaintenanceEvidenceIndexAudit,
  AtlasMaintenanceEvidenceIndexRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

const V93_V101_FOCUSED_COMMANDS: Readonly<Record<string, string>> = {
  "test:atlas:scientific-gate-release-evidence":
    "vitest run app/lib/atlasScientificGateReleaseEvidence.horizons.test.ts",
  "test:atlas:browser-ci-stability":
    "vitest run app/lib/atlasBrowserCiStabilityLock.horizons.test.ts",
  "test:atlas:release-artifact-manifest":
    "vitest run app/lib/atlasReleaseArtifactManifestLock.horizons.test.ts",
  "test:atlas:final-maintenance-baseline":
    "vitest run app/lib/atlasFinalMaintenanceBaseline.horizons.test.ts",
  "test:atlas:gaia-starfield-enhancement":
    "vitest run app/lib/atlasGaiaStarfieldEnhancement.horizons.test.ts",
  "test:atlas:relativity-simulation-optimization":
    "vitest run app/lib/atlasRelativitySimulationOptimization.horizons.test.ts",
  "test:atlas:art-polish": "vitest run app/lib/atlasArtPolish.horizons.test.ts",
  "test:atlas:post-enhancement-baseline":
    "vitest run app/lib/atlasPostEnhancementMaintenanceBaseline.horizons.test.ts",
  "test:atlas:browser-resource-performance":
    "vitest run app/lib/atlasBrowserResourcePerformanceLock.horizons.test.ts",
  "test:atlas:maintenance-evidence-index":
    "vitest run app/lib/atlasMaintenanceEvidenceIndex.horizons.test.ts",
  "verify:atlas:post-enhancement":
    "npm run test:atlas:post-enhancement-baseline && npm run verify:atlas:scientific",
  "verify:atlas:browser-resource":
    "npm run test:atlas:browser-resource-performance && npm run test:atlas:browser:fresh",
  "verify:atlas:maintenance-evidence":
    "npm run test:atlas:maintenance-evidence-index && npm run verify:atlas:browser-resource",
  "verify:atlas:scientific":
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
};

const SCREENSHOT_ARTIFACT_DIRECTORIES = [
  "test-results/v93-scientific-gate-release-evidence-lock/",
  "test-results/v94-browser-ci-stability-lock/",
  "test-results/v95-release-artifact-manifest-lock/",
  "test-results/v97-gaia-starfield-enhancement/",
  "test-results/v98-relativity-simulation-optimization/",
  "test-results/v99-art-polish/",
  "test-results/v100-post-enhancement-maintenance-baseline/",
  "test-results/v101-browser-resource-performance-lock/",
  "test-results/v102-maintenance-evidence-index/",
] as const;

export async function runAtlasMaintenanceEvidenceIndexAudit(args: {
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
  freshTeardownText?: string;
  gaiaBrightRowCount?: number;
  gaiaKinematicsRowCount?: number;
  constellationRenderGroupCount?: number;
  normalizedIauConstellationCount?: number;
  nebulaMarkerCount?: number;
}): Promise<{
  audits: readonly AtlasMaintenanceEvidenceIndexAudit[];
  rows: readonly AtlasMaintenanceEvidenceIndexRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const freshConfigText = args.freshConfigText ?? "";
  const freshTeardownText = args.freshTeardownText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;

  const v101Audit = await runAtlasBrowserResourcePerformanceAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText,
    freshTeardownText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
  });
  const v101Summary = createAtlasBrowserResourcePerformanceSummary(v101Audit);

  const audits = [
    priorV101Lock(v101Summary.status, v101Summary.classification),
    commandIndexLock(args.packageScripts ?? {}),
    screenshotArtifactIndexLock(`${docsText}\n${browserSpecText}`),
    dirtyWorktreePolicyLock(`${docsText}\n${combinedSurface}`),
    watchpackNoisePolicyLock(`${docsText}\n${combinedSurface}`),
    browserQaIndexLock(`${docsText}\n${combinedSurface}`),
    docsSurfaceLock(docsText, combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasMaintenanceEvidenceIndexAudit[];

  return {
    audits,
    rows: [maintenanceEvidenceIndexRow(audits)],
  };
}

function priorV101Lock(
  status: string,
  classification: string,
): AtlasMaintenanceEvidenceIndexAudit {
  const ready =
    status === "ready-browser-resource-performance-locked" &&
    classification === "browser-resource-performance-pass";
  return audit(
    "v101-browser-resource-performance-lock",
    "v101 browser resource performance lock",
    ready,
    `${status}; ${classification}`,
    "ready-browser-resource-performance-locked; browser-resource-performance-pass",
    "v102 reuses v101 heavy audit output instead of copying its internal judgment logic.",
  );
}

function commandIndexLock(
  scripts: Readonly<Record<string, string>>,
): AtlasMaintenanceEvidenceIndexAudit {
  const missing = Object.entries(V93_V101_FOCUSED_COMMANDS)
    .filter(([script, command]) => scripts[script] !== command)
    .map(([script]) => script);
  return audit(
    "command-index-lock",
    "v93-v101 focused and verify command index",
    missing.length === 0,
    missing.length === 0
      ? "v93-v101 focused commands indexed; maintenance verify indexed"
      : `missing or changed scripts: ${missing.join(", ")}`,
    "v93-v101 focused commands indexed; maintenance verify indexed",
    "v102 indexes command evidence only and does not run or mutate scientific gates.",
  );
}

function screenshotArtifactIndexLock(text: string): AtlasMaintenanceEvidenceIndexAudit {
  const missing = SCREENSHOT_ARTIFACT_DIRECTORIES.filter((directory) => !text.includes(directory));
  return audit(
    "screenshot-artifact-index-lock",
    "Browser screenshot artifact directory index",
    missing.length === 0,
    missing.length === 0
      ? "v93-v95-v97-v102 screenshot directories indexed"
      : `missing screenshot directories: ${missing.join(", ")}`,
    "v93-v95-v97-v102 screenshot directories indexed",
    "v102 records screenshot artifact path contracts without starting a browser or creating images.",
  );
}

function dirtyWorktreePolicyLock(text: string): AtlasMaintenanceEvidenceIndexAudit {
  const required = [
    "dirty worktree",
    "no-reset-no-revert-no-clean-no-stage-no-commit",
    "scoped implementation files",
  ];
  const ready = required.every((token) => text.includes(token));
  return audit(
    "dirty-worktree-policy-lock",
    "Dirty worktree repo hygiene policy",
    ready,
    ready ? "dirty worktree policy locked" : "dirty worktree policy token missing",
    "dirty worktree policy locked",
    "v102 records repo hygiene policy and does not reset, revert, clean, stage or commit.",
  );
}

function watchpackNoisePolicyLock(text: string): AtlasMaintenanceEvidenceIndexAudit {
  const required = [
    "DumpStack.log.tmp",
    "pagefile.sys",
    "known non-failure noise",
    "not app console error",
    "not Playwright failure",
  ];
  const ready = required.every((token) => text.includes(token));
  return audit(
    "watchpack-noise-policy-lock",
    "Windows Watchpack known non-failure noise policy",
    ready,
    ready
      ? "DumpStack/pagefile known non-failure noise locked"
      : "Watchpack known non-failure noise token missing",
    "DumpStack/pagefile known non-failure noise locked",
    "v102 records Watchpack noise classification without changing Next or webpack configuration.",
  );
}

function browserQaIndexLock(text: string): AtlasMaintenanceEvidenceIndexAudit {
  const required = [
    "root-observable-evidence-validation-console-errors-zero-teardown-clear",
    "data-atlas-maintenance-evidence-index-version",
    "data-atlas-maintenance-evidence-index-strip",
    "data-evidence-claim-id=\"maintenance-evidence-index\"",
    "data-atlas-validation-domain-id=\"maintenance-evidence-index\"",
    "console errors",
    "3015/3016",
  ];
  const ready = required.every((token) => text.includes(token));
  return audit(
    "browser-qa-index-lock",
    "Browser QA marker, console and teardown index",
    ready,
    ready
      ? "Browser QA root/Observable/Evidence/Validation/console/teardown indexed"
      : "Browser QA index token missing",
    "Browser QA root/Observable/Evidence/Validation/console/teardown indexed",
    "v102 indexes Browser QA result policy without changing acceptance thresholds.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
): AtlasMaintenanceEvidenceIndexAudit {
  const ready =
    docsText.includes("v102 Maintenance Evidence Index") &&
    docsText.includes("Maintenance Evidence Index / Repo Hygiene") &&
    surfaceText.includes("data-atlas-maintenance-evidence-index-version") &&
    surfaceText.includes("data-atlas-maintenance-evidence-index-strip") &&
    surfaceText.includes("data-atlas-maintenance-evidence-index-table") &&
    surfaceText.includes("maintenance-evidence-index") &&
    surfaceText.includes("v102-maintenance-evidence-index");
  return audit(
    "docs-surface-lock",
    "v102 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v102 docs and surface markers present" : "v102 docs or surface marker missing",
    "v102 docs and surface markers present",
    "v102 surfaces must present a maintenance evidence index, not a scientific, fixture, visual, performance or release packaging upgrade.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasMaintenanceEvidenceIndexAudit {
  const required = [
    "runtimePerformanceMutation: \"not-applied\"",
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "v9SkyDirectionMutation: \"not-applied\"",
    "materialMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "defaultGateConfigMutation: \"not-applied\"",
    "releasePackagingMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
    "maintenanceEvidenceIndex: \"applied-maintenance-index-only\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and maintenance-index-only scope",
    ready,
    ready
      ? "protected mutation flags not-applied; maintenance index only applied"
      : "protected mutation flag or maintenance index marker missing",
    "protected mutation flags not-applied; maintenance index only applied",
    ATLAS_MAINTENANCE_EVIDENCE_INDEX_BOUNDARY,
  );
}

function maintenanceEvidenceIndexRow(
  audits: readonly AtlasMaintenanceEvidenceIndexAudit[],
): AtlasMaintenanceEvidenceIndexRow {
  const statusFor = (ids: readonly AtlasMaintenanceEvidenceIndexAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V102_MAINTENANCE_EVIDENCE_INDEX_ROW,
    status: ready ? "complete" : "blocked",
    v101Status: statusFor(["v101-browser-resource-performance-lock"]),
    commandIndexStatus: statusFor(["command-index-lock"]),
    screenshotArtifactStatus: statusFor(["screenshot-artifact-index-lock"]),
    dirtyWorktreePolicyStatus: statusFor(["dirty-worktree-policy-lock"]),
    watchpackNoisePolicyStatus: statusFor(["watchpack-noise-policy-lock"]),
    browserQaIndexStatus: statusFor(["browser-qa-index-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    maintenanceEvidenceIndex: "applied-maintenance-index-only",
  };
}

function audit(
  id: AtlasMaintenanceEvidenceIndexAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasMaintenanceEvidenceIndexAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v102MaintenanceEvidenceIndexCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:maintenance-evidence-index";
  maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotArtifactDirectoryCount: 9;
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
  watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise";
  evidenceIndexPolicy: "maintenance-evidence-index-only";
}> {
  return {
    focusedCommand: "npm run test:atlas:maintenance-evidence-index",
    maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
    browserResourceVerifyCommand: "npm run verify:atlas:browser-resource",
    postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    screenshotArtifactDirectoryCount: SCREENSHOT_ARTIFACT_DIRECTORIES.length as 9,
    dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
    watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise",
    evidenceIndexPolicy: "maintenance-evidence-index-only",
  };
}
