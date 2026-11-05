import { ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13 } from "./atlasResearchCampaignV13";

export const ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V230_VERSION =
  "v230-relativity-research-evidence" as const;

const campaign = ATLAS_RESEARCH_CAMPAIGN_MANIFEST_V13;

/**
 * Compact, checksummed browser summary. The full ray shards, floating-point
 * channels, DE440/SPICE cache and STM matrices remain local research outputs
 * and are never bundled into Lite or the application startup graph.
 */
export const ATLAS_RELATIVITY_RESEARCH_STATUS_V230 = {
  version: ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V230_VERSION,
  releaseClassification: campaign.outcome,
  defaultSolarKernel: "legacy-eih-1pn",
  runtimePromotionApplied: false,
  denseKerr: {
    profile: "finite-observer-v8-campaign-failed-negative-evidence-retained",
    campaignStatus: campaign.denseKerr.campaignStatus,
    plannedRayCount: 3097,
    plannedShardCount: 49,
    canonicalRayCount: 25,
    lowDiscrepancyRayCount: 2048,
    criticalBracketRayCount: 1024,
    completedReleaseShardCount:
      campaign.denseKerr.completedReleaseShardCount,
    completedRayCount: campaign.denseKerr.completedRayCount,
    completedExecutionCount: campaign.denseKerr.completedExecutionCount,
    attemptedRayCount: campaign.denseKerr.attemptedRayCount,
    attemptedExecutionCount: campaign.denseKerr.attemptedExecutionCount,
    failedShardIndex: campaign.denseKerr.failedShardIndex,
    failedShardEvidence: campaign.denseKerr.failedShardEvidence,
    noAutomaticRetry: campaign.denseKerr.noAutomaticRetry,
    frozenScreenManifestSha256:
      campaign.denseKerr.finiteObserverScreenManifestSha256,
    releasePlanFileSha256:
      campaign.sourceSha256.densePlan,
    shortGateCanonicalEvidenceSha256:
      campaign.denseKerr.shortGateCanonicalEvidenceSha256,
    shortGatePassed: campaign.denseKerr.shortGatePassed,
    canonicalCarterEvidenceSha256:
      "e89f02caa2b077cc45a46d9b82e25eb6f13de828b90cc8f9396adb349ae2f9ec",
    canonicalCarterMaxInvariantDrift: 1.5490902823592962e-11,
    canonicalCrossValidationSha256:
      "99aefe694e2385ae8f298e0bc3640d69c1f51c28ddec9c6ee1be08e75f138e13",
    canonicalClassificationAgreement: 1,
    canonicalCrossValidationPassed: true,
    releaseInvariantGate: 1e-10,
    partialResultsAggregated:
      campaign.denseKerr.partialResultsAggregated,
    gatePassed: campaign.denseKerr.gatePassed,
    blocker: campaign.denseKerr.blocker,
  },
  variationalStm: {
    profile: "smoke-single-iteration-variational-a-b",
    bodyCount: 12,
    fullStateDimension: 72,
    independentParameterDimension: 66,
    integratedStateAndPhiDimension: 4824,
    effectiveRank: 66,
    unregularizedConditionNumber: 112.20757780432957,
    directionalJacobianMaxRelativeError: 1.2268580077544194e-10,
    dop853Fit365PositionRmsKm: 218908.18578029875,
    ias15Fit365PositionRmsKm: 218908.1857801681,
    crossSolverDifferenceM: 0.00013065,
    leaveOneDayOutMethod: "regularized-linearized-grouped-press",
    deterministicSmokeRerunPassed: true,
    deterministicFullRerunPassed:
      campaign.variationalStm.releaseQualificationAvailable,
    tenYearQualificationAvailable:
      campaign.variationalStm.releaseQualificationAvailable,
    canonicalEvidenceSha256:
      "35583dea66327232d32a2a8c053c4e2f7c0f91093bf7ce1ba6f35977553cacff",
    evidenceFileSha256:
      "3eaf637e0b92fc3c1f524f5a1bcf3e38a427373024ed97920042483ffe307340",
    gatePassed: campaign.variationalStm.gatePassed,
  },
  reproduction: {
    denseKerrPlan:
      ".venv-science\\Scripts\\python.exe scripts\\run-kerr-dense-shards-v8.py --profile release --plan-only",
    denseKerrRun:
      ".venv-science\\Scripts\\python.exe scripts\\run-kerr-dense-shards-v8.py --profile release --shard N --watchdog-seconds 180",
    automaticDenseKerrRetryAuthorized: false,
    variationalStm:
      ".venv-science\\Scripts\\python.exe scripts\\run-relativity-variational-stm-v12.py --modes legacy-eih-1pn full-eih-1pn-2pn-lt --output dist/science/relativity-variational-stm-v12-a.json",
  },
  liteBoundary:
    "checksummed-summary-only-no-de440-spice-full-rays-floating-channels-or-local-science-cache",
  boundary:
    "offline-research-evidence-only-no-live-worker-physics-or-scientific-gate-mutation",
} as const;
