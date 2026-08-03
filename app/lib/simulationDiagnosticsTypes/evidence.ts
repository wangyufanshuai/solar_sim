/* v250 domain types: evidence. Public names remain re-exported by simulationDiagnosticsTypes.ts. */
import type { AtlasFinalGaiaArtEnhancementVersion, CelestialCatalogSource, CelestialObjectKind } from "./catalog";
import type { AtlasBrowserResourcePerformanceVersion } from "./release";

export type ResearchConfidence = "visual" | "diagnostic" | "validated";


export type EvidenceLedgerVersion = "v20-evidence-ledger" | "v21-claim-passports";

export type EvidenceClaimStatus = "ready" | "pending" | "failed" | "informational";

export type EvidenceClaimConfidence =
  | "visual"
  | "formula-checked"
  | "catalog-backed"
  | "horizons-checked"
  | "validated";

export type EvidenceClaimGroup =
  | "orbit-visual-layer"
  | "mission-capsule-reproducibility"
  | "scientific-report-dossier"
  | "validation-console-readiness"
  | "observatory-deck-workbench"
  | "performance-budget-readiness"
  | "release-candidate-gate"
  | "relativity-observable-atlas"
  | "relativity-observable-explainer"
  | "relativity-guided-tour"
  | "relativity-verification-readability"
  | "relativity-verification-charts"
  | "physics-benchmark-release-gate"
  | "horizons-gate-closure-audit"
  | "physics-gate-split"
  | "release-readiness-documentation"
  | "scientific-gate-preflight"
  | "horizons-residual-decomposition"
  | "horizons-candidate-lab"
  | "pluto-residual-isolation"
  | "outer-system-force-model-preflight"
  | "outer-system-reference-adoption"
  | "horizons-candidate-scientific-gate"
  | "strict-horizons-migration-dry-run"
  | "strict-horizons-shadow-migration-gate"
  | "default-strict-horizons-migration"
  | "horizons-provenance-freeze"
  | "offline-runtime-boundary-audit"
  | "scientific-gate-maintenance-runbook"
  | "scientific-gate-release-evidence"
  | "browser-ci-stability-lock"
  | "release-artifact-manifest-lock"
  | "final-maintenance-baseline"
  | "gaia-starfield-enhancement"
  | "relativity-simulation-optimization"
  | "art-polish"
  | "post-enhancement-maintenance-baseline"
  | "browser-resource-performance-lock"
  | "maintenance-evidence-index"
  | "presentation-runtime-performance-lock"
  | "browser-acceptance-runtime-cost-lock"
  | "final-gaia-art-enhancement-lock"
  | "release-candidate-evidence-closure-lock"
  | "interaction-catalog-completion-lock"
  | "interaction-repair-launch-ux-lock"
  | "interaction-visual-quality-lock"
  | "critical-ui-relativity-visibility-lock"
  | "camera-stellar-closeup-lock"
  | "launch-gameplay-openrocket-bridge-lock"
  | "scientific-model-upgrade-contract"
  | "visual-launch-performance-lock"
  | "browser-acceptance-harness"
  | "accessibility-workbench"
  | "cinematic-visual-system"
  | "planetary-visual-fidelity"
  | "cinematic-lighting"
  | "chinese-deep-space-fidelity"
  | "cinematic-deep-space-camera"
  | "universe-sandbox-reference-backdrop"
  | "reference-grade-space-art"
  | "planetary-material-composition"
  | "cinematic-closeup-director"
  | "cinematic-key-light-director"
  | "planetary-depth-lighting"
  | "planetary-color-grading"
  | "numerical-integrity-gate"
  | "cinematic-planetary-art-direction"
  | "cinematic-deep-space-backdrop"
  | "sparse-deep-space-director"
  | "closeup-presentation-truth"
  | "closeup-visual-fidelity"
  | "solar-eih-1pn"
  | "gr-weak-field"
  | "gaia-catalog"
  | "celestial-catalog-atlas"
  | "galactic-dynamics"
  | "frw-cosmology"
  | "kerr-strong-field";

export type CelestialObjectPassportVersion = "v23-object-passports";


export type CelestialObjectPassportMetric = {
  id: string;
  label: string;
  value: string;
  status: EvidenceClaimStatus;
};


export type CelestialObjectPassportSection = {
  id:
    | "identity"
    | "source-chain"
    | "coordinates"
    | "observables"
    | "provenance"
    | "trusted-boundary"
    | "related-evidence";
  title: string;
  body: string;
};


