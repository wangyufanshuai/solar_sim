import { V87_STRICT_SCIENTIFIC_GATE_COMMAND } from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import type {
  AtlasFinalMaintenanceBaselineAudit,
  AtlasFinalMaintenanceBaselineClassification,
  AtlasFinalMaintenanceBaselineRow,
  AtlasFinalMaintenanceBaselineSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION =
  "v96-final-maintenance-baseline" as const;

export const ATLAS_FINAL_MAINTENANCE_BASELINE_PROFILE =
  "v96-final-offline-maintenance-baseline" as const;

export const V96_FINAL_MAINTENANCE_BASELINE_BOUNDARY =
  "Local v96 final maintenance baseline lock for the offline Orbit Atlas verification and scientific gate evidence chain. It locks verify:atlas:full, verify:atlas:scientific, v90-v95 maintenance evidence, legacy v75 rollback evidence and the post-v96 rule that scientific mainline changes require an intentional fixture/model upgrade or true live physics migration; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, default scientific gate configuration, release packaging, or claim NASA/JPL certification.";

export const V96_FINAL_MAINTENANCE_BASELINE_ROW: AtlasFinalMaintenanceBaselineRow = {
  id: "v96-lock-final-maintenance-baseline",
  label: "Lock final offline maintenance baseline",
  productFullCommand: "npm run verify:atlas:full",
  scientificVerifyCommand: "npm run verify:atlas:scientific",
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest",
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
  migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  browserFreshCommand: "npm run test:atlas:browser:fresh",
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade",
  status: "not-run",
  artifactManifestStatus: "not-run",
  productFullEntrypointStatus: "not-run",
  scientificVerifyEntrypointStatus: "not-run",
  scientificGateChainStatus: "not-run",
  postBaselinePolicyStatus: "not-run",
  docsBaselineStatus: "not-run",
  browserSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  finalMaintenanceBaseline: "applied-contract-only",
} as const;

export function createAtlasFinalMaintenanceBaselineSummary(
  args: {
    audits?: readonly AtlasFinalMaintenanceBaselineAudit[];
    rows?: readonly AtlasFinalMaintenanceBaselineRow[];
  } = {},
): AtlasFinalMaintenanceBaselineSummary {
  const audits = args.audits ?? [];
  const baselineRows = [
    args.rows?.find((row) => row.id === V96_FINAL_MAINTENANCE_BASELINE_ROW.id) ??
      V96_FINAL_MAINTENANCE_BASELINE_ROW,
  ];
  const completed = baselineRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.artifactManifestStatus === "pass" &&
        row.productFullEntrypointStatus === "pass" &&
        row.scientificVerifyEntrypointStatus === "pass" &&
        row.scientificGateChainStatus === "pass" &&
        row.postBaselinePolicyStatus === "pass" &&
        row.docsBaselineStatus === "pass" &&
        row.browserSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.artifactManifestStatus !== "pass" ||
      row.productFullEntrypointStatus !== "pass" ||
      row.scientificVerifyEntrypointStatus !== "pass" ||
      row.scientificGateChainStatus !== "pass" ||
      row.postBaselinePolicyStatus !== "pass" ||
      row.docsBaselineStatus !== "pass" ||
      row.browserSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-maintenance-baseline-blocked"
        : ready
          ? "ready-maintenance-baseline-locked"
          : "ready-post-baseline-boundary-locked";

  return {
    version: ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
    maintenanceBaselineProfile: ATLAS_FINAL_MAINTENANCE_BASELINE_PROFILE,
    status,
    classification: classifyFinalMaintenanceBaseline({
      status,
      audits,
      ready,
    }),
    baselineRowCount: baselineRows.length,
    completedBaselineRowCount: completed.length,
    audits,
    baselineRows,
    readyBaselineRowId: ready?.id ?? "",
    productFullCommand: "npm run verify:atlas:full",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest",
    browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
    releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
    maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
    provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
    offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
    migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
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
    trustedBoundary: V96_FINAL_MAINTENANCE_BASELINE_BOUNDARY,
  };
}

function classifyFinalMaintenanceBaseline(args: {
  status: AtlasFinalMaintenanceBaselineSummary["status"];
  audits: readonly AtlasFinalMaintenanceBaselineAudit[];
  ready: AtlasFinalMaintenanceBaselineRow | null;
}): AtlasFinalMaintenanceBaselineClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.audits.some(
      (audit) => audit.id === "product-full-verify-entrypoint-lock" && audit.status !== "ready",
    )
  ) {
    return "full-verify-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "scientific-verify-entrypoint-lock" && audit.status !== "ready",
    )
  ) {
    return "scientific-verify-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "v95-release-artifact-manifest-lock" && audit.status !== "ready",
    )
  ) {
    return "artifact-manifest-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "scientific-gate-chain-lock" && audit.status !== "ready",
    )
  ) {
    return "scientific-gate-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "docs-baseline-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-baseline-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready",
    )
  ) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "final-maintenance-baseline-pass";
  return "mixed";
}
