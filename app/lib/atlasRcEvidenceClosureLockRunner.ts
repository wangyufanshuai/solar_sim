import {
  createAtlasFinalGaiaArtEnhancementSummary,
} from "./atlasFinalGaiaArtEnhancementLock";
import { runAtlasFinalGaiaArtEnhancementAudit } from "./atlasFinalGaiaArtEnhancementLockRunner";
import {
  ATLAS_RC_EVIDENCE_CLOSURE_BOUNDARY,
  ATLAS_RC_EVIDENCE_CLOSURE_SCREENSHOT_DIRECTORIES,
  V106_RC_EVIDENCE_CLOSURE_ROW,
} from "./atlasRcEvidenceClosureLock";
import type {
  AtlasRcEvidenceClosureAudit,
  AtlasRcEvidenceClosureRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export type AtlasRcEvidenceClosureAuditArgs = {
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
  gaiaStarCatalogText?: string;
  gaiaStarFieldText?: string;
  constellationLinesText?: string;
  nebulaMarkersText?: string;
  bodyLabelText?: string;
  celestialCatalogLabelsText?: string;
};

export async function runAtlasRcEvidenceClosureAudit(args: AtlasRcEvidenceClosureAuditArgs): Promise<{
  audits: readonly AtlasRcEvidenceClosureAudit[];
  rows: readonly AtlasRcEvidenceClosureRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const v105Audit = await runAtlasFinalGaiaArtEnhancementAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText: args.freshConfigText,
    freshTeardownText: args.freshTeardownText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
    gaiaStarCatalogText: args.gaiaStarCatalogText,
    gaiaStarFieldText: args.gaiaStarFieldText,
    constellationLinesText: args.constellationLinesText,
    nebulaMarkersText: args.nebulaMarkersText,
    bodyLabelText: args.bodyLabelText,
    celestialCatalogLabelsText: args.celestialCatalogLabelsText,
  });
  const v105Summary = createAtlasFinalGaiaArtEnhancementSummary(v105Audit);

  const audits = [
    priorV105Lock(v105Summary.status, v105Summary.classification),
    commandMatrixLock(args.packageScripts ?? {}),
    browserQaLock(browserSpecText, combinedSurface),
    artifactIndexLock(`${docsText}\n${combinedSurface}`, browserSpecText),
    dirtyWorktreePolicyLock(`${docsText}\n${combinedSurface}`),
    watchpackNoisePolicyLock(`${docsText}\n${combinedSurface}`),
    docsSurfaceLock(docsText, combinedSurface, args.packageScripts ?? {}),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasRcEvidenceClosureAudit[];

  return {
    audits,
    rows: [rcEvidenceClosureRow(audits)],
  };
}

function priorV105Lock(
  status: string,
  classification: string,
): AtlasRcEvidenceClosureAudit {
  const ready =
    status === "ready-final-gaia-art-locked" &&
    classification === "final-gaia-art-pass";
  return audit(
    "v105-final-gaia-art-enhancement",
    "v105 final Gaia art enhancement",
    ready,
    `${status}; ${classification}`,
    "ready-final-gaia-art-locked; final-gaia-art-pass",
    "v106 reuses v105 heavy audit output instead of copying its internal judgment logic.",
  );
}

function commandMatrixLock(
  scripts: Readonly<Record<string, string>>,
): AtlasRcEvidenceClosureAudit {
  const requiredCommands = [
    "test:atlas:scientific-gate-release-evidence",
    "test:atlas:browser-ci-stability",
    "test:atlas:release-artifact-manifest",
    "test:atlas:final-maintenance-baseline",
    "test:atlas:gaia-starfield-enhancement",
    "test:atlas:relativity-simulation-optimization",
    "test:atlas:art-polish",
    "test:atlas:post-enhancement-baseline",
    "test:atlas:browser-resource-performance",
    "test:atlas:maintenance-evidence-index",
    "test:atlas:presentation-runtime-performance",
    "test:atlas:browser-acceptance-runtime-cost",
    "test:atlas:final-gaia-art-enhancement",
    "test:atlas:rc-evidence-closure",
    "verify:atlas:final-gaia-art",
    "verify:atlas:browser-acceptance-runtime",
    "verify:atlas:scientific",
    "verify:atlas:rc-evidence",
  ] as const;
  const ready =
    requiredCommands.every((command) => typeof scripts[command] === "string" && scripts[command].length > 0) &&
    scripts["verify:atlas:rc-evidence"] ===
      "npm run test:atlas:rc-evidence-closure && npm run verify:atlas:final-gaia-art";
  return audit(
    "command-matrix-lock",
    "v93-v106 command matrix",
    ready,
    ready ? "v93-v106 focused and verify commands indexed" : "v93-v106 command matrix marker missing",
    "v93-v106 focused and verify commands indexed",
    "v106 locks command evidence only; it does not run commands inside the runtime app.",
  );
}

function browserQaLock(
  browserSpecText: string,
  surfaceText: string,
): AtlasRcEvidenceClosureAudit {
  const required = [
    "data-atlas-rc-evidence-closure-version",
    "data-atlas-rc-evidence-closure-profile",
    "data-atlas-rc-evidence-closure-status",
    "data-atlas-rc-evidence-closure-strip",
    "data-atlas-rc-evidence-closure-table",
    "data-evidence-claim-id=\"release-candidate-evidence-closure-lock\"",
    "data-atlas-validation-domain-id=\"release-candidate-evidence-closure-lock\"",
    "test-results/v106-release-candidate-evidence-closure-lock/",
  ];
  const ready = required.every((token) => surfaceText.includes(token) || browserSpecText.includes(token));
  return audit(
    "browser-qa-lock",
    "Root, Observable, Evidence, Validation and screenshot marker coverage",
    ready,
    ready ? "v106 browser QA markers present" : "v106 browser QA marker missing",
    "v106 browser QA markers present",
    "v106 must preserve Browser QA marker coverage, console/page-error checks and fresh teardown.",
  );
}

