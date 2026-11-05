/** v209 research-only contracts for provenance, STM fitting and blind holdouts. */

export const RELATIVITY_RESEARCH_V10_VERSION =
  "v209-relativity-research-contract-v10" as const;

export type RelativityReferenceFrameV10 =
  | "ICRF-J2000-barycentric"
  | "J2000-ecliptic-sun-centered";

export type RelativityReferenceSourceV10 = "de440-naif" | "horizons-frozen";

export type RelativityReferenceEpochV10 = {
  offsetDays: number;
  epochJdTdb: number;
  source: RelativityReferenceSourceV10;
  frame: RelativityReferenceFrameV10;
  timeScale: "TDB";
  origin: "solar-system-barycenter" | "sun";
  bodyCount: number;
  rawSha256: string;
  convertedSha256: string;
};

export type RelativityReferenceBundleV10 = {
  version: typeof RELATIVITY_RESEARCH_V10_VERSION;
  fixtureSha256: string;
  coordinateFrame: "ICRF-J2000-barycentric";
  timeScale: "TDB";
  units: { position: "AU"; velocity: "AU/day"; time: "TDB days" };
  epochs: readonly RelativityReferenceEpochV10[];
  assets: readonly { id: string; sha256: string; localOnly: true }[];
  provenanceReady: boolean;
  boundary: "offline-reference-only-no-runtime-physics";
};

export type RelativitySTMStateV10 = {
  bodyId: string;
  parameterOrder: readonly ["x", "y", "z", "vx", "vy", "vz"];
  stateTransitionRows: number;
  stateTransitionColumns: number;
  conditionNumber: number;
  covarianceDiagonal: readonly number[];
};

export type RelativityBatchFitReportV10 = {
  version: typeof RELATIVITY_RESEARCH_V10_VERSION;
  mode: "legacy-eih-1pn" | "full-eih-1pn-2pn-lt";
  calibrationWindowDays: readonly [number, number];
  observationCount: number;
  parameterCount: number;
  solver: "scipy-least-squares-stm";
  regularizationLambda: number;
  conditionNumber: number;
  weightedResidualRmsKm: number;
  leaveOneDayOutRmsKm: number | null;
  stm: readonly RelativitySTMStateV10[];
  rawPropagationReplaced: false;
  provenanceReady: boolean;
  boundary: "offline-fit-only-no-runtime-promotion";
};

export type RelativityBlindHoldoutReportV10 = {
  version: typeof RELATIVITY_RESEARCH_V10_VERSION;
  calibration: RelativityBatchFitReportV10;
  holdoutDays: readonly [365, 3652.5];
  raw: { positionRmsKm: number; velocityRmsMS: number };
  fitted: { positionRmsKm: number; velocityRmsMS: number };
  candidateDelta: { positionKm: number; velocityMS: number };
  uncertainty: { uDop853: number; uIAS15: number; uReference: number; uFit: number; uJoint: number };
  attribution: "fit-sensitive" | "cross-solver-regression-confirmed" | "inconclusive";
  rawPropagationReplaced: false;
  promotionDecision: "shadow-retained" | "promotion-qualified-not-applied";
};

export type RelativityRegressionAttributionV10 =
  | "frame-time-transform"
  | "initial-state-quantization"
  | "fit-sensitive"
  | "missing-force-term"
  | "solver-implementation"
  | "reference-model-incompleteness"
  | "cross-solver-regression-confirmed"
  | "unresolved";

export function validateRelativityReferenceBundleV10(bundle: RelativityReferenceBundleV10) {
  const epochsValid = bundle.epochs.length > 0 && bundle.epochs.every((epoch) =>
    epoch.timeScale === "TDB" && epoch.bodyCount > 0 &&
    /^[a-f0-9]{64}$/.test(epoch.rawSha256) && /^[a-f0-9]{64}$/.test(epoch.convertedSha256));
  const sourcesMixed = new Set(bundle.epochs.map((epoch) => epoch.source)).size >= 2;
  const boundaryPassed = bundle.coordinateFrame === "ICRF-J2000-barycentric" &&
    bundle.timeScale === "TDB" && bundle.provenanceReady &&
    bundle.boundary === "offline-reference-only-no-runtime-physics";
  return { epochsValid, sourcesMixed, boundaryPassed, passed: epochsValid && sourcesMixed && boundaryPassed };
}

export function validateRelativityBatchFitV10(report: RelativityBatchFitReportV10) {
  const fitValid = report.solver === "scipy-least-squares-stm" &&
    report.calibrationWindowDays[0] === 0 && report.calibrationWindowDays[1] === 30 &&
    report.parameterCount > 0 && report.observationCount > report.parameterCount &&
    Number.isFinite(report.conditionNumber ?? 0) && report.rawPropagationReplaced === false;
  return { fitValid, provenanceReady: report.provenanceReady, passed: fitValid && report.provenanceReady };
}
