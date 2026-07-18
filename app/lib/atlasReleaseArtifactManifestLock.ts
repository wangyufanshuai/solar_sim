import {
  V90_HORIZONS_PROVENANCE_FREEZE_ROW,
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
} from "./atlasHorizonsProvenanceFreeze";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import type {
  AtlasReleaseArtifactManifestLockAudit,
  AtlasReleaseArtifactManifestLockClassification,
  AtlasReleaseArtifactManifestLockRow,
  AtlasReleaseArtifactManifestLockSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION =
  "v95-release-artifact-manifest-lock" as const;

export const ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_PROFILE =
  "v95-offline-release-artifact-manifest" as const;

export const V95_RELEASE_ARTIFACT_MANIFEST_LOCK_BOUNDARY =
  "Local v95 release artifact manifest lock over the v93 scientific release evidence and v94 browser CI stability evidence. It indexes command matrix, fixture hashes, browser artifact paths, documentation boundaries, rollback interpretation and protected mutation flags; it does not create release archives, mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, or claim NASA/JPL certification.";

export const V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW: AtlasReleaseArtifactManifestLockRow = {
  id: "v95-lock-release-artifact-manifest",
  label: "Lock offline release artifact manifest index",
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
  migratedFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
  migratedFixtureSizeBytes: V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedFixtureSizeBytes,
  migratedFixtureVariant: V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedFixtureVariant,
  migratedTargetProvenanceRows:
    V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedTargetProvenanceRows,
  legacyFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
  legacyFixtureSizeBytes: V90_HORIZONS_PROVENANCE_FREEZE_ROW.legacyFixtureSizeBytes,
  rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only",
  status: "not-run",
  releaseEvidenceStatus: "not-run",
  browserCiStabilityStatus: "not-run",
  commandMatrixStatus: "not-run",
  fixtureArtifactStatus: "not-run",
  browserArtifactStatus: "not-run",
  docsArtifactStatus: "not-run",
  rollbackBoundaryStatus: "not-run",
  protectedMutationStatus: "not-run",
  releaseArtifactManifestLock: "applied-contract-only",
} as const;

export function createAtlasReleaseArtifactManifestLockSummary(
  args: {
    audits?: readonly AtlasReleaseArtifactManifestLockAudit[];
    rows?: readonly AtlasReleaseArtifactManifestLockRow[];
  } = {},
): AtlasReleaseArtifactManifestLockSummary {
  const audits = args.audits ?? [];
  const manifestRows = [
    args.rows?.find((row) => row.id === V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW.id) ??
      V95_RELEASE_ARTIFACT_MANIFEST_LOCK_ROW,
  ];
  const completed = manifestRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.releaseEvidenceStatus === "pass" &&
        row.browserCiStabilityStatus === "pass" &&
        row.commandMatrixStatus === "pass" &&
        row.fixtureArtifactStatus === "pass" &&
        row.browserArtifactStatus === "pass" &&
        row.docsArtifactStatus === "pass" &&
        row.rollbackBoundaryStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.releaseEvidenceStatus !== "pass" ||
      row.browserCiStabilityStatus !== "pass" ||
      row.commandMatrixStatus !== "pass" ||
      row.fixtureArtifactStatus !== "pass" ||
      row.browserArtifactStatus !== "pass" ||
      row.docsArtifactStatus !== "pass" ||
      row.rollbackBoundaryStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-artifact-manifest-blocked"
        : ready
          ? "ready-artifact-manifest-locked"
          : "ready-release-bundle-indexed";

  return {
    version: ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_VERSION,
    artifactManifestProfile: ATLAS_RELEASE_ARTIFACT_MANIFEST_LOCK_PROFILE,
    status,
    classification: classifyReleaseArtifactManifestLock({
      status,
      audits,
      ready,
    }),
    manifestRowCount: manifestRows.length,
    completedManifestRowCount: completed.length,
    audits,
    manifestRows,
    readyManifestRowId: ready?.id ?? "",
    productFullCommand: "npm run verify:atlas:full",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
    browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    freshBrowserPort: 3015,
    v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png",
    v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png",
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyV75FixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
    legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
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
    scientificCertificationStatus:
      "release-artifact-manifest-lock-not-nasa-jpl-certified",
    trustedBoundary: V95_RELEASE_ARTIFACT_MANIFEST_LOCK_BOUNDARY,
  };
}

function classifyReleaseArtifactManifestLock(args: {
  status: AtlasReleaseArtifactManifestLockSummary["status"];
  audits: readonly AtlasReleaseArtifactManifestLockAudit[];
  ready: AtlasReleaseArtifactManifestLockRow | null;
}): AtlasReleaseArtifactManifestLockClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.audits.some(
      (audit) => audit.id === "command-matrix-artifact-lock" && audit.status !== "ready",
    )
  ) {
    return "command-matrix-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "fixture-artifact-lock" && audit.status !== "ready",
    )
  ) {
    return "fixture-artifact-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "browser-artifact-lock" && audit.status !== "ready",
    )
  ) {
    return "browser-artifact-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "docs-artifact-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-artifact-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "rollback-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "rollback-boundary-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready",
    )
  ) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "release-artifact-manifest-pass";
  return "mixed";
}