function artifactIndexLock(
  text: string,
  browserSpecText: string,
): AtlasRcEvidenceClosureAudit {
  const ready =
    ATLAS_RC_EVIDENCE_CLOSURE_SCREENSHOT_DIRECTORIES.every((dir) => text.includes(dir) || browserSpecText.includes(dir)) &&
    browserSpecText.includes("v106-release-candidate-evidence-closure-lock");
  return audit(
    "artifact-index-lock",
    "v93-v105 browser screenshot artifact directory index",
    ready,
    ready ? "v93-v105 screenshot artifact directories indexed with v106 screenshot path" : "screenshot artifact directory index missing",
    "v93-v105 screenshot artifact directories indexed with v106 screenshot path",
    "v106 indexes artifact path contracts only; it does not create a release archive.",
  );
}

function dirtyWorktreePolicyLock(text: string): AtlasRcEvidenceClosureAudit {
  const required = ["no-reset", "no-revert", "no-clean", "no-stage", "no-commit"];
  const ready = required.every((token) => text.includes(token));
  return audit(
    "dirty-worktree-policy-lock",
    "Dirty worktree repo hygiene policy",
    ready,
    ready ? "dirty worktree policy preserves no reset/revert/clean/stage/commit" : "dirty worktree policy marker missing",
    "dirty worktree policy preserves no reset/revert/clean/stage/commit",
    "v106 records repo hygiene policy only and does not stage or commit files.",
  );
}

function watchpackNoisePolicyLock(text: string): AtlasRcEvidenceClosureAudit {
  const ready =
    text.includes("DumpStack.log.tmp") &&
    text.includes("pagefile.sys") &&
    text.includes("known non-failure") &&
    (text.includes("not app console error") || text.includes("not Playwright failure"));
  return audit(
    "watchpack-noise-policy-lock",
    "Windows Watchpack known non-failure noise policy",
    ready,
    ready ? "DumpStack.log.tmp and pagefile.sys known non-failure noise policy preserved" : "Watchpack noise policy marker missing",
    "DumpStack.log.tmp and pagefile.sys known non-failure noise policy preserved",
    "v106 classifies Windows dev-server scan noise without changing Next or webpack configuration.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasRcEvidenceClosureAudit {
  const ready =
    scripts["test:atlas:rc-evidence-closure"] ===
      "vitest run app/lib/atlasRcEvidenceClosureLock.horizons.test.ts" &&
    docsText.includes("v106 Release Candidate Evidence Closure Lock") &&
    docsText.includes("RC evidence closure") &&
    docsText.includes("not a release archive") &&
    surfaceText.includes("data-atlas-rc-evidence-closure-version") &&
    surfaceText.includes("data-atlas-rc-evidence-closure-strip") &&
    surfaceText.includes("data-atlas-rc-evidence-closure-table") &&
    surfaceText.includes("release-candidate-evidence-closure-lock") &&
    surfaceText.includes("v106-release-candidate-evidence-closure-lock");
  return audit(
    "docs-surface-lock",
    "v106 docs, root DOM, Observable, Evidence and Validation surface",
    ready,
    ready ? "v106 docs and surface markers present" : "v106 docs or surface marker missing",
    "v106 docs and surface markers present",
    ATLAS_RC_EVIDENCE_CLOSURE_BOUNDARY,
  );
}

function protectedMutationLock(surfaceText: string): AtlasRcEvidenceClosureAudit {
  const required = [
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
    "releaseArchiveMutation: \"not-applied\"",
    "releasePackagingMutation: \"not-applied\"",
    "stagingMutation: \"not-applied\"",
    "commitMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
    "rcEvidenceClosure: \"applied-rc-evidence-closure-only\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and evidence-closure-only scope",
    ready,
    ready
      ? "protected mutation flags not-applied; RC evidence closure only applied"
      : "protected mutation flag or v106 scope marker missing",
    "protected mutation flags not-applied; RC evidence closure only applied",
    ATLAS_RC_EVIDENCE_CLOSURE_BOUNDARY,
  );
}

function rcEvidenceClosureRow(
  audits: readonly AtlasRcEvidenceClosureAudit[],
): AtlasRcEvidenceClosureRow {
  const statusFor = (ids: readonly AtlasRcEvidenceClosureAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V106_RC_EVIDENCE_CLOSURE_ROW,
    status: ready ? "complete" : "blocked",
    v105Status: statusFor(["v105-final-gaia-art-enhancement"]),
    commandMatrixStatus: statusFor(["command-matrix-lock"]),
    browserQaStatus: statusFor(["browser-qa-lock"]),
    artifactIndexStatus: statusFor(["artifact-index-lock"]),
    dirtyWorktreePolicyStatus: statusFor(["dirty-worktree-policy-lock"]),
    watchpackNoisePolicyStatus: statusFor(["watchpack-noise-policy-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    rcEvidenceClosure: "applied-rc-evidence-closure-only",
  };
}

function audit(
  id: AtlasRcEvidenceClosureAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasRcEvidenceClosureAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v106RcEvidenceClosureCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:rc-evidence-closure";
  rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence";
  finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/";
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
}> {
  return {
    focusedCommand: "npm run test:atlas:rc-evidence-closure",
    rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence",
    finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/",
    dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
  };
}
