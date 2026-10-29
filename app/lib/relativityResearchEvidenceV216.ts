export const ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V216_VERSION =
  "v216-relativity-research-evidence" as const;

/**
 * Compact browser summary. Full JSON/CSV evidence remains in dist/science and
 * is intentionally excluded from the initial application chunk.
 */
export const ATLAS_RELATIVITY_RESEARCH_STATUS_V216 = {
  version: ATLAS_RELATIVITY_RESEARCH_EVIDENCE_V216_VERSION,
  releaseClassification: "relativity-v10-research-candidate-shadow-retained",
  defaultSolarKernel: "legacy-eih-1pn",
  candidateKernel: "barycentric-eih-1pn-j2-2pn-lt-v9",
  referenceBundle: {
    epochCount: 68,
    sourceEpochCount: 34,
    frame: "ICRF/J2000 barycentric",
    timeScale: "TDB",
    sha256: "7a9a2882536e25d296954625a58b25179f0e03a7c2e3066ab83b6b8bf2924909",
  },
  stm: {
    canonicalEvidenceSha256:
      "ebbb607729272182baf22b33f3d244a10b1d808833ec6ea34a6e1bed769c5a20",
    calibrationWeightedRms: 270.9542162290139,
    leaveOneDayOutRms: 271.04313596111183,
    legacyRaw365PositionRmsKm: 660.9602431144707,
    legacyFit365PositionRmsKm: 664.9064646427285,
    legacyRawTenYearPositionRmsKm: 679.4834158231467,
    legacyFitTenYearPositionRmsKm: 714.0404854521726,
    deterministicRerun: true,
    blindHoldoutImproved: false,
  },
  longHorizon: {
    diagnosticDays: 36525,
    qualificationGate: false,
    sha256: "42b01874c27f73d3bd14643d1cbaf999d3f491301426b8a02ee06821e947bff5",
  },
  kerrCrossValidation: {
    rayCount: 25,
    classificationAgreement: 1,
    maxKerrSchildNullConstraint: 5.900781790634982e-10,
    maxCarterNullConstraint: 7.648806735389391e-10,
    canonicalEvidenceSha256:
      "bb01e9ac63d17b98fda02f4c15638b1ee3b7f66535e49cea5d1021e91efccd90",
    classificationGatePassed: true,
    invariantGatePassed: false,
    redshiftCrossValidated: false,
    polarizationCrossValidated: false,
  },
  runtimePromotionApplied: false,
  boundary:
    "offline-research-evidence-only-no-live-worker-physics-or-scientific-gate-mutation",
} as const;
