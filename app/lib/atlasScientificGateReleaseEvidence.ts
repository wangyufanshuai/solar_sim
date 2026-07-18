import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
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
  AtlasScientificGateReleaseEvidenceAudit,
  AtlasScientificGateReleaseEvidenceClassification,
  AtlasScientificGateReleaseEvidenceRow,
  AtlasScientificGateReleaseEvidenceSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION =
  "v93-scientific-gate-release-evidence-lock" as const;

export const ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_PROFILE =
  "v93-offline-gate-release-evidence-bundle" as const;

export const V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_BOUNDARY =
  "Local v93 release evidence bundle lock for the migrated, frozen and maintained offline strict Horizons scientific gate. It locks release verification, scientific verification, runbook, provenance freeze, offline/runtime boundary, migrated strict gate and legacy v75 audit evidence; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification.";

export const V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW: AtlasScientificGateReleaseEvidenceRow = {
  id: "v93-lock-offline-scientific-gate-release-evidence",
  label: "Lock offline scientific gate release evidence bundle",
  productFullCommand: "npm run verify:atlas:full",
  scientificVerifyCommand: "npm run verify:atlas:scientific",
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
  migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  expectedInterpretation:
    "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only",
  migratedFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
  migratedFixtureSizeBytes: V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedFixtureSizeBytes,
  migratedFixtureVariant: V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedFixtureVariant,
  migratedTargetProvenanceRows:
    V90_HORIZONS_PROVENANCE_FREEZE_ROW.migratedTargetProvenanceRows,
  legacyFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
  legacyFixtureSizeBytes: V90_HORIZONS_PROVENANCE_FREEZE_ROW.legacyFixtureSizeBytes,
  status: "not-run",
  runbookStatus: "not-run",
  provenanceFreezeStatus: "not-run",
  offlineRuntimeBoundaryStatus: "not-run",
  commandMatrixStatus: "not-run",
  fixtureEvidenceStatus: "not-run",
  docsEvidenceStatus: "not-run",
  browserEvidenceStatus: "not-run",
  protectedMutationStatus: "not-run",
  scientificGateReleaseEvidence: "applied-contract-only",
} as const;

export function createAtlasScientificGateReleaseEvidenceSummary(
  args: {
    audits?: readonly AtlasScientificGateReleaseEvidenceAudit[];
    rows?: readonly AtlasScientificGateReleaseEvidenceRow[];
  } = {},
): AtlasScientificGateReleaseEvidenceSummary {
  const audits = args.audits ?? [];
  const releaseEvidenceRows = [
    args.rows?.find((row) => row.id === V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW.id) ??
      V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW,
  ];
  const completed = releaseEvidenceRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.runbookStatus === "pass" &&
        row.provenanceFreezeStatus === "pass" &&
        row.offlineRuntimeBoundaryStatus === "pass" &&
        row.commandMatrixStatus === "pass" &&
        row.fixtureEvidenceStatus === "pass" &&
        row.docsEvidenceStatus === "pass" &&
        row.browserEvidenceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.runbookStatus !== "pass" ||
      row.provenanceFreezeStatus !== "pass" ||
      row.offlineRuntimeBoundaryStatus !== "pass" ||
      row.commandMatrixStatus !== "pass" ||
      row.fixtureEvidenceStatus !== "pass" ||
      row.docsEvidenceStatus !== "pass" ||
      row.browserEvidenceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-release-evidence-blocked"
        : ready
          ? "ready-release-evidence-locked"
          : "ready-release-verification-matrix-locked";

  return {
    version: ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
    releaseEvidenceProfile: ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_PROFILE,
    status,
    classification: classifyScientificGateReleaseEvidence({
      status,
      audits,
      ready,
    }),
    releaseEvidenceRowCount: releaseEvidenceRows.length,
    completedReleaseEvidenceRowCount: completed.length,
    audits,
    releaseEvidenceRows,
    readyReleaseEvidenceRowId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio:
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyV75FixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
    legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
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
    trustedBoundary: V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_BOUNDARY,
  };
}

function classifyScientificGateReleaseEvidence(args: {
  status: AtlasScientificGateReleaseEvidenceSummary["status"];
  audits: readonly AtlasScientificGateReleaseEvidenceAudit[];
  ready: AtlasScientificGateReleaseEvidenceRow | null;
}): AtlasScientificGateReleaseEvidenceClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.audits.some((audit) => audit.id === "v92-runbook-lock" && audit.status !== "ready")
  ) {
    return "runbook-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "v90-provenance-freeze-lock" && audit.status !== "ready",
    )
  ) {
    return "provenance-freeze-regression";
  }
  if (
    args.audits.some(
      (audit) =>
        audit.id === "v91-offline-runtime-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "offline-runtime-boundary-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "command-evidence-matrix-lock" && audit.status !== "ready",
    )
  ) {
    return "command-ownership-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "browser-evidence-lock" && audit.status !== "ready",
    )
  ) {
    return "browser-evidence-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "docs-evidence-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-evidence-regression";
  }
  if (args.ready) return "release-evidence-pass";
  return "mixed";
}
