/* v250 Evidence Ledger domain: weakField. */
import { ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION, createAtlasDefaultStrictHorizonsMigrationSummary } from "../atlasDefaultStrictHorizonsMigration";
import { ATLAS_HORIZONS_CANDIDATE_LAB_VERSION, createAtlasHorizonsCandidateLabSummary } from "../atlasHorizonsCandidateLab";
import { ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION, createAtlasHorizonsCandidateScientificGateSummary } from "../atlasHorizonsCandidateScientificGate";
import { ATLAS_HORIZONS_GATE_AUDIT_VERSION, createAtlasHorizonsGateAuditSummary } from "../atlasHorizonsGateAudit";
import { ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION, createAtlasHorizonsProvenanceFreezeSummary } from "../atlasHorizonsProvenanceFreeze";
import { ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION, createAtlasHorizonsResidualDecompositionSummary } from "../atlasHorizonsResidualDecomposition";
import { ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION, createAtlasOfflineRuntimeBoundaryAuditSummary } from "../atlasOfflineRuntimeBoundaryAudit";
import { ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION, createAtlasOuterSystemForceModelPreflightSummary } from "../atlasOuterSystemForceModelPreflight";
import { ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION, createAtlasOuterSystemReferenceAdoptionSummary } from "../atlasOuterSystemReferenceAdoption";
import { ATLAS_PHYSICS_BENCHMARK_GATE_VERSION, createAtlasPhysicsBenchmarkGateSummary } from "../atlasPhysicsBenchmarkGate";
import { ATLAS_PHYSICS_GATE_SPLIT_VERSION, createAtlasPhysicsGateSplitSummary } from "../atlasPhysicsGateSplit";
import { ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION, createAtlasPlutoResidualIsolationSummary } from "../atlasPlutoResidualIsolation";
import { ATLAS_RELEASE_READINESS_VERSION, createAtlasReleaseReadinessSummary } from "../atlasReleaseReadiness";
import { ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION, createAtlasScientificGateMaintenanceRunbookSummary } from "../atlasScientificGateMaintenanceRunbook";
import { ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION, createAtlasScientificGatePreflightSummary } from "../atlasScientificGatePreflight";
import { ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION, createAtlasScientificGateReleaseEvidenceSummary } from "../atlasScientificGateReleaseEvidence";
import { ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION, createAtlasScientificModelUpgradeContractSummary } from "../atlasScientificModelUpgradeContract";
import { ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION, createAtlasStrictHorizonsMigrationDryRunSummary } from "../atlasStrictHorizonsMigrationDryRun";
import { ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION, createAtlasStrictHorizonsShadowMigrationGateSummary } from "../atlasStrictHorizonsShadowMigrationGate";
import type { EvidenceClaim, EvidenceClaimStatus, SimulationDiagnostics } from "../simulationDiagnosticsTypes";
import { createPassport, formatNumber, formula, mapHorizonsStatus, mapReadyFailedStatus, mapRelativityConfidence, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function physicsBenchmarkReleaseGateClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasPhysicsBenchmarkGateSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const status: EvidenceClaimStatus =
    summary.runtimeStatus === "pass"
      ? "ready"
      : summary.runtimeStatus === "fail"
        ? "failed"
        : "pending";
  const claim: EvidenceClaimWithoutPassport = {
    id: "physics-benchmark-release-gate",
    group: "physics-benchmark-release-gate",
    title: "Physics Benchmark Release Gate",
    status,
    confidence: "formula-checked",
    source: `Atlas Physics Benchmark Gate ${ATLAS_PHYSICS_BENCHMARK_GATE_VERSION}`,
    model:
      "Blocking weak-field, deterministic RK4, offline Horizons and equatorial Kerr benchmark budget",
    metric: `${summary.passCount}/${summary.resultCount} pass; ${summary.pendingCount} pending; ${summary.blockingCount} blocking`,
    error:
      summary.blockingCount > 0
        ? summary.results
            .filter((result) => result.status === "fail")
            .map((result) => `${result.id}: ${result.measured}`)
            .join("; ")
        : "No local runtime blocker; latest CI certification is not claimed in the app.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Validation weak-field diagnostics",
        "Atlas Numerical Integrity deterministic fixtures",
        "offline JPL Horizons checkpoints",
        "Kerr geodesic kernel v17",
        ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
      ],
      method:
        "Evaluate nine fixed local benchmark rows against strict upper bounds. Runtime status remains distinct from CI execution and does not mutate the live simulation.",
      formulas: [
        formula(
          "v75-strict-upper-bound",
          "Blocking upper-bound comparison",
          "status = pass iff measured < threshold",
          "deterministic local benchmark value and checked-in threshold",
          "Release regression gate only; not scientific certification.",
        ),
      ],
      metrics: [
        metric("gate-version", "Gate version", summary.version, status),
        metric("budget-profile", "Budget profile", summary.budgetProfile, status),
        metric("runtime-status", "Runtime status", summary.runtimeStatus, status),
        metric("pass-count", "Pass count", String(summary.passCount), status),
        metric("pending-count", "Pending count", String(summary.pendingCount), status),
        metric("blocking-count", "Blocking count", String(summary.blockingCount), status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked locally; the runtime claim does not assert that the latest full verification command passed.",
      assumptions: [
        "The checked-in Horizons dataset remains the offline ephemeris reference.",
        "Carter-constant coverage is deferred until a non-equatorial Kerr kernel exists.",
      ],
      limitations: [
        "Does not certify NASA/JPL precision equivalence, full numerical relativity, online validation or latest CI state.",
        "Does not modify SolarSystemIntegrator, physicsEngine, worker physics, sky assets or the Kerr kernel.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function horizonsGateClosureAuditClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasHorizonsGateAuditSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-gate-closure-audit",
    group: "horizons-gate-closure-audit",
    title: "Horizons Gate Closure Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Gate Audit ${ATLAS_HORIZONS_GATE_AUDIT_VERSION}`,
    model:
      "Read-only v77 audit of J2000 frame metadata, units, body order, mass mapping and shared Horizons RK4/1PN runner",
    metric: `${summary.failureClassification}; ${summary.currentFailureMeasured}`,
    error:
      "Audit records the v75 blocker and does not relax thresholds, bypass full release, certify NASA/JPL precision, mutate physics, mutate sky, or alter v76 visual readiness.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "public/data/horizons-validation-j2000.json",
        "runHorizonsValidationDataset",
        "createAtlasPhysicsBenchmarkGateSummary",
        ATLAS_HORIZONS_GATE_AUDIT_VERSION,
      ],
      method:
        "Summarize the current Horizons release-gate failure with fixed data-lineage checks, runner-lineage checks and row-level checkpoint diagnostics for Newtonian and 1PN modes.",
      metrics: [
        metric("audit-version", "Audit version", summary.version, claim.status),
        metric("audit-profile", "Audit profile", summary.auditProfile, claim.status),
        metric("audit-status", "Audit status", summary.status, claim.status),
        metric("failure-classification", "Failure classification", summary.failureClassification, claim.status),
        metric("current-failure", "Current failure", summary.currentFailureMeasured, claim.status),
        metric("threshold", "Threshold", summary.currentThreshold, claim.status),
        metric("mode-count", "Mode count", String(summary.modeCount), claim.status),
        metric("checkpoint-count", "Checkpoint count", String(summary.checkpointCount), claim.status),
        metric("data-lineage", "Data lineage", summary.dataLineageChecks.join(", "), claim.status),
        metric("runner-lineage", "Runner lineage", summary.runnerLineageChecks.join(", "), claim.status),
        metric("full-release-gate", "Full release gate", summary.fullReleaseGateStatus, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked audit metadata only: it explains the current v75 blocker and row coverage, while the blocking gate remains owned by v75.",
      assumptions: [
        "The checked-in Horizons dataset remains the local reference for this audit.",
        "Current aggregate failure is treated as a model-limit unless the lineage shape is malformed.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision ephemeris equivalence, latest CI status, online validation, or full release readiness.",
        "Does not relax v75 budgets or make Horizons non-blocking.",
        "Does not modify SolarSystemIntegrator, physicsEngine, worker physics, sky assets, v76 materials or the Kerr kernel.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function physicsGateSplitClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasPhysicsGateSplitSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "physics-gate-split",
    group: "physics-gate-split",
    title: "Product / Scientific Physics Gate Split",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Physics Gate Split ${ATLAS_PHYSICS_GATE_SPLIT_VERSION}`,
    model:
      "Read-only v78 release-semantics split between local product verification and strict Horizons scientific certification",
    metric: `product ${summary.productReleaseGateStatus}; strict Horizons ${summary.scientificHorizonsGateStatus}`,
    error:
      `Strict Horizons scientific certification remains ${summary.scientificHorizonsGateStatus}: ${summary.strictHorizonsFailureMeasured}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasPhysicsGateSplitSummary",
        "createAtlasHorizonsGateAuditSummary",
        "package.json verify:atlas:full",
        "package.json verify:atlas:scientific",
        ATLAS_PHYSICS_GATE_SPLIT_VERSION,
      ],
      method:
        "Expose product verification and strict Horizons scientific certification as separate local gates while preserving the v75 strict budgets.",
      metrics: [
        metric("split-version", "Split version", summary.version, claim.status),
        metric("split-profile", "Split profile", summary.gateSplitProfile, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("scientific-classification", "Scientific classification", summary.scientificFailureClassification, claim.status),
        metric("strict-horizons-failure", "Strict Horizons failure", summary.strictHorizonsFailureMeasured, claim.status),
        metric("strict-horizons-threshold", "Strict Horizons threshold", summary.strictHorizonsThreshold, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The split is deterministic release metadata only; strict Horizons remains a separate failing scientific gate.",
      assumptions: [
        "Product verification means local build, fast atlas tests and browser acceptance pass.",
        "Strict Horizons scientific certification remains blocked until the ephemeris model is upgraded.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, relax Horizons budgets, mutate physics, mutate sky or change v76 visual readiness.",
        "Does not make the strict Horizons scientific gate pass.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function releaseReadinessDocumentationClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasReleaseReadinessSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "release-readiness-documentation",
    group: "release-readiness-documentation",
    title: "Release Readiness Documentation",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Release Readiness ${ATLAS_RELEASE_READINESS_VERSION}`,
    model:
      "Read-only v79 documentation and DOM contract for product-ready versus strict scientific certification gate semantics",
    metric: `${summary.releaseSemantics}; product ${summary.productReleaseGateStatus}; strict Horizons ${summary.scientificHorizonsGateStatus}`,
    error:
      `Strict Horizons remains a scientific certification blocker only: ${summary.knownScientificBlocker}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasReleaseReadinessSummary",
        "createAtlasPhysicsGateSplitSummary",
        "README.md release gate commands",
        "docs/TECHNICAL_OVERVIEW.md gate semantics",
        ATLAS_RELEASE_READINESS_VERSION,
      ],
      method:
        "Document and expose the v78 gate split as a v79 readiness contract so product full verification, strict Horizons scientific certification and known blocker wording remain synchronized.",
      metrics: [
        metric("readiness-version", "Readiness version", summary.version, claim.status),
        metric("readiness-profile", "Readiness profile", summary.readinessProfile, claim.status),
        metric("release-semantics", "Release semantics", summary.releaseSemantics, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("documentation-scope", "Documentation scope", summary.documentationScope, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The claim is deterministic release metadata and documentation alignment; it does not run or certify latest commands inside the app.",
      assumptions: [
        "Product-ready means the local product verification command set passes outside the runtime UI.",
        "Strict Horizons scientific certification remains blocked until a future physics-model upgrade resolves the v75 budget failure.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, latest CI status, scientific certification, threshold relaxation, online validation or full numerical relativity.",
        "Does not mutate physics, sky assets, background direction, materials, v75 budgets or the Kerr kernel.",
      ],
      relatedViews: ["evidence-ledger", "relativity-observables"],
    }),
  );
}


export function scientificGatePreflightClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasScientificGatePreflightSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-preflight",
    group: "scientific-gate-preflight",
    title: "Scientific Horizons Closure Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Preflight ${ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION}`,
    model:
      "Read-only v80 roadmap contract for closing the strict Horizons scientific certification blocker without relaxing budgets",
    metric: `${summary.status}; ${summary.candidatePathCount} candidate paths`,
    error:
      `Strict Horizons remains blocked before a future model upgrade: ${summary.knownScientificBlocker}`,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasScientificGatePreflightSummary",
        "createAtlasReleaseReadinessSummary",
        "createAtlasPhysicsGateSplitSummary",
        "createAtlasHorizonsGateAuditSummary",
        ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
      ],
      method:
        "Expose the current strict Horizons blocker and three non-applied upgrade paths as a deterministic preflight contract for future physics work.",
      metrics: [
        metric("preflight-version", "Preflight version", summary.version, claim.status),
        metric("preflight-profile", "Preflight profile", summary.preflightProfile, claim.status),
        metric("preflight-status", "Preflight status", summary.status, claim.status),
        metric("product-release-gate", "Product release gate", summary.productReleaseGateStatus, "ready"),
        metric("scientific-horizons-gate", "Scientific Horizons gate", summary.scientificHorizonsGateStatus, claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("candidate-path-count", "Candidate path count", String(summary.candidatePathCount), claim.status),
        metric("candidate-paths", "Candidate paths", summary.candidatePaths.map((path) => path.id).join(", "), claim.status),
        metric("strict-horizons-command", "Strict Horizons command", summary.strictHorizonsCommand, claim.status),
        metric("product-full-command", "Product full command", summary.productFullCommand, claim.status),
        metric("scientific-full-command", "Scientific full command", summary.scientificFullCommand, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "The preflight is deterministic roadmap metadata only; every candidate path remains explicitly not applied.",
      assumptions: [
        "Future strict gate closure should start from initial-state, force-model or integrator upgrades rather than threshold changes.",
        "Product release semantics remain owned by v78/v79 and are not changed by this preflight.",
      ],
      limitations: [
        "Does not claim NASA/JPL precision, close the strict Horizons gate, relax v75 budgets, mutate physics, mutate sky or mutate materials.",
        "Does not choose which candidate path a future implementation must execute first.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function horizonsResidualDecompositionClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasHorizonsResidualDecompositionSummary(
    diagnostics?.relativityValidation.horizons ?? null,
  );
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-residual-decomposition",
    group: "horizons-residual-decomposition",
    title: "Horizons RTN Residual Decomposition",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Residual Decomposition ${ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION}`,
    model:
      "Read-only per-body radial, transverse and normal attribution over the existing offline Horizons comparison run",
    metric: `${summary.status}; ${summary.residualRowCount} RTN rows; dominant ${summary.dominantBodyId || "pending"}`,
    error: summary.knownScientificBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runHorizonsValidationDataset",
        "compareStateToHorizonsCheckpoint",
        "createHorizonsOrbitalResidual",
        "createAtlasHorizonsResidualDecompositionSummary",
        ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
      ],
      method:
        "Project each finite non-Sun position and velocity residual onto the reference Horizons RTN basis, then attribute squared-error contribution per mode and checkpoint without rerunning or changing the integrator.",
      metrics: [
        metric("decomposition-version", "Decomposition version", summary.version, claim.status),
        metric("decomposition-profile", "Decomposition profile", summary.decompositionProfile, claim.status),
        metric("decomposition-status", "Decomposition status", summary.status, claim.status),
        metric("source-audit-status", "Source audit status", summary.sourceAuditStatus, claim.status),
        metric("reference-frame", "Reference frame", summary.referenceFrame, claim.status),
        metric("contribution-scope", "Contribution scope", summary.contributionScope, claim.status),
        metric("mode-count", "Mode count", String(summary.modeCount), claim.status),
        metric("checkpoint-count", "Checkpoint count", String(summary.checkpointCount), claim.status),
        metric("body-count", "Decomposable body count", String(summary.decomposableBodyCount), claim.status),
        metric("residual-row-count", "Residual row count", String(summary.residualRowCount), claim.status),
        metric("dominant-body", "1PN +10y dominant position body", summary.dominantBodyId || "pending", claim.status),
        metric("known-scientific-blocker", "Known scientific blocker", summary.knownScientificBlocker, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
      ],
      confidenceRationale:
        "RTN components reconstruct the existing scalar residual norms and contribution fractions are normalized within each finite non-Sun checkpoint group.",
      assumptions: [
        "The reference RTN basis is defined by the Sun-centered Horizons position and velocity at each checkpoint.",
        "A dominant component is an attribution signal, not proof of a force-model, epoch or integration root cause.",
      ],
      limitations: [
        "Does not relax v75 budgets, close the strict scientific gate, mutate physics, change product gate semantics or claim NASA/JPL certification.",
        "Sun is excluded because a Sun-centered RTN basis is degenerate at the origin.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function horizonsCandidateLabClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsCandidateLabSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-candidate-lab",
    group: "horizons-candidate-lab",
    title: "Horizons Dynamical Parameter Candidate Lab",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Candidate Lab ${ATLAS_HORIZONS_CANDIDATE_LAB_VERSION}`,
    model:
      "Non-applied v82 candidate matrix for DE440 GM, softening, timestep and hierarchy-aligned Horizons references",
    metric: `${summary.status}; ${summary.completedCandidateCount}/${summary.candidateCount} candidate rows complete`,
    error: summary.strictGateBaselineMeasured,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsCandidateMatrix",
        "runHorizonsValidationDataset",
        "JPL SSD Astrodynamic Parameters DE440",
        "JPL Horizons system barycenter candidate fixture",
        ATLAS_HORIZONS_CANDIDATE_LAB_VERSION,
      ],
      method:
        "Define five offline candidate rows for solar GM, softening, half-step integration and system-barycenter hierarchy references, while keeping every candidate explicitly not applied to the strict gate or runtime physics.",
      metrics: [
        metric("candidate-lab-version", "Candidate lab version", summary.version, claim.status),
        metric("candidate-profile", "Candidate profile", summary.candidateProfile, claim.status),
        metric("candidate-status", "Candidate status", summary.status, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-position-candidate", "Best position candidate", summary.bestPositionCandidateId || "pending", claim.status),
        metric("best-velocity-candidate", "Best velocity candidate", summary.bestVelocityCandidateId || "pending", claim.status),
        metric("strict-baseline", "Strict baseline", summary.strictGateBaselineMeasured, claim.status),
        metric("strict-default-mutation", "Strict default mutation", summary.strictGateDefaultMutation, claim.status),
        metric("candidate-mutation", "Candidate mutation", summary.candidateMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The lab is deterministic candidate metadata until the separate candidate command is run; no row is treated as applied or certified by the runtime UI.",
      assumptions: [
        "Strict v75 Horizons remains the scientific gate until a future version intentionally applies a proven candidate.",
        "Barycenter candidate data is stored separately from the v75 center-reference fixture.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or the product/scientific gate split.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function plutoResidualIsolationClaim(): EvidenceClaim {
  const summary = createAtlasPlutoResidualIsolationSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "pluto-residual-isolation",
    group: "pluto-residual-isolation",
    title: "Pluto Residual Cause Isolation",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Pluto Residual Isolation ${ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION}`,
    model:
      "Non-applied v83 outer-system candidate matrix for Pluto-dominated Horizons residual attribution",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasPlutoResidualIsolationMatrix",
        "runHorizonsValidationDataset",
        "v82 candidate lab rows",
        "v81 RTN residual frame",
        ATLAS_PLUTO_RESIDUAL_ISOLATION_VERSION,
      ],
      method:
        "Run targeted offline half-step, quarter-step, center-reference and hierarchy-reference candidates, then isolate Pluto +10y RTN residuals and the aggregate RMS after excluding Pluto without applying any candidate to runtime physics.",
      metrics: [
        metric("pluto-isolation-version", "Pluto isolation version", summary.version, claim.status),
        metric("pluto-isolation-profile", "Pluto isolation profile", summary.isolationProfile, claim.status),
        metric("pluto-isolation-status", "Pluto isolation status", summary.status, claim.status),
        metric("pluto-isolation-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("baseline-pluto-candidate", "Baseline Pluto candidate", summary.baselinePlutoPlus10y.candidateId || "pending", claim.status),
        metric("best-pluto-candidate", "Best Pluto candidate", summary.bestCandidatePlutoPlus10y.candidateId || "pending", claim.status),
        metric("dominant-rtn-component", "Dominant RTN component", summary.dominantRtnComponent, claim.status),
        metric("strict-blocker", "Strict blocker", summary.strictBlocker, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured rows are produced by the separate heavy v83 command and remain non-applied.",
      assumptions: [
        "The v82 velocity improvement does not imply the strict position RMS gate is closed.",
        "Pluto RTN component dominance is attribution only, not a proven root cause.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function outerSystemForceModelPreflightClaim(): EvidenceClaim {
  const summary = createAtlasOuterSystemForceModelPreflightSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "outer-system-force-model-preflight",
    group: "outer-system-force-model-preflight",
    title: "Outer-System Force Model Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Outer-System Force Model Preflight ${ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION}`,
    model:
      "Non-applied v84 fixture provenance and Pluto / outer-system force-model upgrade-path preflight",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "auditOuterSystemFixtureProvenance",
        "runAtlasOuterSystemForceModelPreflightMatrix",
        "v84 outer-system barycenter Horizons fixture",
        "v83 Pluto residual isolation",
        ATLAS_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_VERSION,
      ],
      method:
        "Audit whether a candidate fixture has explicit target provenance and nonzero outer-system deltas before interpreting Pluto barycenter, outer-planet system GM or missing-perturber candidate rows.",
      metrics: [
        metric("outer-system-preflight-version", "Preflight version", summary.version, claim.status),
        metric("outer-system-preflight-profile", "Preflight profile", summary.preflightProfile, claim.status),
        metric("outer-system-preflight-status", "Preflight status", summary.status, claim.status),
        metric("outer-system-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-blocker", "Strict blocker", summary.strictBlocker, claim.status),
        metric("fixture-provenance-mutation", "Fixture provenance mutation", summary.fixtureProvenanceMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured fixture audits and candidate rows are produced by the separate heavy v84 command and remain non-applied.",
      assumptions: [
        "Corrected barycenter fixture provenance must be established before force-model conclusions are trusted.",
        "The strict v75 scientific gate remains blocked until a future applied model actually meets the v75 budgets.",
      ],
      limitations: [
        "Does not relax v75 budgets, close scientific certification, claim NASA/JPL precision or mutate runtime physics.",
        "Does not modify backgrounds, V9 sky assets, materials, Kerr, worker physics or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function outerSystemReferenceAdoptionClaim(): EvidenceClaim {
  const summary = createAtlasOuterSystemReferenceAdoptionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "outer-system-reference-adoption",
    group: "outer-system-reference-adoption",
    title: "Outer-System Reference Adoption Preflight",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Outer-System Reference Adoption ${ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION}`,
    model:
      "Non-applied v85 adoption-readiness preflight for the v84 outer-system barycenter fixture plus DE440 system GM candidate path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasOuterSystemReferenceAdoptionPreflight",
        "v84 outer-system barycenter Horizons fixture",
        "DE440 system GM candidate path",
        "v75 strict fixture lock audit",
        ATLAS_OUTER_SYSTEM_REFERENCE_ADOPTION_VERSION,
      ],
      method:
        "Audit whether the existing v84 reference fixture plus DE440 system GM can satisfy the v75 numerical budgets as a candidate-only adoption path while keeping the default strict gate unmigrated.",
      metrics: [
        metric("outer-system-reference-adoption-version", "Adoption version", summary.version, claim.status),
        metric("outer-system-reference-adoption-profile", "Adoption profile", summary.adoptionProfile, claim.status),
        metric("outer-system-reference-adoption-status", "Adoption status", summary.status, claim.status),
        metric("outer-system-reference-adoption-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured lock audits and candidate rows are produced by the separate heavy v85 command and remain non-applied.",
      assumptions: [
        "The v84 fixture is reused as-is; v85 does not regenerate or overwrite Horizons validation data.",
        "A passing candidate row is migration evidence only and does not change the default strict scientific gate.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function horizonsCandidateScientificGateClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsCandidateScientificGateSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-candidate-scientific-gate",
    group: "horizons-candidate-scientific-gate",
    title: "Horizons Candidate Scientific Gate",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Candidate Scientific Gate ${ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION}`,
    model:
      "Non-applied v86 candidate scientific gate for the v85 barycentric reference adoption path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedCandidateCount}/${summary.candidateCount} rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsCandidateScientificGatePreflight",
        "runAtlasOuterSystemReferenceAdoptionPreflight",
        "v84 outer-system barycenter Horizons fixture",
        "DE440 system GM candidate path",
        "v75 strict scientific gate lock audit",
        ATLAS_HORIZONS_CANDIDATE_SCIENTIFIC_GATE_VERSION,
      ],
      method:
        "Promote the v85 adoption evidence into a separate candidate scientific gate proof while keeping the default strict Horizons gate unmigrated and expected-failing.",
      metrics: [
        metric("horizons-candidate-scientific-gate-version", "Candidate gate version", summary.version, claim.status),
        metric("horizons-candidate-scientific-gate-profile", "Candidate gate profile", summary.candidateGateProfile, claim.status),
        metric("horizons-candidate-scientific-gate-status", "Candidate gate status", summary.status, claim.status),
        metric("horizons-candidate-scientific-gate-classification", "Classification", summary.classification, claim.status),
        metric("candidate-count", "Candidate count", String(summary.candidateCount), claim.status),
        metric("completed-candidate-count", "Completed candidate count", String(summary.completedCandidateCount), claim.status),
        metric("best-candidate", "Best candidate", summary.bestCandidateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured candidate gate rows are produced by the separate heavy v86 command and remain non-applied.",
      assumptions: [
        "The v85 adoption runner remains the single source for candidate numerical evidence.",
        "The default strict scientific gate remains blocked until a later explicit migration changes the default reference path.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function strictHorizonsMigrationDryRunClaim(): EvidenceClaim {
  const summary = createAtlasStrictHorizonsMigrationDryRunSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "strict-horizons-migration-dry-run",
    group: "strict-horizons-migration-dry-run",
    title: "Strict Horizons Migration Dry-Run Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Strict Horizons Migration Dry-Run ${ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION}`,
    model:
      "Non-applied v87 default-gate migration diff audit for the v86 passing candidate path",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedMigrationDiffCount}/${summary.migrationDiffCount} diffs complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasStrictHorizonsMigrationDryRunAudit",
        "runAtlasHorizonsCandidateScientificGatePreflight",
        "v86 passing candidate gate",
        "v75 strict fixture and command lock",
        "v84 outer-system barycenter candidate fixture",
        ATLAS_STRICT_HORIZONS_MIGRATION_DRY_RUN_VERSION,
      ],
      method:
        "Create a dry-run migration manifest that records the exact future strict-gate fixture/model/command diff while keeping the default strict gate unmigrated and expected-failing.",
      metrics: [
        metric("strict-horizons-migration-dry-run-version", "Dry-run version", summary.version, claim.status),
        metric("strict-horizons-migration-dry-run-profile", "Dry-run profile", summary.migrationProfile, claim.status),
        metric("strict-horizons-migration-dry-run-status", "Dry-run status", summary.status, claim.status),
        metric("strict-horizons-migration-dry-run-classification", "Classification", summary.classification, claim.status),
        metric("migration-diff-count", "Migration diff count", String(summary.migrationDiffCount), claim.status),
        metric("completed-migration-diff-count", "Completed migration diff count", String(summary.completedMigrationDiffCount), claim.status),
        metric("ready-migration-diff", "Ready migration diff", summary.readyMigrationDiffId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-strict-command-mutation", "Default strict command mutation", summary.defaultStrictCommandMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("migration-docs-mutation", "Migration docs mutation", summary.migrationDocsMutation, claim.status),
        metric("migration-screenshots-mutation", "Migration screenshots mutation", summary.migrationScreenshotsMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured dry-run migration diffs are produced by the separate heavy v87 command and remain non-applied.",
      assumptions: [
        "The v86 candidate gate remains the source of candidate readiness evidence.",
        "The default strict scientific gate remains blocked until a later version intentionally edits the default command/config.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets, screenshots or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function strictHorizonsShadowMigrationGateClaim(): EvidenceClaim {
  const summary = createAtlasStrictHorizonsShadowMigrationGateSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "strict-horizons-shadow-migration-gate",
    group: "strict-horizons-shadow-migration-gate",
    title: "Strict Horizons Shadow Migration Gate",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Strict Horizons Shadow Migration Gate ${ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION}`,
    model:
      "Non-applied v88 parallel strict-gate rehearsal over the v87 migration dry-run manifest",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedShadowGateCount}/${summary.shadowGateCount} shadow rows complete`,
    error: summary.strictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasStrictHorizonsShadowMigrationGateAudit",
        "runAtlasStrictHorizonsMigrationDryRunAudit",
        "v87 complete migration diff",
        "v84 outer-system barycenter candidate fixture",
        "DE440 system GM candidate path",
        "separate shadow Horizons command",
        ATLAS_STRICT_HORIZONS_SHADOW_MIGRATION_VERSION,
      ],
      method:
        "Run the future strict-gate fixture/model contract as a separate shadow gate while keeping the default strict Horizons command unmigrated and expected-failing.",
      metrics: [
        metric("strict-horizons-shadow-migration-gate-version", "Shadow gate version", summary.version, claim.status),
        metric("strict-horizons-shadow-migration-gate-profile", "Shadow gate profile", summary.shadowGateProfile, claim.status),
        metric("strict-horizons-shadow-migration-gate-status", "Shadow gate status", summary.status, claim.status),
        metric("strict-horizons-shadow-migration-gate-classification", "Classification", summary.classification, claim.status),
        metric("shadow-gate-count", "Shadow gate count", String(summary.shadowGateCount), claim.status),
        metric("completed-shadow-gate-count", "Completed shadow gate count", String(summary.completedShadowGateCount), claim.status),
        metric("ready-shadow-gate", "Ready shadow gate", summary.readyShadowGateId || "pending", claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-strict-fixture-mutation", "Default strict fixture mutation", summary.defaultStrictFixtureMutation, claim.status),
        metric("default-strict-command-mutation", "Default strict command mutation", summary.defaultStrictCommandMutation, claim.status),
        metric("shadow-gate-command-mutation", "Shadow gate command mutation", summary.shadowGateCommandMutation, claim.status),
        metric("default-scientific-gate-mutation", "Default scientific gate mutation", summary.defaultScientificGateMutation, claim.status),
        metric("reference-fixture-adoption-mutation", "Reference fixture adoption mutation", summary.referenceFixtureAdoptionMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured shadow gate rows are produced by the separate heavy v88 command and remain non-applied.",
      assumptions: [
        "The v87 migration dry-run remains the source of the candidate fixture/model/command diff.",
        "The default strict scientific gate remains blocked until a later version intentionally edits the default command/config.",
      ],
      limitations: [
        "Does not relax v75 budgets, replace the v75 strict fixture, close scientific certification or claim NASA/JPL precision.",
        "Does not modify live physics, worker physics, RK4 defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product/scientific gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function defaultStrictHorizonsMigrationClaim(): EvidenceClaim {
  const summary = createAtlasDefaultStrictHorizonsMigrationSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "default-strict-horizons-migration",
    group: "default-strict-horizons-migration",
    title: "Default Strict Horizons Scientific Gate Migration",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Default Strict Horizons Migration ${ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION}`,
    model:
      "Applied v89 offline scientific-gate migration from the v88 shadow path to the default strict Horizons command",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedMigrationRowCount}/${summary.migrationRowCount} migration rows complete`,
    error: summary.legacyStrictBlocker,
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasDefaultStrictHorizonsMigrationAudit",
        "runAtlasStrictHorizonsShadowMigrationGateAudit",
        "v88 passing shadow gate",
        "v84 outer-system barycenter candidate fixture",
        "legacy v75 blocker audit command",
        ATLAS_DEFAULT_STRICT_HORIZONS_MIGRATION_VERSION,
      ],
      method:
        "Apply the shadow-proven barycentric fixture/model path to the default offline strict scientific gate while retaining a legacy v75 blocker audit command.",
      metrics: [
        metric("default-strict-horizons-migration-version", "Migration version", summary.version, claim.status),
        metric("default-strict-horizons-migration-profile", "Migration profile", summary.migrationProfile, claim.status),
        metric("default-strict-horizons-migration-status", "Migration status", summary.status, claim.status),
        metric("default-strict-horizons-migration-classification", "Classification", summary.classification, claim.status),
        metric("migration-row-count", "Migration row count", String(summary.migrationRowCount), claim.status),
        metric("completed-migration-row-count", "Completed migration row count", String(summary.completedMigrationRowCount), claim.status),
        metric("ready-migration-row", "Ready migration row", summary.readyMigrationRowId || "pending", claim.status),
        metric("default-scientific-gate-migration", "Default scientific gate migration", summary.defaultScientificGateMigration, claim.status),
        metric("legacy-v75-audit-mutation", "Legacy v75 audit mutation", summary.legacyV75AuditMutation, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured migration rows are produced by the separate heavy v89 command.",
      assumptions: [
        "The default scientific gate command is intentionally migrated in v89.",
        "The legacy v75 command remains available as rollback and blocker-preservation evidence.",
      ],
      limitations: [
        "Does not relax v75 budgets, mutate live runtime physics, or claim NASA/JPL precision certification.",
        "Does not modify worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function horizonsProvenanceFreezeClaim(): EvidenceClaim {
  const summary = createAtlasHorizonsProvenanceFreezeSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "horizons-provenance-freeze",
    group: "horizons-provenance-freeze",
    title: "Horizons Provenance Freeze",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Horizons Provenance Freeze ${ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION}`,
    model:
      "Freeze v90 command ownership, fixture hashes, v75 budgets, legacy blocker evidence and offline-only migration boundary",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedFreezeRowCount}/${summary.freezeRowCount} freeze rows complete`,
    error:
      "No runtime pass/fail is claimed by the app; measured hash and command locks are produced by the separate heavy v90 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasHorizonsProvenanceFreezeAudit",
        "runAtlasDefaultStrictHorizonsMigrationAudit",
        "v89 migrated default strict gate",
        "v84 outer-system barycenter fixture hash",
        "legacy v75 blocker fixture hash",
        ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
      ],
      method:
        "Lock the migrated offline strict Horizons gate contract by auditing scripts, fixture hashes, fixture provenance, v75 budgets, legacy blocker preservation and documentation boundary text.",
      metrics: [
        metric("horizons-provenance-freeze-version", "Freeze version", summary.version, claim.status),
        metric("horizons-provenance-freeze-profile", "Freeze profile", summary.freezeProfile, claim.status),
        metric("horizons-provenance-freeze-status", "Freeze status", summary.status, claim.status),
        metric("horizons-provenance-freeze-classification", "Classification", summary.classification, claim.status),
        metric("freeze-row-count", "Freeze row count", String(summary.freezeRowCount), claim.status),
        metric("completed-freeze-row-count", "Completed freeze row count", String(summary.completedFreezeRowCount), claim.status),
        metric("ready-freeze-row", "Ready freeze row", summary.readyFreezeRowId || "pending", claim.status),
        metric("provenance-freeze", "Provenance freeze", summary.provenanceFreeze, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("legacy-audit-mutation", "Legacy audit mutation", summary.legacyAuditMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured hash, script and docs locks are produced by the separate heavy v90 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "The v84 and legacy v75 fixture files are immutable unless a later version updates the frozen hash contract.",
      ],
      limitations: [
        "Does not regenerate Horizons fixture data, relax v75 budgets, mutate live runtime physics, or claim NASA/JPL precision certification.",
        "Does not modify worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, V9 sky assets or product gate semantics.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function offlineRuntimeBoundaryAuditClaim(): EvidenceClaim {
  const summary = createAtlasOfflineRuntimeBoundaryAuditSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "offline-runtime-boundary-audit",
    group: "offline-runtime-boundary-audit",
    title: "Offline vs Runtime Boundary Audit",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Offline Runtime Boundary Audit ${ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION}`,
    model:
      "Lock the migrated offline strict Horizons gate boundary away from live runtime physics, worker physics, RK4/EIH/Kerr and NASA/JPL certification claims",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedBoundaryRowCount}/${summary.boundaryRowCount} boundary rows complete`,
    error:
      "No runtime command status is claimed by the app; measured surface and docs locks are produced by the separate heavy v91 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v90 provenance freeze",
        "v89 migrated default strict gate",
        "Evidence Ledger and Validation Console boundary surfaces",
        ATLAS_OFFLINE_RUNTIME_BOUNDARY_AUDIT_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, protected mutation flags and certification boundary language.",
      metrics: [
        metric("offline-runtime-boundary-audit-version", "Boundary audit version", summary.version, claim.status),
        metric("offline-runtime-boundary-audit-profile", "Boundary audit profile", summary.boundaryProfile, claim.status),
        metric("offline-runtime-boundary-audit-status", "Boundary audit status", summary.status, claim.status),
        metric("offline-runtime-boundary-audit-classification", "Classification", summary.classification, claim.status),
        metric("boundary-row-count", "Boundary row count", String(summary.boundaryRowCount), claim.status),
        metric("completed-boundary-row-count", "Completed boundary row count", String(summary.completedBoundaryRowCount), claim.status),
        metric("ready-boundary-row", "Ready boundary row", summary.readyBoundaryRowId || "pending", claim.status),
        metric("offline-runtime-boundary-audit", "Offline/runtime boundary audit", summary.offlineRuntimeBoundaryAudit, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured command, docs and surface locks are produced by the separate heavy v91 command.",
      assumptions: [
        "v89/v90 define the default offline strict scientific gate state.",
        "Runtime physics remains unchanged unless a later version explicitly migrates live physics with separate tests.",
      ],
      limitations: [
        "Does not mutate live runtime physics, worker physics, RK4, EIH 1PN, Kerr, sky, backgrounds, materials, fixtures or budgets.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function scientificGateMaintenanceRunbookClaim(): EvidenceClaim {
  const summary = createAtlasScientificGateMaintenanceRunbookSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-maintenance-runbook",
    group: "scientific-gate-maintenance-runbook",
    title: "Scientific Gate Maintenance Runbook",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Maintenance Runbook ${ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION}`,
    model:
      "Lock the migrated offline strict Horizons gate maintenance commands, release verification, rollback audit and failure-handling boundaries",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedRunbookRowCount}/${summary.runbookRowCount} runbook rows complete`,
    error:
      "No runtime command result is claimed by the app; measured command, docs, rollback and surface locks are produced by the separate heavy v92 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasScientificGateMaintenanceRunbookAudit",
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v89 migrated default strict gate",
        "legacy v75 rollback/blocker audit command",
        ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, rollback-contract language and protected mutation flags.",
      metrics: [
        metric("scientific-gate-runbook-version", "Runbook version", summary.version, claim.status),
        metric("scientific-gate-runbook-profile", "Runbook profile", summary.runbookProfile, claim.status),
        metric("scientific-gate-runbook-status", "Runbook status", summary.status, claim.status),
        metric("scientific-gate-runbook-classification", "Classification", summary.classification, claim.status),
        metric("runbook-row-count", "Runbook row count", String(summary.runbookRowCount), claim.status),
        metric("completed-runbook-row-count", "Completed runbook row count", String(summary.completedRunbookRowCount), claim.status),
        metric("ready-runbook-row", "Ready runbook row", summary.readyRunbookRowId || "pending", claim.status),
        metric("scientific-gate-maintenance-runbook", "Scientific gate maintenance runbook", summary.scientificGateMaintenanceRunbook, claim.status),
        metric("migrated-default-fixture", "Migrated default fixture", summary.migratedDefaultFixturePath, claim.status),
        metric("legacy-v75-fixture", "Legacy v75 fixture", summary.legacyV75FixturePath, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured command, rollback and docs locks are produced by the separate heavy v92 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "The legacy v75 command remains rollback/blocker evidence only.",
      ],
      limitations: [
        "Does not introduce a new scientific model, reconfigure the default gate, mutate live runtime physics, or regenerate fixtures.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function scientificGateReleaseEvidenceClaim(): EvidenceClaim {
  const summary = createAtlasScientificGateReleaseEvidenceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-gate-release-evidence",
    group: "scientific-gate-release-evidence",
    title: "Scientific Gate Release Evidence",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Gate Release Evidence ${ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION}`,
    model:
      "Lock the release evidence bundle for the migrated offline strict Horizons gate, fixture freeze, runtime boundary and maintenance runbook",
    metric: `${summary.status}; ${summary.classification}; ${summary.completedReleaseEvidenceRowCount}/${summary.releaseEvidenceRowCount} release evidence rows complete`,
    error:
      "No runtime command result is claimed by the app; measured release evidence, command matrix, fixture, docs and surface locks are produced by the separate heavy v93 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasScientificGateReleaseEvidenceAudit",
        "runAtlasScientificGateMaintenanceRunbookAudit",
        "runAtlasOfflineRuntimeBoundaryAudit",
        "runAtlasHorizonsProvenanceFreezeAudit",
        "v89 migrated default strict gate",
        "legacy v75 rollback/blocker audit command",
        ATLAS_SCIENTIFIC_GATE_RELEASE_EVIDENCE_VERSION,
      ],
      method:
        "Audit package commands, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, fixture evidence, release screenshot contract and protected mutation flags.",
      metrics: [
        metric("scientific-gate-release-evidence-version", "Release evidence version", summary.version, claim.status),
        metric("scientific-gate-release-evidence-profile", "Release evidence profile", summary.releaseEvidenceProfile, claim.status),
        metric("scientific-gate-release-evidence-status", "Release evidence status", summary.status, claim.status),
        metric("scientific-gate-release-evidence-classification", "Classification", summary.classification, claim.status),
        metric("release-evidence-row-count", "Release evidence row count", String(summary.releaseEvidenceRowCount), claim.status),
        metric("completed-release-evidence-row-count", "Completed release evidence row count", String(summary.completedReleaseEvidenceRowCount), claim.status),
        metric("ready-release-evidence-row", "Ready release evidence row", summary.readyReleaseEvidenceRowId || "pending", claim.status),
        metric("scientific-gate-release-evidence", "Scientific gate release evidence", summary.scientificGateReleaseEvidence, claim.status),
        metric("migrated-default-fixture", "Migrated default fixture", summary.migratedDefaultFixturePath, claim.status),
        metric("legacy-v75-fixture", "Legacy v75 fixture", summary.legacyV75FixturePath, claim.status),
        metric("migrated-fixture-sha256", "Migrated fixture SHA256", summary.migratedFixtureSha256, claim.status),
        metric("legacy-fixture-sha256", "Legacy fixture SHA256", summary.legacyFixtureSha256, claim.status),
        metric("strict-position-budget", "Strict position budget", `${summary.strictBudgetPositionRmsKm} km`, claim.status),
        metric("strict-velocity-budget", "Strict velocity budget", `${summary.strictBudgetVelocityRmsMs} m/s`, claim.status),
        metric("strict-mercury-ratio-budget", "Strict Mercury ratio budget", String(summary.strictBudgetMercuryRatio), claim.status),
        metric("default-gate-config-mutation", "Default gate config mutation", summary.defaultGateConfigMutation, claim.status),
        metric("legacy-audit-config-mutation", "Legacy audit config mutation", summary.legacyAuditConfigMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("material-mutation", "Material mutation", summary.materialMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "The runtime ledger reports deterministic pending metadata; measured release evidence, command, fixture, docs and surface locks are produced by the separate heavy v93 command.",
      assumptions: [
        "v89 is the intentional migration point for the default offline scientific gate.",
        "v90 freezes fixture and command provenance; v91 locks offline/runtime wording; v92 locks the maintenance runbook.",
        "The legacy v75 command remains rollback/blocker evidence only.",
      ],
      limitations: [
        "Does not introduce a new scientific model, reconfigure the default gate, mutate live runtime physics, or regenerate fixtures.",
        "Does not claim NASA/JPL certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function scientificModelUpgradeContractClaim(): EvidenceClaim {
  const summary = createAtlasScientificModelUpgradeContractSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "scientific-model-upgrade-contract",
    group: "scientific-model-upgrade-contract",
    title: "Scientific Model Upgrade Contract",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Scientific Model Upgrade Contract ${ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION}`,
    model:
      "Fixture, error-budget, comparison-matrix and rollback contract required before future core physics upgrades",
    metric: `${summary.status}; ${summary.scientificUpgradePolicy}; ${summary.fixturePolicy}; ${summary.rollbackPolicy}`,
    error:
      "This is contract-only planning; no core physics change is claimed or applied.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "createAtlasScientificModelUpgradeContractSummary",
        ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
      ],
      method:
        "Define mandatory fixtures, error budgets, comparison matrix and rollback conditions before any future scientific core mutation.",
      metrics: [
        metric("scientific-upgrade-contract-version", "Version", summary.version, claim.status),
        metric("scientific-upgrade-policy", "Upgrade policy", summary.scientificUpgradePolicy, claim.status),
        metric("fixture-policy", "Fixtures", summary.fixturePolicy, claim.status),
        metric("error-budget-policy", "Error budgets", summary.errorBudgetPolicy, claim.status),
        metric("rollback-policy", "Rollback", summary.rollbackPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic contract metadata; it deliberately leaves runtime physics unchanged.",
      assumptions: [
        "Future scientific work must pass this contract before core model changes are attempted.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN or Kerr mutation in v113.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function solarEihClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const status = mapHorizonsStatus(diagnostics?.horizonsValidationStatus);
  const initialEpochRmsPosition =
    diagnostics?.horizonsInitialEpochRmsPositionKm ?? diagnostics?.horizonsRmsPositionKm;
  const initialEpochRmsVelocity =
    diagnostics?.horizonsInitialEpochRmsVelocityMs ?? diagnostics?.horizonsRmsVelocityMs;
  const onePnMode = diagnostics?.relativityValidation.horizons.modes.find(
    (mode) => mode.mode === "1pn",
  );
  const rmsPosition =
    diagnostics?.horizonsLongTermOnePnRmsPositionKm ?? onePnMode?.rmsPositionKm;
  const rmsVelocity =
    diagnostics?.horizonsLongTermOnePnRmsVelocityMs ?? onePnMode?.rmsVelocityMs;
  const progress = diagnostics?.relativityValidation.horizons.progress;
  const claim: EvidenceClaimWithoutPassport = {
    id: "solar-eih-1pn-horizons",
    group: "solar-eih-1pn",
    title: "Solar EIH 1PN / JPL Horizons",
    status,
    confidence: mapRelativityConfidence(diagnostics?.relativityConfidence),
    source: diagnostics?.relativityValidation.horizons.source ?? "JPL Horizons offline reference",
    model: "Solar N-body live state with EIH 1PN weak-field correction",
    metric:
      rmsPosition != null || rmsVelocity != null
        ? `10-year 1PN Horizons RMS ${formatNumber(rmsPosition, 3, " km")} / ${formatNumber(rmsVelocity, 3, " m/s")}`
        : `Horizons validation ${diagnostics?.horizonsValidationStatus ?? "pending"}${
            progress != null ? ` (${Math.round(progress * 100)}%)` : ""
          }`,
    error:
      rmsPosition != null || rmsVelocity != null
        ? `Position ${formatNumber(rmsPosition, 3, " km")}; velocity ${formatNumber(rmsVelocity, 3, " m/s")}.`
        : diagnostics?.relativityValidation.horizons.error ??
          "Pending until the offline Horizons comparison is available.",
    boundary: "Solar-system weak-field dynamics only. It does not use or replace the Kerr strong-field lab.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        diagnostics?.relativityValidation.horizons.source ?? "JPL Horizons offline reference",
        "live solar-system N-body state",
        "EIH 1PN weak-field correction diagnostics",
      ],
      method:
        "Compare the live solar-system state using EIH 1PN weak-field dynamics against offline JPL Horizons checkpoints.",
      formulas: [
        formula(
          "eih-1pn",
          "EIH 1PN weak-field correction",
          "a = a_Newton + a_1PN/c^2",
          "body masses, barycentric positions, velocities, G, c",
          "Solar-system weak-field, slow-motion regime.",
        ),
      ],
      metrics: [
        metric("horizons-status", "Horizons status", diagnostics?.horizonsValidationStatus ?? "pending", status),
        metric("horizons-progress", "Comparison progress", progress != null ? `${Math.round(progress * 100)}%` : "unavailable", status),
        metric("rms-position", "10-year 1PN RMS position", formatNumber(rmsPosition, 3, " km"), status, undefined, "reported across +30d, +365d and +10y offline checkpoints"),
        metric("rms-velocity", "10-year 1PN RMS velocity", formatNumber(rmsVelocity, 3, " m/s"), status, undefined, "reported across +30d, +365d and +10y offline checkpoints"),
        metric("initial-epoch-rms-position", "Initial J2000 epoch RMS position", formatNumber(initialEpochRmsPosition, 3, " km"), "informational"),
        metric("initial-epoch-rms-velocity", "Initial J2000 epoch RMS velocity", formatNumber(initialEpochRmsVelocity, 3, " m/s"), "informational"),
        metric("relative-energy-drift", "Relative energy drift", formatNumber(diagnostics?.relEnergyDrift, 3), status),
      ],
      confidenceRationale:
        status === "ready"
          ? "Validated or Horizons-checked when the offline comparison is complete and the live diagnostics report RMS deltas."
          : "Pending or failed until the offline Horizons comparison finishes without error.",
      assumptions: [
        "Horizons checkpoints are treated as the external ephemeris reference.",
        "The main SolarSystemIntegrator remains the EIH 1PN solar-system dynamics path.",
      ],
      limitations: [
        "Applies to solar-system weak-field motion only.",
        "Does not model strong-field Kerr trajectories, spacecraft navigation products, or full ephemeris uncertainty.",
      ],
      relatedViews: ["telemetry", "orbit-analysis", "body-sidebar", "evidence-ledger"],
    }),
  );
}


export function weakFieldClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.relativityValidation;
  const status: EvidenceClaimStatus = validation ? "ready" : "pending";
  const claim: EvidenceClaimWithoutPassport = {
    id: "gr-weak-field-tests",
    group: "gr-weak-field",
    title: "GR weak-field analytic tests",
    status,
    confidence: validation ? "formula-checked" : "visual",
    source: "Analytic GR weak-field targets",
    model: "Mercury 1PN precession, solar-limb light deflection, Shapiro delay, time dilation",
    metric: validation
      ? [
          `Mercury ${formatNumber(validation.mercuryPrecession.onePnArcsecPerCentury, 3, " arcsec/century")}`,
          `light ${formatNumber(validation.lightDeflection.formulaArcsec, 4, " arcsec")}`,
          `Shapiro ${formatNumber(validation.shapiroDelay.microseconds, 3, " us")}`,
        ].join("; ")
      : "Weak-field diagnostics pending",
    error: validation
      ? [
          `Mercury ${formatNumber(validation.mercuryPrecession.errorPercent, 3, "%")}`,
          `light ${formatNumber(validation.lightDeflection.errorPercent, 3, "%")}`,
          `Shapiro ${formatNumber(validation.shapiroDelay.errorPercent, 3, "%")}`,
        ].join("; ")
      : "Pending until live diagnostics have sampled the current physics state.",
    boundary: "Analytic weak-field checks. Not full spacetime evolution or numerical relativity.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Analytic GR weak-field targets",
        "current relativity validation snapshot",
        "Orbit Analysis / Telemetry readouts",
      ],
      method:
        "Evaluate closed-form weak-field GR references against the current diagnostics without changing the solar-system integrator.",
      formulas: [
        formula(
          "mercury-1pn",
          "Mercury perihelion precession",
          "Delta omega = 6*pi*GM/(a*(1-e^2)*c^2)",
          "central mass M, semi-major axis a, eccentricity e, c",
          "Bound weak-field orbit around the Sun.",
        ),
        formula(
          "light-deflection",
          "Solar-limb light deflection",
          "alpha = 4GM/(c^2 b)",
          "solar mass M, impact parameter b, c",
          "Weak-field grazing-light approximation.",
        ),
        formula(
          "shapiro-delay",
          "Shapiro delay",
          "Delta t = 2GM/c^3 * ln((r1+r2+R)/(r1+r2-R))",
          "solar mass M, endpoint radii r1/r2, range R, c",
          "Weak-field radar/light-time path near the Sun.",
        ),
        formula(
          "time-dilation",
          "Weak-field clock rate",
          "d tau/dt ~= 1 + Phi/c^2 - v^2/(2c^2)",
          "Newtonian potential Phi, speed v, c",
          "Weak gravitational potential and slow motion.",
        ),
      ],
      metrics: [
        metric(
          "mercury-precession",
          "Mercury 1PN",
          formatNumber(validation?.mercuryPrecession.onePnArcsecPerCentury, 3, " arcsec/century"),
          status,
          formatNumber(validation?.mercuryPrecession.targetArcsecPerCentury, 3, " arcsec/century"),
          formatNumber(validation?.mercuryPrecession.errorPercent, 3, "%"),
        ),
        metric(
          "light-deflection",
          "Light deflection",
          formatNumber(validation?.lightDeflection.formulaArcsec, 4, " arcsec"),
          status,
          formatNumber(validation?.lightDeflection.targetArcsec, 4, " arcsec"),
          formatNumber(validation?.lightDeflection.errorPercent, 3, "%"),
        ),
        metric(
          "shapiro-delay",
          "Shapiro delay",
          formatNumber(validation?.shapiroDelay.microseconds, 3, " us"),
          validation?.shapiroDelay.status === "unavailable" ? "pending" : status,
          formatNumber(validation?.shapiroDelay.formulaMicroseconds, 3, " us"),
          formatNumber(validation?.shapiroDelay.errorPercent, 3, "%"),
        ),
        metric(
          "time-dilation",
          "Time dilation",
          formatNumber(validation?.timeDilation.gravitationalPlusKinematicUsPerDay, 3, " us/day"),
          validation?.timeDilation.status === "unavailable" ? "pending" : status,
        ),
      ],
      confidenceRationale:
        validation != null
          ? "Formula-checked: each value is generated from analytic weak-field expressions and current diagnostic state."
          : "Pending until the relativity validation summary is available.",
      assumptions: [
        "Weak-field approximations are valid for the displayed solar-system checks.",
        "The reported values are diagnostics, not a replacement for the EIH 1PN integration path.",
      ],
      limitations: [
        "No full spacetime evolution is attempted.",
        "These checks do not cover strong-field Kerr ray tracing or numerical relativity.",
      ],
      relatedViews: ["telemetry", "orbit-analysis", "body-sidebar", "evidence-ledger"],
    }),
  );
}


export function frwCosmologyClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.cosmologyValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const claim: EvidenceClaimWithoutPassport = {
    id: "frw-planck2018-lcdm",
    group: "frw-cosmology",
    title: "FRW Planck 2018 flat LCDM layer",
    status,
    confidence: "formula-checked",
    source: validation?.source === "planck-2018" ? "Planck 2018 TT,TE,EE+lowE+lensing base-LambdaCDM" : "Planck 2018 preset",
    model: "Analytic flat LCDM FRW distances and ages",
    metric: validation
      ? `H0 ${formatNumber(validation.params.h0KmSmpc, 3, " km/s/Mpc")}; age ${formatNumber(validation.ageNowGyr, 3, " Gyr")}; anchors ${validation.anchors.length}`
      : "FRW diagnostics pending",
    error: validation?.error ?? "Formula checks include monotonic distances and Etherington reciprocity anchors.",
    boundary: "Background cosmology validation layer. Not CMB Boltzmann physics or cosmological N-body structure formation.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        validation?.source === "planck-2018" ? "Planck 2018 base-LambdaCDM preset" : "Planck 2018 preset pending",
        "analytic flat LCDM FRW integrals",
        "cosmology validation telemetry",
      ],
      method:
        "Compute background FRW distances, ages, H(z), and reciprocity checks from a fixed Planck 2018 flat LCDM preset.",
      formulas: [
        formula(
          "hubble-redshift",
          "Flat LCDM H(z)",
          "H(z) = H0 * sqrt(Omega_m*(1+z)^3 + Omega_Lambda)",
          "H0, Omega_m, Omega_Lambda, redshift z",
          "Flat background cosmology validation.",
        ),
        formula(
          "luminosity-distance",
          "Luminosity distance",
          "D_L = (1+z) * D_C",
          "redshift z and comoving distance D_C",
          "Background FRW distance ladder check.",
        ),
        formula(
          "etherington",
          "Etherington reciprocity",
          "D_L = (1+z)^2 * D_A",
          "luminosity distance D_L, angular-diameter distance D_A",
          "Metric theory distance consistency check.",
        ),
      ],
      metrics: [
        metric("h0", "H0", formatNumber(validation?.params.h0KmSmpc, 3, " km/s/Mpc"), status),
        metric("age-now", "Age now", formatNumber(validation?.ageNowGyr, 3, " Gyr"), status),
        metric("anchor-count", "Distance anchors", formatNumber(validation?.anchors.length, 0), status),
        metric("omega-m", "Omega matter", formatNumber(validation?.params.omegaMatter, 4), status),
        metric("omega-lambda", "Omega Lambda", formatNumber(validation?.params.omegaLambda, 4), status),
      ],
      confidenceRationale:
        validation?.status === "ready"
          ? "Formula-checked against deterministic distance, age, monotonicity, and reciprocity diagnostics."
          : "Pending or failed until the FRW validation summary is available.",
      assumptions: [
        "Planck 2018 flat LambdaCDM parameters are used as a fixed preset.",
        "Only homogeneous background expansion is represented.",
      ],
      limitations: [
        "Not a CMB Boltzmann solver.",
        "Not a cosmological N-body or structure-formation simulation.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}