export type CelestialObjectPassport = {
  version: CelestialObjectPassportVersion;
  objectId: string;
  title: string;
  kind: CelestialObjectKind;
  source: CelestialCatalogSource;
  catalogName: string;
  subtitle: string;
  color: string;
  sourceChain: readonly string[];
  coordinateFrame: string;
  metrics: readonly CelestialObjectPassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedEvidenceClaimId: "celestial-catalog-atlas";
  sections: readonly CelestialObjectPassportSection[];
};


export type EvidenceRelatedView =
  | "orbit-analysis"
  | "telemetry"
  | "body-sidebar"
  | "kerr-lab"
  | "atlas-workflows"
  | "relativity-observables"
  | "evidence-ledger";


export type EvidencePassportMetric = {
  id: string;
  label: string;
  value: string;
  target?: string;
  tolerance?: string;
  status: EvidenceClaimStatus;
};


export type EvidencePassportFormula = {
  id: string;
  label: string;
  expression: string;
  variables: string;
  applicability: string;
};


export type EvidencePassportSection = {
  id:
    | "source-chain"
    | "method"
    | "metrics"
    | "confidence"
    | "assumptions"
    | "limitations"
    | "related-views";
  title: string;
  body: string;
};


export type EvidenceClaimPassport = {
  claimId: string;
  sourceChain: readonly string[];
  method: string;
  formulas: readonly EvidencePassportFormula[];
  metrics: readonly EvidencePassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedViews: readonly EvidenceRelatedView[];
  sections: readonly EvidencePassportSection[];
};


export type EvidenceClaim = {
  id: string;
  group: EvidenceClaimGroup;
  title: string;
  status: EvidenceClaimStatus;
  confidence: EvidenceClaimConfidence;
  source: string;
  model: string;
  metric: string;
  error: string;
  boundary: string;
  passport: EvidenceClaimPassport;
};


export type EvidenceLedgerSummary = {
  version: EvidenceLedgerVersion;
  status: EvidenceClaimStatus;
  claimCount: number;
  readyCount: number;
  failedCount: number;
  groups: readonly EvidenceClaimGroup[];
  claims: readonly EvidenceClaim[];
};


export type AtlasScientificGateReleaseEvidenceVersion =
  "v93-scientific-gate-release-evidence-lock";

export type AtlasScientificGateReleaseEvidenceProfile =
  "v93-offline-gate-release-evidence-bundle";

export type AtlasScientificGateReleaseEvidenceStatus =
  | "pending-runtime-run"
  | "ready-release-evidence-locked"
  | "ready-release-evidence-blocked"
  | "ready-release-verification-matrix-locked";

export type AtlasScientificGateReleaseEvidenceClassification =
  | "release-evidence-pass"
  | "runbook-regression"
  | "provenance-freeze-regression"
  | "offline-runtime-boundary-regression"
  | "command-ownership-regression"
  | "browser-evidence-regression"
  | "docs-evidence-regression"
  | "mixed";

export type AtlasScientificGateReleaseEvidenceRowId =
  "v93-lock-offline-scientific-gate-release-evidence";

export type AtlasScientificGateReleaseEvidenceAuditId =
  | "v92-runbook-lock"
  | "v91-offline-runtime-boundary-lock"
  | "v90-provenance-freeze-lock"
  | "command-evidence-matrix-lock"
  | "fixture-evidence-lock"
  | "docs-evidence-lock"
  | "browser-evidence-lock"
  | "protected-mutation-lock";

export type AtlasScientificGateReleaseEvidenceAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasScientificGateReleaseEvidenceAudit = {
  id: AtlasScientificGateReleaseEvidenceAuditId;
  label: string;
  status: AtlasScientificGateReleaseEvidenceAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasScientificGateReleaseEvidenceRow = {
  id: AtlasScientificGateReleaseEvidenceRowId;
  label: string;
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate";
  legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75";
  expectedInterpretation: "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only";
  migratedFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  migratedFixtureSizeBytes: 21863;
  migratedFixtureVariant: "v84-outer-system-barycenter-reference";
  migratedTargetProvenanceRows: 12;
  legacyFixturePath: "public/data/horizons-validation-j2000.json";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  legacyFixtureSizeBytes: 14678;
  status: "not-run" | "complete" | "blocked";
  runbookStatus: "not-run" | "pass" | "fail";
  provenanceFreezeStatus: "not-run" | "pass" | "fail";
  offlineRuntimeBoundaryStatus: "not-run" | "pass" | "fail";
  commandMatrixStatus: "not-run" | "pass" | "fail";
  fixtureEvidenceStatus: "not-run" | "pass" | "fail";
  docsEvidenceStatus: "not-run" | "pass" | "fail";
  browserEvidenceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  scientificGateReleaseEvidence: "applied-contract-only";
};

export type AtlasScientificGateReleaseEvidenceSummary = {
  version: AtlasScientificGateReleaseEvidenceVersion;
  releaseEvidenceProfile: AtlasScientificGateReleaseEvidenceProfile;
  status: AtlasScientificGateReleaseEvidenceStatus;
  classification: AtlasScientificGateReleaseEvidenceClassification;
  releaseEvidenceRowCount: number;
  completedReleaseEvidenceRowCount: number;
  audits: readonly AtlasScientificGateReleaseEvidenceAudit[];
  releaseEvidenceRows: readonly AtlasScientificGateReleaseEvidenceRow[];
  readyReleaseEvidenceRowId: AtlasScientificGateReleaseEvidenceRowId | "";
  strictBudgetPositionRmsKm: number;
  strictBudgetVelocityRmsMs: number;
  strictBudgetMercuryRatio: number;
  migratedDefaultFixturePath: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json";
  legacyV75FixturePath: "public/data/horizons-validation-j2000.json";
  migratedFixtureSha256: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D";
  legacyFixtureSha256: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B";
  scientificGateReleaseEvidence: "applied-contract-only";
  defaultGateConfigMutation: "not-applied";
  legacyAuditConfigMutation: "not-applied";
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
  scientificCertificationStatus: "offline-gate-release-evidence-not-nasa-jpl-certified";
  trustedBoundary: string;
};


export type AtlasMaintenanceEvidenceIndexVersion =
  "v102-maintenance-evidence-index";

export type AtlasMaintenanceEvidenceIndexProfile =
  "v102-v93-v101-maintenance-evidence-index";

export type AtlasMaintenanceEvidenceIndexStatus =
  | "pending-runtime-run"
  | "ready-maintenance-evidence-indexed"
  | "ready-maintenance-evidence-blocked"
  | "ready-repo-hygiene-policy-locked";

export type AtlasMaintenanceEvidenceIndexClassification =
  | "maintenance-evidence-index-pass"
  | "v101-regression"
  | "command-index-regression"
  | "dirty-worktree-policy-regression"
  | "watchpack-noise-policy-regression"
  | "browser-qa-index-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasMaintenanceEvidenceIndexRowId =
  "v102-lock-maintenance-evidence-index";

export type AtlasMaintenanceEvidenceIndexAuditId =
  | "v101-browser-resource-performance-lock"
  | "command-index-lock"
  | "screenshot-artifact-index-lock"
  | "dirty-worktree-policy-lock"
  | "watchpack-noise-policy-lock"
  | "browser-qa-index-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasMaintenanceEvidenceIndexAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasMaintenanceEvidenceIndexAudit = {
  id: AtlasMaintenanceEvidenceIndexAuditId;
  label: string;
  status: AtlasMaintenanceEvidenceIndexAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasMaintenanceEvidenceIndexRow = {
  id: AtlasMaintenanceEvidenceIndexRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v101Status: "not-run" | "pass" | "fail";
  commandIndexStatus: "not-run" | "pass" | "fail";
  screenshotArtifactStatus: "not-run" | "pass" | "fail";
  dirtyWorktreePolicyStatus: "not-run" | "pass" | "fail";
  watchpackNoisePolicyStatus: "not-run" | "pass" | "fail";
  browserQaIndexStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  maintenanceEvidenceIndex: "applied-maintenance-index-only";
};

export type AtlasMaintenanceEvidenceIndexSummary = {
  version: AtlasMaintenanceEvidenceIndexVersion;
  maintenanceEvidenceIndexProfile: AtlasMaintenanceEvidenceIndexProfile;
  status: AtlasMaintenanceEvidenceIndexStatus;
  classification: AtlasMaintenanceEvidenceIndexClassification;
  browserResourcePerformanceVersion: AtlasBrowserResourcePerformanceVersion;
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasMaintenanceEvidenceIndexAudit[];
  rows: readonly AtlasMaintenanceEvidenceIndexRow[];
  readyRowId: AtlasMaintenanceEvidenceIndexRowId | "";
  focusedCommand: "npm run test:atlas:maintenance-evidence-index";
  maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence";
  browserResourceVerifyCommand: "npm run verify:atlas:browser-resource";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  commandIndexPolicy: "v93-v101-focused-and-verify-commands-indexed";
  screenshotArtifactPolicy: "v93-v95-v97-v101-browser-screenshot-directories-indexed";
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
  watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise";
  browserQaPolicy: "root-observable-evidence-validation-console-errors-zero-teardown-clear";
  maintenanceEvidenceIndex: "applied-maintenance-index-only";
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


export type AtlasRcEvidenceClosureVersion =
  "v106-release-candidate-evidence-closure-lock";

export type AtlasRcEvidenceClosureProfile =
  "v106-v93-v105-final-rc-evidence-closure";

export type AtlasRcEvidenceClosureStatus =
  | "pending-runtime-run"
  | "ready-rc-evidence-closed"
  | "ready-rc-evidence-blocked"
  | "ready-rc-handoff-indexed";

export type AtlasRcEvidenceClosureClassification =
  | "rc-evidence-closure-pass"
  | "v105-regression"
  | "command-matrix-regression"
  | "browser-qa-regression"
  | "artifact-index-regression"
  | "dirty-worktree-policy-regression"
  | "docs-surface-regression"
  | "protected-mutation-regression"
  | "mixed";

export type AtlasRcEvidenceClosureRowId =
  "v106-lock-release-candidate-evidence-closure";

export type AtlasRcEvidenceClosureAuditId =
  | "v105-final-gaia-art-enhancement"
  | "command-matrix-lock"
  | "browser-qa-lock"
  | "artifact-index-lock"
  | "dirty-worktree-policy-lock"
  | "watchpack-noise-policy-lock"
  | "docs-surface-lock"
  | "protected-mutation-lock";

export type AtlasRcEvidenceClosureAuditStatus =
  | "ready"
  | "blocked"
  | "regressed";

export type AtlasRcEvidenceClosureAudit = {
  id: AtlasRcEvidenceClosureAuditId;
  label: string;
  status: AtlasRcEvidenceClosureAuditStatus;
  measured: string;
  expected: string;
  trustedBoundary: string;
};

export type AtlasRcEvidenceClosureRow = {
  id: AtlasRcEvidenceClosureRowId;
  label: string;
  status: "not-run" | "complete" | "blocked";
  v105Status: "not-run" | "pass" | "fail";
  commandMatrixStatus: "not-run" | "pass" | "fail";
  browserQaStatus: "not-run" | "pass" | "fail";
  artifactIndexStatus: "not-run" | "pass" | "fail";
  dirtyWorktreePolicyStatus: "not-run" | "pass" | "fail";
  watchpackNoisePolicyStatus: "not-run" | "pass" | "fail";
  docsSurfaceStatus: "not-run" | "pass" | "fail";
  protectedMutationStatus: "not-run" | "pass" | "fail";
  rcEvidenceClosure: "applied-rc-evidence-closure-only";
};

export type AtlasRcEvidenceClosureSummary = {
  version: AtlasRcEvidenceClosureVersion;
  rcEvidenceClosureProfile: AtlasRcEvidenceClosureProfile;
  status: AtlasRcEvidenceClosureStatus;
  classification: AtlasRcEvidenceClosureClassification;
  finalGaiaArtEnhancementVersion: AtlasFinalGaiaArtEnhancementVersion;
  commandMatrixPolicy: "v93-v105-focused-and-verify-commands-indexed";
  browserQaPolicy: "root-observable-evidence-validation-v106-markers-console-zero-fresh-teardown";
  artifactIndexPolicy: "v93-v105-browser-screenshot-directories-indexed";
  dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit";
  watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise";
  focusedCommand: "npm run test:atlas:rc-evidence-closure";
  rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence";
  finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/";
  indexedScreenshotArtifactDirectories: readonly string[];
  rowCount: number;
  completedRowCount: number;
  audits: readonly AtlasRcEvidenceClosureAudit[];
  rows: readonly AtlasRcEvidenceClosureRow[];
  readyRowId: AtlasRcEvidenceClosureRowId | "";
  rcEvidenceClosure: "applied-rc-evidence-closure-only";
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
  releaseArchiveMutation: "not-applied";
  releasePackagingMutation: "not-applied";
  stagingMutation: "not-applied";
  commitMutation: "not-applied";
  certificationClaimMutation: "not-applied";
  trustedBoundary: string;
};
