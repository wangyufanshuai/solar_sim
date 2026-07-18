export const KERR_FINITE_OBSERVER_SEPARATRIX_V8_VERSION =
  "v248-kerr-finite-observer-separatrix-v8" as const;
export const KERR_FINITE_OBSERVER_SCREEN_V8_VERSION =
  "v248-kerr-finite-observer-screen-manifest-v8" as const;

export type KerrFiniteObserverSeparatrixPointV8 = {
  pair: number;
  angleRad: number;
  screenX: number;
  screenY: number;
  screenRadius: number;
  sphericalPhotonRadiusM: number;
  xi: number;
  eta: number;
  observerNullConstraint: number;
  radialPotentialResidual: number;
  radialDerivativeResidual: number;
  constantsRoundTripRelativeError: number;
};

export type KerrFiniteObserverScreenManifestV8 = {
  version: typeof KERR_FINITE_OBSERVER_SCREEN_V8_VERSION;
  geometryVersion: typeof KERR_FINITE_OBSERVER_SEPARATRIX_V8_VERSION;
  sourceV5ScreenFileSha256: string;
  sourceV5ScreenCanonicalSha256: string;
  observer: {
    kind: "exact-ZAMO-shared-v5";
    spinA: number;
    radiusM: number;
    thetaRad: number;
    screenBasis: "radial-polar-azimuthal";
  };
  viewport: readonly [number, number];
  criticalCenters: readonly KerrFiniteObserverSeparatrixPointV8[];
  criticalBrackets: readonly {
    pair: number;
    side: "inner" | "outer";
    offsetPx: -0.25 | 0.25;
    direction: readonly [number, number, number];
  }[];
  manifestSha256: string;
};

export type KerrDenseGateManifestV8 = {
  version: "v248-kerr-finite-observer-short-gate-v8";
  profile: "gate-isolated-from-v8-release-shards";
  gatePassed: boolean;
  selectedRayCount: 16;
  evaluation: {
    executionCount: 128;
    invalidCount: number;
    nonPhysicalCount: number;
    deterministicFailureCount: number;
    criticalPairCount: 5;
    criticalTransitionCount: number;
    criticalTransitionExpected: 40;
    maxNullConstraint: number | null;
    gatePassed: boolean;
  };
  releaseShardCoverageContribution: 0;
  canonicalEvidenceSha256: string;
};

export type KerrDenseCampaignProgressV8 = {
  version: "v248-kerr-dense-campaign-progress-v8";
  plannedShardCount: 49;
  completedShardCount: number;
  nextShardIndex: number | null;
  status: "pending" | "running" | "failed" | "complete";
  codeSha256: string;
  environmentSha256: string;
  finiteObserverScreenManifestSha256: string;
};

export type KerrDenseCrossValidationReportV8 = {
  version: "v248-kerr-dense-finite-observer-sharded-v8";
  completeShardCount: number;
  classificationAgreement: number | null;
  criticalTransitionCount: number;
  criticalTransitionExpected: number;
  criticalCurveMaxErrorPx: number | null;
  maxNullConstraint: number | null;
  gatePassed: boolean;
  promotionDecision: "shadow-retained";
  canonicalEvidenceSha256: string;
};

