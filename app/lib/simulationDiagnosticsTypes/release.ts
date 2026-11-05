/* v250 domain types: release. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { AtlasGaiaStarfieldEnhancementBudget, AtlasGaiaStarfieldEnhancementVersion } from "./catalog";
import type { AtlasRcEvidenceClosureVersion, EvidenceClaimStatus } from "./evidence";
import type { AtlasScientificHorizonsGateStatus, AtlasValidationDomainId, AtlasValidationDomainStatus } from "./physics";
import type { AtlasRelativitySimulationOptimizationVersion } from "./relativity";
import type { AtlasArtPolishOpacityCaps, AtlasArtPolishVersion, AtlasCameraStellarCloseupVersion, AtlasPresentationRuntimePerformanceVersion, AtlasRenderStabilityStatus } from "./visual";

export type AtlasPerformanceBudgetVersion = "v34-performance-budget";

export type AtlasPerformanceTier = "mobile-safe" | "balanced" | "dense" | "diagnostic";


export type AtlasPerformanceRecommendation = {
  id: string;
  severity: "info" | "warning";
  title: string;
  detail: string;
};


export type AtlasPerformanceBudgetSummary = {
  version: AtlasPerformanceBudgetVersion;
  tier: AtlasPerformanceTier;
  renderStability: AtlasRenderStabilityStatus;
  presentationMode: string;
  scaleMode: string;
  renderBudget: string;
  recommendedRenderBudget: string;
  viewportWidth: number;
  devicePixelRatio: number;
  mobile: boolean;
  deepSkyEnabled: boolean;
  catalogLabelsEnabled: boolean;
  catalogLabelCount: number;
  deepSkyLabelBudget: number;
  kerrVisible: boolean;
  workbenchOpen: boolean;
  readinessFallback: boolean;
  visualEnhance: boolean;
  recommendationCount: number;
  recommendations: readonly AtlasPerformanceRecommendation[];
  primaryMetric: string;
  trustedBoundary: string;
};


export type AtlasReleaseGateVersion = "v36-release-candidate-gate";


export type AtlasBrowserAcceptanceVersion = "v38-browser-acceptance-harness";

export type AtlasOrbitPerformanceProfile = "closeup-selected-orbit-budget";


export type AtlasBrowserAcceptanceViewport = {
  id: "desktop-chrome-1440x900" | "mobile-chrome-390x844";
  label: string;
  width: number;
  height: number;
};


export type AtlasBrowserAcceptanceSummary = {
  version: AtlasBrowserAcceptanceVersion;
  status: EvidenceClaimStatus;
  command: "npm run test:atlas:browser";
  fullGateCommand: "npm run verify:atlas:full";
  runtimeCommandStatus: "not-claimed-in-app";
  browser: "system-chrome";
  viewportCount: number;
  viewports: readonly AtlasBrowserAcceptanceViewport[];
  checkedContracts: readonly string[];
  primaryMetric: string;
  trustedBoundary: string;
};


export type AtlasReleaseGateSummary = {
  version: AtlasReleaseGateVersion;
  status: AtlasValidationDomainStatus;
  blockerCount: number;
  warningCount: number;
  readyDomainCount: number;
  pendingDomainCount: number;
  failedDomainCount: number;
  informationalDomainCount: number;
  checkedDomainCount: number;
  sourceDomainIds: readonly AtlasValidationDomainId[];
  primaryMetric: string;
  trustedBoundary: string;
};

export type AtlasProductReleaseGateStatus = "pass";


export type AtlasReleaseReadinessVersion = "v79-release-readiness-gate-semantics";

export type AtlasReleaseReadinessProfile = "v79-product-ready-scientific-blocker-disclosed";

export type AtlasReleaseReadinessSummary = {
  version: AtlasReleaseReadinessVersion;
  readinessProfile: AtlasReleaseReadinessProfile;
  productReleaseGateStatus: AtlasProductReleaseGateStatus;
  scientificHorizonsGateStatus: AtlasScientificHorizonsGateStatus;
  productFullCommand: "npm run verify:atlas:full";
  scientificFullCommand: "npm run verify:atlas:scientific";
  strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate";
  knownScientificBlocker: string;
  releaseSemantics: "product-ready-scientific-horizons-blocked";
  documentationScope: "readme-technical-overview-evidence-validation-dom";
  budgetMutation: "not-applied";
  physicsMutation: "not-applied";
  skyAssetMutation: "not-applied";
  materialMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "blocked-by-strict-horizons-gate";
  trustedBoundary: string;
};


export type AtlasOfflineRuntimeBoundaryAuditVersion =
  "v91-offline-runtime-boundary-audit";

export type AtlasOfflineRuntimeBoundaryAuditProfile =
  "v91-scientific-gate-runtime-boundary-lock";

export type AtlasOfflineRuntimeBoundaryAuditStatus =
  | "pending-runtime-run"
  | "ready-boundary-locked"
  | "ready-boundary-blocked"
  | "ready-runtime-claims-clean";

export type AtlasOfflineRuntimeBoundaryAuditClassification =
  | "offline-runtime-boundary-pass"
  | "runtime-claim-regression"
  | "live-physics-mutation-regression"
  | "scientific-certification-claim-regression"
  | "browser-surface-regression"
  | "docs-boundary-regression"
  | "mixed";

export type AtlasOfflineRuntimeBoundaryAuditRowId =
  "v91-lock-offline-scientific-gate-runtime-boundary";

export type AtlasOfflineRuntimeBoundaryAuditLockAuditId =
  | "v90-provenance-freeze-lock"
  | "command-ownership-lock"
  | "docs-boundary-lock"
  | "browser-surface-lock"
  | "runtime-claim-lock"
  | "scientific-certification-claim-lock"
  | "protected-mutation-lock";

export type AtlasOfflineRuntimeBoundaryAuditLockStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasOfflineRuntimeBoundaryAuditLockAudit = {
  id: AtlasOfflineRuntimeBoundaryAuditLockAuditId;
  label: string;
  status: AtlasOfflineRuntimeBoundaryAuditLockStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasOfflineRuntimeBoundaryAuditRow = {
  id: AtlasOfflineRuntimeBoundaryAuditRowId;
  label: string;
  defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  verifyScientificCommand: "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh";
  status: "not-run" | "complete" | "blocked";
  commandBoundaryStatus: "not-run" | "pass" | "fail";
  docsBoundaryStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  runtimeClaimStatus: "not-run" | "pass" | "fail";
  scientificCertificationClaimStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryAudit: "applied-contract-only";
};

export type AtlasOfflineRuntimeBoundaryAuditSummary = {
  version: AtlasOfflineRuntimeBoundaryAuditVersion;
  boundaryProfile: AtlasOfflineRuntimeBoundaryAuditProfile;
  status: AtlasOfflineRuntimeBoundaryAuditStatus;
  classification: AtlasOfflineRuntimeBoundaryAuditClassification;
  boundaryRowCount: number;
  completedBoundaryRowCount: number;
  lockAudits: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];
  boundaryRows: readonly AtlasOfflineRuntimeBoundaryAuditRow[];
  readyBoundaryRowId: AtlasOfflineRuntimeBoundaryAuditRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  offlineRuntimeBoundaryAudit: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasScientificGateMaintenanceRunbookVersion =
  "v92-scientific-gate-maintenance-runbook-lock";

export type AtlasScientificGateMaintenanceRunbookProfile =
  "v92-offline-gate-release-rollback-command-runbook";

export type AtlasScientificGateMaintenanceRunbookStatus =
  | "pending-runtime-run"
  | "ready-runbook-locked"
  | "ready-runbook-blocked"
  | "ready-rollback-audit-preserved";

export type AtlasScientificGateMaintenanceRunbookClassification =
  | "maintenance-runbook-pass"
  | "command-ownership-regression"
  | "provenance-freeze-regression"
  | "offline-runtime-boundary-regression"
  | "rollback-contract-regression"
  | "docs-runbook-regression"
  | "browser-surface-regression"
  | "mixed";

export type AtlasScientificGateMaintenanceRunbookRowId =
  "v92-lock-offline-scientific-gate-maintenance-runbook";

export type AtlasScientificGateMaintenanceRunbookAuditId =
  | "v91-offline-runtime-boundary-lock"
  | "v90-provenance-freeze-lock"
  | "command-ownership-lock"
  | "rollback-contract-lock"
  | "docs-runbook-lock"
  | "browser-surface-lock"
  | "protected-mutation-lock";

export type AtlasScientificGateMaintenanceRunbookAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasScientificGateMaintenanceRunbookAudit = {
  id: AtlasScientificGateMaintenanceRunbookAuditId;
  label: string;
  status: AtlasScientificGateMaintenanceRunbookAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasScientificGateMaintenanceRunbookRow = {
  id: AtlasScientificGateMaintenanceRunbookRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  currentScientificCommand: "npm run verify:atlas:scientific";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  expectedInterpretation: "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only";
  status: "not-run" | "complete" | "blocked";
  commandOwnershipStatus: "not-run" | "pass" | "fail";
  provenanceFreezeStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryStatus: "not-run" | "pass" | "fail";
  rollbackContractStatus: "not-run" | "pass" | "fail";
  docsRunbookStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  scientificGateMaintenanceRunbook: "applied-contract-only";
};

export type AtlasScientificGateMaintenanceRunbookSummary = {
  version: AtlasScientificGateMaintenanceRunbookVersion;
  runbookProfile: AtlasScientificGateMaintenanceRunbookProfile;
  status: AtlasScientificGateMaintenanceRunbookStatus;
  classification: AtlasScientificGateMaintenanceRunbookClassification;
  runbookRowCount: number;
  completedRunbookRowCount: number;
  audits: readonly AtlasScientificGateMaintenanceRunbookAudit[];
  runbookRows: readonly AtlasScientificGateMaintenanceRunbookRow[];
  readyRunbookRowId: AtlasScientificGateMaintenanceRunbookRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  legacyV75FixturePath: "public/data/horizons-validation-j2000.json";
  scientificGateMaintenanceRunbook: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "offline-gate-maintenance-runbook-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasBrowserCiStabilityLockVersion = "v94-browser-ci-stability-lock";

export type AtlasBrowserCiStabilityLockProfile = "v94-fresh-browser-ci-runtime-stability";

export type AtlasBrowserCiStabilityLockStatus =
  | "pending-runtime-run"
  | "ready-browser-ci-locked"
  | "ready-browser-ci-blocked"
  | "ready-fresh-teardown-preserved";

export type AtlasBrowserCiStabilityLockClassification =
  | "browser-ci-stability-pass"
  | "screenshot-retry-regression"
  | "pixel-settle-regression"
  | "fresh-server-regression"
  | "command-ownership-regression"
  | "docs-boundary-regression"
  | "mixed";

export type AtlasBrowserCiStabilityLockRowId = "v94-lock-fresh-browser-ci-stability";

export type AtlasBrowserCiStabilityLockAuditId =
  | "v93-release-evidence-lock"
  | "screenshot-retry-lock"
  | "pixel-settle-lock"
  | "fresh-server-lock"
  | "command-ownership-lock"
  | "docs-boundary-lock"
  | "surface-contract-lock"
  | "protected-mutation-lock";

export type AtlasBrowserCiStabilityLockAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasBrowserCiStabilityLockAudit = {
  id: AtlasBrowserCiStabilityLockAuditId;
  label: string;
  status: AtlasBrowserCiStabilityLockAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasBrowserCiStabilityLockRow = {
  id: AtlasBrowserCiStabilityLockRowId;
  label: string;
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  freshBrowserPort: 3015;
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  watchpackWarningPolicy: "known-windows-noise-non-failing";
  status: "not-run" | "complete" | "blocked";
  releaseEvidenceStatus: "not-run" | "pass" | "fail";
  screenshotRetryStatus: "not-run" | "pass" | "fail";
  pixelSettleStatus: "not-run" | "pass" | "fail";
  freshServerStatus: "not-run" | "pass" | "fail";
  commandOwnershipStatus: "not-run" | "pass" | "fail";
  docsBoundaryStatus: "not-run" | "pass" | "fail";
  surfaceContractStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserCiStabilityLock: "applied-contract-only";
};

export type AtlasBrowserCiStabilityLockSummary = {
  version: AtlasBrowserCiStabilityLockVersion;
  stabilityProfile: AtlasBrowserCiStabilityLockProfile;
  status: AtlasBrowserCiStabilityLockStatus;
  classification: AtlasBrowserCiStabilityLockClassification;
  stabilityRowCount: number;
  completedStabilityRowCount: number;
  audits: readonly AtlasBrowserCiStabilityLockAudit[];
  stabilityRows: readonly AtlasBrowserCiStabilityLockRow[];
  readyStabilityRowId: AtlasBrowserCiStabilityLockRowId | "";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  freshBrowserPort: 3015;
  screenshotRetryAttempts: 3;
  pixelSettleAttempts: 4;
  watchpackWarningPolicy: "known-windows-noise-non-failing";
  browserCiStabilityLock: "applied-contract-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "browser-ci-stability-lock-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasFinalMaintenanceBaselineVersion = "v96-final-maintenance-baseline";

export type AtlasFinalMaintenanceBaselineProfile =
  "v96-final-offline-maintenance-baseline";

export type AtlasFinalMaintenanceBaselineStatus =
  | "pending-runtime-run"
  | "ready-maintenance-baseline-locked"
  | "ready-maintenance-baseline-blocked"
  | "ready-post-baseline-boundary-locked";

export type AtlasFinalMaintenanceBaselineClassification =
  | "final-maintenance-baseline-pass"
  | "full-verify-regression"
  | "scientific-verify-regression"
  | "artifact-manifest-regression"
  | "browser-ci-regression"
  | "scientific-gate-regression"
  | "docs-baseline-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasFinalMaintenanceBaselineRowId =
  "v96-lock-final-maintenance-baseline";

export type AtlasFinalMaintenanceBaselineAuditId =
  | "v95-release-artifact-manifest-lock"
  | "product-full-verify-entrypoint-lock"
  | "scientific-verify-entrypoint-lock"
  | "scientific-gate-chain-lock"
  | "post-baseline-policy-lock"
  | "docs-baseline-lock"
  | "browser-surface-lock"
  | "protected-mutation-lock";

export type AtlasFinalMaintenanceBaselineAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasFinalMaintenanceBaselineAudit = {
  id: AtlasFinalMaintenanceBaselineAuditId;
  label: string;
  status: AtlasFinalMaintenanceBaselineAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasFinalMaintenanceBaselineRow = {
  id: AtlasFinalMaintenanceBaselineRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade";
  status: "not-run" | "complete" | "blocked";
  artifactManifestStatus: "not-run" | "pass" | "fail";
  productFullEntrypointStatus: "not-run" | "pass" | "fail";
  scientificVerifyEntrypointStatus: "not-run" | "pass" | "fail";
  scientificGateChainStatus: "not-run" | "pass" | "fail";
  postBaselinePolicyStatus: "not-run" | "pass" | "fail";
  docsBaselineStatus: "not-run" | "pass" | "fail";
  browserSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  finalMaintenanceBaseline: "applied-contract-only";
};

export type AtlasFinalMaintenanceBaselineSummary = {
  version: AtlasFinalMaintenanceBaselineVersion;
  maintenanceBaselineProfile: AtlasFinalMaintenanceBaselineProfile;
  status: AtlasFinalMaintenanceBaselineStatus;
  classification: AtlasFinalMaintenanceBaselineClassification;
  baselineRowCount: number;
  completedBaselineRowCount: number;
  audits: readonly AtlasFinalMaintenanceBaselineAudit[];
  baselineRows: readonly AtlasFinalMaintenanceBaselineRow[];
  readyBaselineRowId: AtlasFinalMaintenanceBaselineRowId | "";
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest";
  browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability";
  releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade";
  finalMaintenanceBaseline: "applied-contract-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  runtimeCertificationStatus: "not-claimed-in-app";
  scientificCertificationStatus: "final-maintenance-baseline-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasPostEnhancementMaintenanceBaselineVersion =
  "v100-post-enhancement-maintenance-baseline";

export type AtlasPostEnhancementMaintenanceBaselineProfile =
  "v100-v97-v99-visual-teaching-maintenance-lock";

export type AtlasPostEnhancementMaintenanceBaselineStatus =
  | "pending-runtime-run"
  | "ready-post-enhancement-baseline-locked"
  | "ready-post-enhancement-baseline-blocked"
  | "ready-post-enhancement-evidence-indexed";

export type AtlasPostEnhancementMaintenanceBaselineClassification =
  | "post-enhancement-baseline-pass"
  | "v96-baseline-regression"
  | "gaia-overlay-regression"
  | "relativity-observability-regression"
  | "art-polish-regression"
  | "browser-resource-regression"
  | "verification-entrypoint-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasPostEnhancementMaintenanceBaselineRowId =
  "v100-lock-post-enhancement-maintenance-baseline";

export type AtlasPostEnhancementMaintenanceBaselineAuditId =
  | "v96-baseline-lock"
  | "v97-gaia-overlay-lock"
  | "v98-relativity-observability-lock"
  | "v99-art-polish-lock"
  | "browser-resource-lifecycle-lock"
  | "verification-entrypoint-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasPostEnhancementMaintenanceBaselineAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasPostEnhancementMaintenanceBaselineAudit = {
  id: AtlasPostEnhancementMaintenanceBaselineAuditId;
  label: string;
  status: AtlasPostEnhancementMaintenanceBaselineAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasPostEnhancementMaintenanceBaselineRow = {
  id: AtlasPostEnhancementMaintenanceBaselineRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  finalBaselineStatus: "not-run" | "pass" | "fail";
  gaiaOverlayStatus: "not-run" | "pass" | "fail";
  relativityObservabilityStatus: "not-run" | "pass" | "fail";
  artPolishStatus: "not-run" | "pass" | "fail";
  browserResourceStatus: "not-run" | "pass" | "fail";
  verificationEntrypointStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  postEnhancementBaseline: "applied-maintenance-lock-only";
};

export type AtlasPostEnhancementMaintenanceBaselineSummary = {
  version: AtlasPostEnhancementMaintenanceBaselineVersion;
  postEnhancementBaselineProfile: AtlasPostEnhancementMaintenanceBaselineProfile;
  status: AtlasPostEnhancementMaintenanceBaselineStatus;
  classification: AtlasPostEnhancementMaintenanceBaselineClassification;
  finalMaintenanceBaselineVersion: AtlasFinalMaintenanceBaselineVersion;
  gaiaEnhancementVersion: AtlasGaiaStarfieldEnhancementVersion;
  relativityOptimizationVersion: AtlasRelativitySimulationOptimizationVersion;
  artPolishVersion: AtlasArtPolishVersion;
  gaiaRenderBudget: AtlasGaiaStarfieldEnhancementBudget;
  artOpacityCaps: AtlasArtPolishOpacityCaps;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasPostEnhancementMaintenanceBaselineAudit[];
  rows: readonly AtlasPostEnhancementMaintenanceBaselineRow[];
  readyRowId: AtlasPostEnhancementMaintenanceBaselineRowId | "";
  focusedCommand: "npm run test:atlas:post-enhancement-baseline";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  finalMaintenanceBaselineCommand: "npm run test:atlas:final-maintenance-baseline";
  gaiaStarfieldEnhancementCommand: "npm run test:atlas:gaia-starfield-enhancement";
  relativitySimulationOptimizationCommand: "npm run test:atlas:relativity-simulation-optimization";
  artPolishCommand: "npm run test:atlas:art-polish";
  constellationCatalogPolicy: "normalized-88-iau-presentation-contract";
  nebulaMarkerPolicy: "curated-local-presentation-marker-only";
  relativityTeachingPolicy: "v98-teaching-observability-not-scientific-upgrade";
  browserResourcePolicy: "about-blank-unload-imagebitmap-close-screenshot-retry-3015-teardown-watchpack-noise";
  postEnhancementBaseline: "applied-maintenance-lock-only";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  performanceOptimizationMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasBrowserResourcePerformanceVersion =
  "v101-browser-resource-performance-lock";

export type AtlasBrowserResourcePerformanceProfile =
  "v101-fresh-browser-resource-performance";

export type AtlasBrowserResourcePerformanceStatus =
  | "pending-runtime-run"
  | "ready-browser-resource-performance-locked"
  | "ready-browser-resource-performance-blocked"
  | "ready-browser-resource-optimized";

export type AtlasBrowserResourcePerformanceClassification =
  | "browser-resource-performance-pass"
  | "v100-baseline-regression"
  | "screenshot-resource-regression"
  | "pixel-sampler-regression"
  | "fresh-teardown-regression"
  | "console-error-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasBrowserResourcePerformanceRowId =
  "v101-lock-browser-resource-performance";

export type AtlasBrowserResourcePerformanceAuditId =
  | "v100-post-enhancement-baseline-lock"
  | "screenshot-resource-helper-lock"
  | "pixel-sampler-helper-lock"
  | "fresh-teardown-lock"
  | "console-error-observability-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasBrowserResourcePerformanceAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasBrowserResourcePerformanceAudit = {
  id: AtlasBrowserResourcePerformanceAuditId;
  label: string;
  status: AtlasBrowserResourcePerformanceAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasBrowserResourcePerformanceRow = {
  id: AtlasBrowserResourcePerformanceRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v100BaselineStatus: "not-run" | "pass" | "fail";
  screenshotResourceStatus: "not-run" | "pass" | "fail";
  pixelSamplerStatus: "not-run" | "pass" | "fail";
  freshTeardownStatus: "not-run" | "pass" | "fail";
  consoleErrorStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization";
};

export type AtlasBrowserResourcePerformanceSummary = {
  version: AtlasBrowserResourcePerformanceVersion;
  browserResourcePerformanceProfile: AtlasBrowserResourcePerformanceProfile;
  status: AtlasBrowserResourcePerformanceStatus;
  classification: AtlasBrowserResourcePerformanceClassification;
  postEnhancementBaselineVersion: AtlasPostEnhancementMaintenanceBaselineVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasBrowserResourcePerformanceAudit[];
  rows: readonly AtlasBrowserResourcePerformanceRow[];
  readyRowId: AtlasBrowserResourcePerformanceRowId | "";
  focusedCommand: "npm run test:atlas:browser-resource-performance";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  postEnhancementBaselineCommand: "npm run test:atlas:post-enhancement-baseline";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotRetryPolicy: "three-attempt-page-screenshot-retry-preserved";
  pixelSamplerPolicy: "shared-imagebitmap-canvas-sampler-explicit-close-and-zero";
  pixelSettlePolicy: "four-attempt-pixel-settle-thresholds-preserved";
  freshTeardownPolicy: "fresh-3015-global-teardown-no-reuse-existing-server";
  consoleErrorPolicy: "console-and-page-errors-observed-as-empty-arrays";
  browserResourcePerformance: "applied-browser-acceptance-helper-resource-optimization";
  runtimePerformanceMutation: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasBrowserAcceptanceRuntimeCostVersion =
  "v104-browser-acceptance-runtime-cost-lock";

export type AtlasBrowserAcceptanceRuntimeCostProfile =
  "v104-fresh-browser-acceptance-cost-review";

export type AtlasBrowserAcceptanceRuntimeCostStatus =
  | "pending-runtime-run"
  | "ready-browser-acceptance-runtime-cost-locked"
  | "ready-browser-acceptance-runtime-cost-blocked"
  | "ready-browser-acceptance-runtime-cost-reduced";

export type AtlasBrowserAcceptanceRuntimeCostClassification =
  | "browser-acceptance-runtime-cost-pass"
  | "v103-regression"
  | "screenshot-workload-regression"
  | "marker-coverage-regression"
  | "fresh-teardown-regression"
  | "console-error-regression"
  | "budget-threshold-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasBrowserAcceptanceRuntimeCostRowId =
  "v104-lock-browser-acceptance-runtime-cost";

export type AtlasBrowserAcceptanceRuntimeCostAuditId =
  | "v103-presentation-runtime-performance"
  | "screenshot-workload-lock"
  | "marker-coverage-lock"
  | "fresh-teardown-lock"
  | "console-error-lock"
  | "budget-threshold-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasBrowserAcceptanceRuntimeCostAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasBrowserAcceptanceRuntimeCostAudit = {
  id: AtlasBrowserAcceptanceRuntimeCostAuditId;
  label: string;
  status: AtlasBrowserAcceptanceRuntimeCostAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasBrowserAcceptanceRuntimeCostRow = {
  id: AtlasBrowserAcceptanceRuntimeCostRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v103Status: "not-run" | "pass" | "fail";
  screenshotWorkloadStatus: "not-run" | "pass" | "fail";
  markerCoverageStatus: "not-run" | "pass" | "fail";
  freshTeardownStatus: "not-run" | "pass" | "fail";
  consoleErrorStatus: "not-run" | "pass" | "fail";
  budgetThresholdStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split";
};

export type AtlasBrowserAcceptanceRuntimeCostSummary = {
  version: AtlasBrowserAcceptanceRuntimeCostVersion;
  browserAcceptanceRuntimeCostProfile: AtlasBrowserAcceptanceRuntimeCostProfile;
  status: AtlasBrowserAcceptanceRuntimeCostStatus;
  classification: AtlasBrowserAcceptanceRuntimeCostClassification;
  presentationRuntimePerformanceVersion: AtlasPresentationRuntimePerformanceVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasBrowserAcceptanceRuntimeCostAudit[];
  rows: readonly AtlasBrowserAcceptanceRuntimeCostRow[];
  readyRowId: AtlasBrowserAcceptanceRuntimeCostRowId | "";
  focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost";
  browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime";
  defaultFreshCommand: "npm run test:atlas:browser:fresh";
  fullReviewCommand: "npm run test:atlas:browser:fresh:review";
  screenshotManifestPolicy: "default-current-plus-core-full-review-history";
  markerCoveragePolicy: "root-observable-evidence-validation-preserved";
  consoleErrorPolicy: "console-page-error-zero-preserved";
  freshTeardownPolicy: "fresh-3015-teardown-preserved";
  budgetThresholdPolicy: "browser-pixel-thresholds-retry-settle-preserved";
  watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise";
  browserAcceptanceRuntimeCost: "applied-browser-screenshot-manifest-split";
  runtimePerformanceMutation: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  skyAssetMutation: "not-applied";
  backgroundMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  materialMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  budgetMutation: "not-applied";
  defaultGateConfigMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasInteractionCatalogCompletionVersion =
  "v107-interaction-catalog-completion-lock";

export type AtlasInteractionCatalogCompletionProfile =
  "v107-camera-launch-gaia-navigation-catalog-completion";

export type AtlasInteractionCatalogCompletionStatus =
  | "pending-runtime-run"
  | "ready-interaction-catalog-locked"
  | "ready-interaction-catalog-blocked"
  | "ready-visual-navigation-complete";

export type AtlasInteractionCatalogCompletionClassification =
  | "interaction-catalog-completion-pass"
  | "v106-regression"
  | "camera-transition-regression"
  | "launch-entry-regression"
  | "gaia-navigation-regression"
  | "label-budget-regression"
  | "constellation-nebula-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasInteractionCatalogCompletionAuditId =
  | "v106-rc-evidence-closure"
  | "camera-transition-lock"
  | "launch-entry-lock"
  | "gaia-navigation-lock"
  | "label-budget-lock"
  | "constellation-nebula-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasInteractionCatalogCompletionAudit = {
  id: AtlasInteractionCatalogCompletionAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasInteractionCatalogCompletionRow = {
  id: "v107-lock-interaction-catalog-completion";
  label: string;
  status: "not-run" | "complete" | "blocked";
  cameraStatus: "not-run" | "pass" | "fail";
  launchStatus: "not-run" | "pass" | "fail";
  gaiaNavigationStatus: "not-run" | "pass" | "fail";
  labelBudgetStatus: "not-run" | "pass" | "fail";
  constellationNebulaStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasInteractionCatalogCompletionSummary = {
  version: AtlasInteractionCatalogCompletionVersion;
  profile: AtlasInteractionCatalogCompletionProfile;
  status: AtlasInteractionCatalogCompletionStatus;
  classification: AtlasInteractionCatalogCompletionClassification;
  rcEvidenceClosureVersion: AtlasRcEvidenceClosureVersion;
  cameraPolicy: "single-cancellable-command-adaptive-smootherstep-1200-1800ms";
  starFocusPolicy: "celestial-direction-center-not-physical-flyby";
  focusExitPolicy: "passport-reset-escape";
  launchPolicy: "orbit-atlas-entry-sandbox-single-leo-satellite-existing-spacecraft-handoff";
  gaiaSearchPolicy: "packaged-5000-query-min-2-max-12";
  gaiaLabelPolicy: "desktop-24-mobile-8-selected-always";
  constellationCount: 88;
  nebulaCount: 80;
  focusedCommand: "npm run test:atlas:interaction-catalog-completion";
  verifyCommand: "npm run verify:atlas:interaction-catalog";
  screenshotArtifactDirectory: "test-results/v107-interaction-catalog-completion-lock/";
  audits: readonly AtlasInteractionCatalogCompletionAudit[];
  rows: readonly AtlasInteractionCatalogCompletionRow[];
  readyRowId: "v107-lock-interaction-catalog-completion" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasInteractionRepairLaunchUxVersion =
  "v108-interaction-repair-launch-ux-lock";

export type AtlasInteractionRepairLaunchUxProfile =
  "v108-sky-target-zoom-launch-ux-repair";

export type AtlasInteractionRepairLaunchUxStatus =
  | "pending-runtime-run"
  | "ready-interaction-repair-launch-ux-locked"
  | "ready-interaction-repair-launch-ux-blocked"
  | "ready-sky-target-launch-ux-repaired";

export type AtlasInteractionRepairLaunchUxClassification =
  | "interaction-repair-launch-ux-pass"
  | "v107-regression"
  | "sky-target-proxy-regression"
  | "sky-target-zoom-regression"
  | "body-zoom-regression"
  | "launch-ux-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasInteractionRepairLaunchUxAuditId =
  | "v107-interaction-catalog-completion"
  | "sky-target-proxy-lock"
  | "sky-target-zoom-lock"
  | "body-zoom-lock"
  | "launch-ux-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasInteractionRepairLaunchUxAudit = {
  id: AtlasInteractionRepairLaunchUxAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasInteractionRepairLaunchUxRow = {
  id: "v108-lock-interaction-repair-launch-ux";
  label: string;
  status: "not-run" | "complete" | "blocked";
  skyTargetProxyStatus: "not-run" | "pass" | "fail";
  skyTargetZoomStatus: "not-run" | "pass" | "fail";
  bodyZoomStatus: "not-run" | "pass" | "fail";
  launchUxStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasInteractionRepairLaunchUxSummary = {
  version: AtlasInteractionRepairLaunchUxVersion;
  profile: AtlasInteractionRepairLaunchUxProfile;
  status: AtlasInteractionRepairLaunchUxStatus;
  classification: AtlasInteractionRepairLaunchUxClassification;
  interactionCatalogCompletionVersion: AtlasInteractionCatalogCompletionVersion;
  skyTargetPolicy: "zoomable-visual-proxy-no-physics-body";
  skyTargetZoomPolicy: "camera-target-distance-only-clamped";
  bodyZoomPolicy: "native-wheel-distance-preserved-during-body-lock";
  focusExitPolicy: "passport-reset-escape-clears-body-and-sky-target";
  launchUxPolicy: "leo-satellite-default-cards-countdown-timeline-local-physics";
  focusedCommand: "npm run test:atlas:interaction-repair-launch-ux";
  verifyCommand: "npm run verify:atlas:interaction-repair-launch-ux";
  screenshotArtifactDirectory: "test-results/v108-interaction-repair-launch-ux-lock/";
  audits: readonly AtlasInteractionRepairLaunchUxAudit[];
  rows: readonly AtlasInteractionRepairLaunchUxRow[];
  readyRowId: "v108-lock-interaction-repair-launch-ux" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasLaunchGameplayOpenRocketBridgeVersion =
  "v112-launch-gameplay-openrocket-bridge-lock";

export type AtlasLaunchGameplayOpenRocketBridgeProfile =
  "v112-mission-scene-openrocket-import-bridge";

export type AtlasLaunchGameplayOpenRocketBridgeStatus =
  | "pending-runtime-run"
  | "ready-launch-gameplay-openrocket-bridge-locked"
  | "ready-launch-gameplay-openrocket-bridge-blocked";

export type AtlasLaunchGameplayOpenRocketBridgeClassification =
  | "launch-gameplay-openrocket-bridge-pass"
  | "v111-regression"
  | "launch-mission-scene-regression"
  | "launch-visual-profile-regression"
  | "openrocket-import-bridge-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasLaunchGameplayOpenRocketBridgeAuditId =
  | "v111-camera-stellar-closeup"
  | "launch-mission-scene-lock"
  | "launch-visual-profile-lock"
  | "openrocket-import-bridge-lock"
  | "protected-mutation-lock";

export type AtlasLaunchGameplayOpenRocketBridgeAudit = {
  id: AtlasLaunchGameplayOpenRocketBridgeAuditId;
  label: string;
  status: "ready" | "blocked" | "regressed";
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasLaunchGameplayOpenRocketBridgeRow = {
  id: "v112-lock-launch-gameplay-openrocket-bridge";
  label: string;
  status: "not-run" | "complete" | "blocked";
  v111Status: "not-run" | "pass" | "fail";
  launchMissionSceneStatus: "not-run" | "pass" | "fail";
  launchVisualProfileStatus: "not-run" | "pass" | "fail";
  openRocketBridgeStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
};

export type AtlasLaunchGameplayOpenRocketBridgeSummary = {
  version: AtlasLaunchGameplayOpenRocketBridgeVersion;
  profile: AtlasLaunchGameplayOpenRocketBridgeProfile;
  status: AtlasLaunchGameplayOpenRocketBridgeStatus;
  classification: AtlasLaunchGameplayOpenRocketBridgeClassification;
  cameraStellarCloseupVersion: AtlasCameraStellarCloseupVersion;
  launchScenePolicy: "mission-scene-pad-tower-countdown-staging-hud-deploy";
  launchVisualProfilePolicy: "deterministic-profile-manifest-leo-sls-mars";
  openRocketBridgePolicy: "offline-import-no-browser-exe-launch";
  telemetryProviderPolicy: "local-default-websocket-optional";
  focusedCommand: "npm run test:atlas:launch-gameplay-openrocket-bridge";
  verifyCommand: "npm run verify:atlas:launch-gameplay-openrocket-bridge";
  screenshotArtifactDirectory: "test-results/v112-launch-gameplay-openrocket-bridge-lock/";
  audits: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[];
  rows: readonly AtlasLaunchGameplayOpenRocketBridgeRow[];
  readyRowId: "v112-lock-launch-gameplay-openrocket-bridge" | "";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  rk4DefaultMutation: "not-applied";
  eihOnePnMutation: "not-applied";
  kerrKernelMutation: "not-applied";
  fixtureDataMutation: "not-applied";
  skyAssetMutation: "not-applied";
  v9SkyDirectionMutation: "not-applied";
  gaiaRenderBudgetMutation: "not-applied";
  gaiaOpacityCapMutation: "not-applied";
  browserExeLaunch: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  trustedBoundary: string;
};


export type AtlasRuntimeQualityTier =
  | "balanced"
  | "mobile-safe"
  | "launch-cinematic"
  | "closeup-inspect";

export type AtlasLaunchSequenceDirectorPhase =
  | "prelaunch"
  | "liftoff"
  | "max-q"
  | "stage-separation"
  | "coast-insertion"
  | "payload-deploy";

export type AtlasLaunchSequenceDirectorPhaseV118 =
  | "prelaunch"
  | "ignition"
  | "tower-clear"
  | "max-q"
  | "meco-separation"
  | "coast"
  | "insertion"
  | "payload-deploy";
