import { createAtlasReleaseArtifactManifestLockSummary } from "./atlasReleaseArtifactManifestLock";
import {
  runAtlasReleaseArtifactManifestLockAudit,
} from "./atlasReleaseArtifactManifestLockRunner";
import {
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import {
  V96_FINAL_MAINTENANCE_BASELINE_ROW,
} from "./atlasFinalMaintenanceBaseline";
import type {
  AtlasFinalMaintenanceBaselineAudit,
  AtlasFinalMaintenanceBaselineRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasFinalMaintenanceBaselineAudit(args: {
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
  audits: readonly AtlasFinalMaintenanceBaselineAudit[];
  rows: readonly AtlasFinalMaintenanceBaselineRow[];
}> {
  const artifactAudit = await runAtlasReleaseArtifactManifestLockAudit({
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
  const artifactSummary = createAtlasReleaseArtifactManifestLockSummary({
    audits: artifactAudit.audits,
    rows: artifactAudit.rows,
  });
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const audits = [
    artifactManifestLock(artifactSummary.status, artifactSummary.classification),
    productFullVerifyEntrypointLock(args.packageScripts),
    scientificVerifyEntrypointLock(args.packageScripts),
    scientificGateChainLock(args.packageScripts),
    postBaselinePolicyLock(docsText, combinedSurface),
    docsBaselineLock(docsText),
    browserSurfaceLock(combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasFinalMaintenanceBaselineAudit[];

  return {
    audits,
    rows: [finalMaintenanceBaselineRow(audits)],
  };
}

function artifactManifestLock(
  status: string,
  classification: string,
): AtlasFinalMaintenanceBaselineAudit {
  const ready = status === "ready-artifact-manifest-locked" && classification === "release-artifact-manifest-pass";
  return audit(
    "v95-release-artifact-manifest-lock",
    "v95 artifact manifest remains ready",
    ready,
    `${status}; ${classification}`,
    "ready-artifact-manifest-locked; release-artifact-manifest-pass",
    "The final maintenance baseline can pass only while v95 release artifact manifest remains locked.",
  );
}

function productFullVerifyEntrypointLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasFinalMaintenanceBaselineAudit {
  const measured = packageScripts?.["verify:atlas:full"] ?? "missing";
  const expected = "npm run verify:atlas && npm run test:atlas:browser:fresh";
  return audit(
    "product-full-verify-entrypoint-lock",
    "final product full verification entrypoint",
    measured === expected,
    measured,
    expected,
    "v96 fixes verify:atlas:full as the maintained product full verification entrypoint.",
  );
}

function scientificVerifyEntrypointLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasFinalMaintenanceBaselineAudit {
  const measured = packageScripts?.["verify:atlas:scientific"] ?? "missing";
  const expected =
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh";
  return audit(
    "scientific-verify-entrypoint-lock",
    "final scientific verification entrypoint",
    measured === expected,
    measured,
    expected,
    "v96 fixes verify:atlas:scientific as the maintained scientific verification entrypoint.",
  );
}

function scientificGateChainLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasFinalMaintenanceBaselineAudit {
  const measured = [
    packageScripts?.["test:atlas:release-artifact-manifest"] ?? "missing",
    packageScripts?.["test:atlas:browser-ci-stability"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-release-evidence"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-runbook"] ?? "missing",
    packageScripts?.["test:atlas:horizons-provenance-freeze"] ?? "missing",
    packageScripts?.["test:atlas:offline-runtime-boundary"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing",
    packageScripts?.["test:atlas:final-maintenance-baseline"] ?? "missing",
  ].join(" | ");
  const expected = [
    "vitest run app/lib/atlasReleaseArtifactManifestLock.horizons.test.ts",
    "vitest run app/lib/atlasBrowserCiStabilityLock.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateReleaseEvidence.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateMaintenanceRunbook.horizons.test.ts",
    "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    "vitest run app/lib/atlasOfflineRuntimeBoundaryAudit.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    "vitest run app/lib/atlasFinalMaintenanceBaseline.horizons.test.ts",
  ].join(" | ");
  return audit(
    "scientific-gate-chain-lock",
    "v90-v96 scientific maintenance evidence chain",
    measured === expected,
    measured,
    expected,
    "The final baseline must keep the v90-v95 evidence chain and the v96 heavy audit separately runnable.",
  );
}

function postBaselinePolicyLock(
  docsText: string,
  surfaceText: string,
): AtlasFinalMaintenanceBaselineAudit {
  const combined = `${docsText}\n${surfaceText}`;
  const ready =
    combined.includes("post-v96-scientific-mainline-requires-intentional-upgrade") &&
    combined.includes("intentional fixture/model upgrade") &&
    combined.includes("true live physics migration") &&
    combined.includes("Gaia/constellation/art/relativity optimization remains post-baseline");
  return audit(
    "post-baseline-policy-lock",
    "post-v96 scientific mainline policy",
    ready,
    ready ? "post-v96 scientific mainline policy present" : "post-v96 policy missing",
    "post-v96 scientific mainline policy present",
    "After v96, scientific mainline changes require an intentional fixture/model upgrade or true live physics migration.",
  );
}

function docsBaselineLock(docsText: string): AtlasFinalMaintenanceBaselineAudit {
  const ready =
    docsText.includes("v96 Final Maintenance Baseline") &&
    docsText.includes("final maintenance baseline") &&
    docsText.includes("not a scientific model") &&
    docsText.includes("not a release archive") &&
    docsText.includes("does not change live runtime physics");
  return audit(
    "docs-baseline-lock",
    "v96 final maintenance baseline documentation",
    ready,
    ready ? "v96 final maintenance baseline docs present" : "v96 baseline docs missing",
    "v96 final maintenance baseline docs present",
    "Documentation must present v96 as a final maintenance baseline, not a science, browser, visual or packaging upgrade.",
  );
}

function browserSurfaceLock(surfaceText: string): AtlasFinalMaintenanceBaselineAudit {
  const ready =
    surfaceText.includes("data-atlas-final-maintenance-baseline-version") &&
    surfaceText.includes("data-atlas-final-maintenance-baseline-strip") &&
    surfaceText.includes("data-atlas-final-maintenance-baseline-table") &&
    surfaceText.includes("final-maintenance-baseline") &&
    surfaceText.includes("v96-final-maintenance-baseline");
  return audit(
    "browser-surface-lock",
    "root DOM, Observable, Evidence and Validation final baseline surface",
    ready,
    ready ? "v96 final maintenance baseline surface present" : "v96 final baseline surface missing",
    "v96 final maintenance baseline surface present",
    "Rendered surfaces and browser acceptance must expose v96 final baseline markers.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasFinalMaintenanceBaselineAudit {
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
    "protected final baseline mutation flags",
    ready,
    ready ? "all protected final baseline mutation flags not-applied" : "protected final baseline mutation flag missing",
    "all protected final baseline mutation flags not-applied",
    "The v96 contract must keep runtime, asset, fixture, budget, default gate, release package and certification mutation flags not-applied.",
  );
}

function finalMaintenanceBaselineRow(
  audits: readonly AtlasFinalMaintenanceBaselineAudit[],
): AtlasFinalMaintenanceBaselineRow {
  const statusFor = (ids: readonly AtlasFinalMaintenanceBaselineAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V96_FINAL_MAINTENANCE_BASELINE_ROW,
    status: ready ? "complete" : "blocked",
    artifactManifestStatus: statusFor(["v95-release-artifact-manifest-lock"]),
    productFullEntrypointStatus: statusFor(["product-full-verify-entrypoint-lock"]),
    scientificVerifyEntrypointStatus: statusFor(["scientific-verify-entrypoint-lock"]),
    scientificGateChainStatus: statusFor(["scientific-gate-chain-lock"]),
    postBaselinePolicyStatus: statusFor(["post-baseline-policy-lock"]),
    docsBaselineStatus: statusFor(["docs-baseline-lock"]),
    browserSurfaceStatus: statusFor(["browser-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    finalMaintenanceBaseline: "applied-contract-only",
  };
}

function audit(
  id: AtlasFinalMaintenanceBaselineAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasFinalMaintenanceBaselineAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v96FinalMaintenanceBaselineCommandContract(): Readonly<{
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75AuditCommand: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade";
}> {
  return {
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
  };
}
