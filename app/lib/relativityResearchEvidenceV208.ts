import {
  KERR_RAY_TRACE_V3_VERSION,
  type KerrRayTraceQualityV3,
} from "./kerrRayTraceV3";
import {
  RELATIVITY_RESEARCH_V9_VERSION,
  RELATIVITY_SCIENCE_ASSETS_V9,
  type RelativityResearchModeV9,
} from "./relativityResearchV9";

export const ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V208_VERSION =
  "v208-relativity-research-evidence" as const;

export const RELATIVITY_RESEARCH_MODES_V9: readonly RelativityResearchModeV9[] = [
  "newton",
  "legacy-eih-1pn",
  "full-eih-1pn",
  "full-eih-1pn-j2",
  "full-eih-1pn-2pn",
  "full-eih-1pn-2pn-lt",
] as const;

export const KERR_RAY_TRACE_QUALITY_TIERS_V3: readonly KerrRayTraceQualityV3[] = [
  "mobile-safe",
  "interactive",
  "science-still",
  "offline-reference",
] as const;

/**
 * Browser-safe summary of the checksummed offline report. The evidence builder
 * verifies these values against dist/science/kerr-ray-reference-v3.json; the
 * complete ray table remains outside the initial application chunk.
 */
export const ATLAS_KERR_OFFLINE_REFERENCE_SUMMARY_V208 = {
  reportVersion: "v205-kerr-ray-reference-dop853-v3",
  canonicalEvidenceSha256: "c04fa51baffce2a0cc32aa23855f81aca99b73fc92b3fd62a91049513b3d8077",
  method: "DOP853",
  rtol: 1e-12,
  atol: 1e-14,
  maxNullConstraint: 8.049684420730882e-12,
  maxCarterDrift: 0,
  schwarzschildRadiusErrorM: 8.881784197001252e-16,
  status: "reference-gates-passed",
  defaultSolarKernel: "legacy-eih-1pn",
  liveStateMutated: false,
  boundary: "float64-offline-kerr-test-particle-reference-not-grmhd",
} as const;

export const ATLAS_RELATIVITY_RESEARCH_STATUS_V208 = {
  version: ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V208_VERSION,
  weakFieldContractVersion: RELATIVITY_RESEARCH_V9_VERSION,
  strongFieldContractVersion: KERR_RAY_TRACE_V3_VERSION,
  scienceAssetCount: RELATIVITY_SCIENCE_ASSETS_V9.length,
  defaultSolarKernel: "legacy-eih-1pn",
  candidateKernelStatus: "shadow-retained",
  releaseClassification: "relativity-v9-research-candidate-shadow-retained",
  weakFieldEvidence: "joint-raw-propagation-negative-result-fitted-blind-pending",
  strongFieldEvidence: "offline-reference-gates-passed",
  runtimePromotionApplied: false,
  boundary:
    "research-evidence-only-no-live-worker-physics-or-scientific-gate-mutation",
} as const;
