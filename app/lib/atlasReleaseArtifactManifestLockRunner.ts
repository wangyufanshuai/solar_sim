import { createAtlasBrowserCiStabilityLockSummary } from "./atlasBrowserCiStabilityLock";
import {
  runAtlasBrowserCiStabilityLockAudit,
} from "./atlasBrowserCiStabilityLockRunner";
import {
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
} from "./atlasHorizonsProvenanceFreeze";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import {
  V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW,
} from "./atlasReleaseArtifactManifestLock";
import type {
  AtlasReleaseArtifactManifestLockAudit,
  AtlasReleaseArtifactManifestLockRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasReleaseArtifactManifestLockAudit(args: {
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
  audits: readonly AtlasReleaseArtifactManifestLockAudit[];
  rows: readonly AtlasReleaseArtifactManifestLockRow[];
}> {
  const browserCiAudit = await runAtlasBrowserCiStabilityLockAudit({
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
    browserSpecText: args.browserSpecText,
    freshConfigText: args.freshConfigText,
  });
  const browserCiSummary = createAtlasBrowserCiStabilityLockSummary({
    audits: browserCiAudit.audits,
    rows: browserCiAudit.rows,
  });
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const freshConfigText = args.freshConfigText ?? "";
  const audits = [
    releaseEvidenceLock(browserCiSummary.audits),
    browserCiStabilityLock(browserCiSummary.status, browserCiSummary.classification),
    commandMatrixArtifactLock(args.packageScripts),
    fixtureArtifactLock(
      args.migratedFixtureAudit,
      args.legacyFixtureAudit,
      args.v84OuterSystemDataset,
    ),
    browserArtifactLock(browserSpecText, freshConfigText, docsText),
    docsArtifactLock(docsText),
    rollbackBoundaryLock(docsText, surfaceText),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasReleaseArtifactManifestLockAudit[];

  return {
    audits,
    rows: [releaseArtifactManifestRow(audits)],
  };
}

function releaseEvidenceLock(
  audits: readonly { id: string; status: string; measured: string }[],
): AtlasReleaseArtifactManifestLockAudit {
  const v93 = audits.find((auditItem) => auditItem.id === "v93-release-evidence-lock");
  const ready = v93?.status === "ready";
  return audit(
    "v93-release-evidence-lock",
    "v93 release evidence remains indexed",
    ready,
    v93?.measured ?? "missing",
    "ready-release-evidence-locked; release-evidence-pass",
    "The release artifact manifest can pass only while v93 release evidence remains ready.",
  );
}

function browserCiStabilityLock(
  status: string,
  classification: string,
): AtlasReleaseArtifactManifestLockAudit {
  const ready = status === "ready-browser-ci-locked" && classification === "browser-ci-stability-pass";
  return audit(
    "v94-browser-ci-stability-lock",
    "v94 browser CI stability remains indexed",
    ready,
    `${status}; ${classification}`,
    "ready-browser-ci-locked; browser-ci-stability-pass",
    "The release artifact manifest can pass only while v94 browser CI stability remains ready.",
  );
}

function commandMatrixArtifactLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasReleaseArtifactManifestLockAudit {
  const measured = [
    packageScripts?.["verify:atlas:full"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-release-evidence"] ?? "missing",
    packageScripts?.["test:atlas:browser-ci-stability"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-runbook"] ?? "missing",
    packageScripts?.["test:atlas:horizons-provenance-freeze"] ?? "missing",
    packageScripts?.["test:atlas:offline-runtime-boundary"] ?? "missing",
    packageScripts?.["test:atlas:browser:fresh"] ?? "missing",
    packageScripts?.["test:atlas:release-artifact-manifest"] ?? "missing",
  ].join(" | ");
  const expected = [
    "npm run verify:atlas && npm run test:atlas:browser:fresh",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
    "vitest run app/lib/atlasScientificGateReleaseEvidence.horizons.test.ts",
    "vitest run app/lib/atlasBrowserCiStabilityLock.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateMaintenanceRunbook.horizons.test.ts",
    "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    "vitest run app/lib/atlasOfflineRuntimeBoundaryAudit.horizons.test.ts",
    "playwright test -c playwright.atlas.fresh.config.ts",
    "vitest run app/lib/atlasReleaseArtifactManifestLock.horizons.test.ts",
  ].join(" | ");
  return audit(
    "command-matrix-artifact-lock",
    "release artifact command matrix",
    measured === expected,
    measured,
    expected,
    "The artifact manifest must index release, scientific, v93, v94, strict gate, legacy v75, runbook, freeze, boundary and fresh browser commands without merging their ownership.",
  );
}

function fixtureArtifactLock(
  migratedFixtureAudit: FixtureEvidenceAudit | undefined,
  legacyFixtureAudit: FixtureEvidenceAudit | undefined,
  v84OuterSystemDataset: HorizonsValidationDataset | null | undefined,
): AtlasReleaseArtifactManifestLockAudit {
  const ready =
    migratedFixtureAudit?.path === V87_CANDIDATE_FIXTURE_PATH &&
    migratedFixtureAudit.sha256 === V90_MIGRATED_FIXTURE_SHA256 &&
    migratedFixtureAudit.sizeBytes === 21863 &&
    legacyFixtureAudit?.path === V87_CURRENT_STRICT_FIXTURE_PATH &&
    legacyFixtureAudit.sha256 === V90_LEGACY_V75_FIXTURE_SHA256 &&
    legacyFixtureAudit.sizeBytes === 14678 &&
    v84OuterSystemDataset?.variant === "v84-outer-system-barycenter-reference" &&
    (v84OuterSystemDataset.targetProvenance?.length ?? 0) === 12;
  return audit(
    "fixture-artifact-lock",
    "release fixture artifact hashes and provenance",
    ready,
    [
      `${migratedFixtureAudit?.path ?? "missing"}; ${migratedFixtureAudit?.sha256 ?? "missing"}; ${migratedFixtureAudit?.sizeBytes ?? 0}`,
      `${legacyFixtureAudit?.path ?? "missing"}; ${legacyFixtureAudit?.sha256 ?? "missing"}; ${legacyFixtureAudit?.sizeBytes ?? 0}`,
      `variant ${v84OuterSystemDataset?.variant ?? "missing"}; provenance ${v84OuterSystemDataset?.targetProvenance?.length ?? 0}`,
    ].join(" | "),
    [
      `${V87_CANDIDATE_FIXTURE_PATH}; ${V90_MIGRATED_FIXTURE_SHA256}; 21863`,
      `${V87_CURRENT_STRICT_FIXTURE_PATH}; ${V90_LEGACY_V75_FIXTURE_SHA256}; 14678`,
      "variant v84-outer-system-barycenter-reference; provenance 12",
    ].join(" | "),
    "The artifact manifest must index exact v84 migrated and legacy v75 fixture evidence without regenerating fixtures.",
  );
}

function browserArtifactLock(
  browserSpecText: string,
  freshConfigText: string,
  docsText: string,
): AtlasReleaseArtifactManifestLockAudit {
  const ready =
    browserSpecText.includes("v93-scientific-gate-release-evidence-lock") &&
    browserSpecText.includes("v94-browser-ci-stability-lock") &&
    browserSpecText.includes("v95-release-artifact-manifest-lock") &&
    freshConfigText.includes('const baseUrl = "http://127.0.0.1:3015"') &&
    freshConfigText.includes("atlas-browser-fresh-teardown.ts") &&
    docsText.includes("test-results/v93-scientific-gate-release-evidence-lock/") &&
    docsText.includes("test-results/v94-browser-ci-stability-lock/") &&
    docsText.includes("test-results/v95-release-artifact-manifest-lock/");
  return audit(
    "browser-artifact-lock",
    "release browser artifact paths and fresh teardown policy",
    ready,
    ready ? "v93/v94/v95 screenshot globs and fresh 3015 teardown policy indexed" : "browser artifact policy missing",
    "v93/v94/v95 screenshot globs and fresh 3015 teardown policy indexed",
    "Browser artifacts are path contracts and fresh teardown policy only; v95 does not alter thresholds or launch browsers in the runtime app.",
  );
}

function docsArtifactLock(docsText: string): AtlasReleaseArtifactManifestLockAudit {
  const ready =
    docsText.includes("v93 Scientific Gate release evidence") &&
    docsText.includes("v94 Browser/CI Stability Lock") &&
    docsText.includes("v95 Release Artifact Manifest Lock") &&
    docsText.includes("release artifact manifest lock") &&
    docsText.includes("not a release archive") &&
    docsText.includes("not a scientific model");
  return audit(
    "docs-artifact-lock",
    "v95 release artifact manifest documentation",
    ready,
    ready ? "v93/v94/v95 release artifact docs present" : "v95 artifact docs missing",
    "v93/v94/v95 release artifact docs present",
    "Documentation must present v95 as an artifact manifest lock, not a new package, science model or certification upgrade.",
  );
}

function rollbackBoundaryLock(
  docsText: string,
  surfaceText: string,
): AtlasReleaseArtifactManifestLockAudit {
  const combined = `${docsText}\n${surfaceText}`;
  const ready =
    combined.includes("legacy v75 command remains rollback/blocker evidence only") &&
    combined.includes("legacy-v75-rollback-blocker-evidence-only") &&
    !combined.includes("legacy v75 becomes default");
  return audit(
    "rollback-boundary-lock",
    "legacy v75 rollback evidence boundary",
    ready,
    ready ? "legacy v75 rollback/blocker boundary preserved" : "rollback boundary missing",
    "legacy v75 rollback/blocker boundary preserved",
    "The v95 manifest indexes legacy v75 as rollback/blocker evidence only and must not restore it as the default strict gate.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasReleaseArtifactManifestLockAudit {
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
    "releasePackagingMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "protected release artifact mutation flags",
    ready,
    ready ? "all protected release artifact mutation flags not-applied" : "protected release artifact mutation flag missing",
    "all protected release artifact mutation flags not-applied",
    "The v95 contract must keep runtime, asset, fixture, budget, default gate, release package and certification mutation flags not-applied.",
  );
}

function releaseArtifactManifestRow(
  audits: readonly AtlasReleaseArtifactManifestLockAudit[],
): AtlasReleaseArtifactManifestLockRow {
  const statusFor = (ids: readonly AtlasReleaseArtifactManifestLockAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW,
    status: ready ? "complete" : "blocked",
    releaseEvidenceStatus: statusFor(["v93-release-evidence-lock"]),
    browserCiStabilityStatus: statusFor(["v94-browser-ci-stability-lock"]),
    commandMatrixStatus: statusFor(["command-matrix-artifact-lock"]),
    fixtureArtifactStatus: statusFor(["fixture-artifact-lock"]),
    browserArtifactStatus: statusFor(["browser-artifact-lock"]),
    docsArtifactStatus: statusFor(["docs-artifact-lock"]),
    rollbackBoundaryStatus: statusFor(["rollback-boundary-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    releaseArtifactManifestLock: "applied-contract-only",
  };
}

function audit(
  id: AtlasReleaseArtifactManifestLockAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasReleaseArtifactManifestLockAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v95ReleaseArtifactManifestCommandContract(): Readonly<{
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  migratedStrictGateCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75AuditCommand: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  freshBrowserPort: 3015;
  v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png";
  v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png";
  rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only";
}> {
  return {
    productFullCommand: "npm run verify:atlas:full",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
    browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
    migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
    provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
    offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    freshBrowserPort: 3015,
    v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png",
    v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png",
    rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only",
  };
}
