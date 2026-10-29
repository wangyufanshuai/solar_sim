export const KERR_MEASURED_DETECTOR_BLIND_RESULTS_ARTIFACT_VERSION_V460 =
  "v460-kerr-measured-detector-blind-results-artifact-v1" as const;
export const KERR_MEASURED_DETECTOR_BLIND_RESULTS_SUMMARY_VERSION_V460 =
  "v460-kerr-measured-detector-blind-results-summary-v1" as const;
export const KERR_MEASURED_DETECTOR_BLIND_RESULTS_API_VERSION_V460 =
  "v460-kerr-measured-detector-blind-results-api-v1" as const;

export const KERR_MEASURED_DETECTOR_BLIND_METRICS_V460 = Object.freeze([
  "plateScaleRepeatCv",
  "distortionHoldoutMaxResidualPx",
  "psfRepeatCv",
  "pixelResponseRelativeResidual",
  "holdoutCoverage",
] as const);
export type KerrMeasuredDetectorBlindMetricV460 =
  (typeof KERR_MEASURED_DETECTOR_BLIND_METRICS_V460)[number];
export type KerrMeasuredDetectorBlindMeasurementRowV460 = Readonly<{
  rowId: string;
  split: "train" | "holdout";
  fold: 1 | 2 | 3;
  metric: KerrMeasuredDetectorBlindMetricV460;
  value: number;
  unit: string;
  sourceSha256: string;
}>;

export type KerrMeasuredDetectorBlindResultV460 = Readonly<{
  status: "qualified" | "rejected" | "incomplete" | "validation-only";
  reason:
    | "none"
    | "rows-empty"
    | "duplicate-row-id"
    | "train-holdout-overlap"
    | "source-sha-mismatch"
    | "metric-inventory"
    | "nonfinite-value"
    | "threshold-failed";
  contentClass: "measured-detector-calibration" | "synthetic-validation-fixture";
  trainRows: number;
  holdoutRows: number;
  overlapRows: number;
  duplicateRows: number;
  metrics: Readonly<{
    plateScaleRepeatCv: number | null;
    distortionHoldoutMaxResidualPx: number | null;
    psfRepeatCv: number | null;
    pixelResponseRelativeResidual: number | null;
    holdoutCoverage: number | null;
  }>;
  thresholds: Readonly<{
    plateScaleRepeatCvMax: 0.005;
    distortionHoldoutMaxResidualPx: 0.1;
    psfRepeatCvMax: 0.05;
    pixelResponseRelativeResidualMax: 0.02;
    holdoutCoverageMin: 0.95;
  }>;
  thresholdPass: boolean;
  uncertaintyBudget: Readonly<{
    components: Readonly<{
      uRepeatability: number | null;
      uTrainFit: number | null;
      uHoldout: number | null;
      uReference: number | null;
      uInitialState: number | null;
    }>;
    totalLinear: number | null;
    combination: "linear-unless-independence-proven";
    rssAllowed: false;
    closed: boolean;
  }>;
  authorityEligible: boolean;
}>;

export type KerrMeasuredDetectorBlindResultsArtifactV460 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_RESULTS_ARTIFACT_VERSION_V460;
  generatedAt: string;
  status: "blind-results-evaluator-qualified-production-results-unavailable";
  source: Readonly<{
    v459ArtifactSha256: string;
    v458IntakeArtifactSha256: string;
    v457PromotionGateArtifactSha256: string;
  }>;
  evaluator: Readonly<{
    qualified: true;
    metricCount: 5;
    rowIdentityRequired: true;
    sourceShaLockedRequired: true;
    thresholdComparisonExplicit: true;
    linearUncertaintyRequired: true;
    syntheticAuthorityFirewall: true;
  }>;
  control: KerrMeasuredDetectorBlindResultV460;
  production: Readonly<{
    status: "incomplete";
    reason: "measured-inputs-unavailable";
    trainRows: 0;
    holdoutRows: 0;
    metrics: KerrMeasuredDetectorBlindResultV460["metrics"];
    uncertaintyBudget: KerrMeasuredDetectorBlindResultV460["uncertaintyBudget"];
    authorityEligible: false;
  }>;
  inspect: Readonly<{
    measuredInputsAvailable: false;
    fitExecuted: false;
    holdoutExecuted: false;
    thresholdGateExecuted: false;
    uncertaintyBudgetClosed: false;
    authorityGranted: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
  }>;
  qualification: Readonly<{
    evaluatorQualified: true;
    controlResultValidationOnly: true;
    productionResultQualified: false;
    uncertaintyBudgetQualified: false;
    detectorAuthorityGranted: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    syntheticControlMayGrantAuthority: false;
    productionPixelsAvailable: false;
    sciencePayloadMutationAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrMeasuredDetectorBlindResultsSummaryV460 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_RESULTS_SUMMARY_VERSION_V460;
  status: KerrMeasuredDetectorBlindResultsArtifactV460["status"];
  artifactSha256: string;
  evaluator: KerrMeasuredDetectorBlindResultsArtifactV460["evaluator"];
  control: KerrMeasuredDetectorBlindResultsArtifactV460["control"];
  production: KerrMeasuredDetectorBlindResultsArtifactV460["production"];
  inspect: KerrMeasuredDetectorBlindResultsArtifactV460["inspect"];
  qualification: KerrMeasuredDetectorBlindResultsArtifactV460["qualification"];
  boundary: KerrMeasuredDetectorBlindResultsArtifactV460["boundary"];
}>;

export type KerrMeasuredDetectorBlindResultsApiV460 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_RESULTS_API_VERSION_V460;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrMeasuredDetectorBlindResultsSummaryV460 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const transientKeys = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transientKeys.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalKerrMeasuredDetectorBlindResultsPayloadV460 = (value: unknown): string => JSON.stringify(canonicalize(value));
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const unique = (values: readonly string[]): string[] => values.filter((value, index) => values.indexOf(value) === index);

export const KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460 = Object.freeze({
  plateScaleRepeatCvMax: 0.005 as const,
  distortionHoldoutMaxResidualPx: 0.1 as const,
  psfRepeatCvMax: 0.05 as const,
  pixelResponseRelativeResidualMax: 0.02 as const,
  holdoutCoverageMin: 0.95 as const,
});

const metricUnits: Record<KerrMeasuredDetectorBlindMetricV460, string> = {
  plateScaleRepeatCv: "coefficient-of-variation",
  distortionHoldoutMaxResidualPx: "pixel-residual",
  psfRepeatCv: "coefficient-of-variation",
  pixelResponseRelativeResidual: "relative-residual",
  holdoutCoverage: "fraction",
};

export function evaluateKerrMeasuredDetectorBlindResultsV460(
  rows: readonly KerrMeasuredDetectorBlindMeasurementRowV460[],
  contentClass: KerrMeasuredDetectorBlindResultV460["contentClass"],
  expectedSourceSha256: string,
  uncertaintyComponents: KerrMeasuredDetectorBlindResultV460["uncertaintyBudget"]["components"],
): KerrMeasuredDetectorBlindResultV460 {
  const train = rows.filter((row) => row.split === "train");
  const holdout = rows.filter((row) => row.split === "holdout");
  const ids = rows.map((row) => row.rowId);
  const duplicateRows = ids.length - unique(ids).length;
  const overlapIds = unique(train.map((row) => row.rowId).filter((id) => holdout.some((row) => row.rowId === id)));
  const sourceMismatch = rows.some((row) => row.sourceSha256 !== expectedSourceSha256 || !SHA256.test(row.sourceSha256));
  const nonfinite = rows.some((row) => !finite(row.value) || row.unit !== metricUnits[row.metric]);
  const metricInventory = KERR_MEASURED_DETECTOR_BLIND_METRICS_V460.some((metric) => !rows.some((row) => row.metric === metric));
  const reason = rows.length === 0 ? "rows-empty" : duplicateRows ? "duplicate-row-id" : overlapIds.length ? "train-holdout-overlap" : sourceMismatch ? "source-sha-mismatch" : nonfinite ? "nonfinite-value" : metricInventory ? "metric-inventory" : "none";
  const metrics = Object.freeze({
    plateScaleRepeatCv: rows.find((row) => row.metric === "plateScaleRepeatCv")?.value ?? null,
    distortionHoldoutMaxResidualPx: rows.find((row) => row.metric === "distortionHoldoutMaxResidualPx")?.value ?? null,
    psfRepeatCv: rows.find((row) => row.metric === "psfRepeatCv")?.value ?? null,
    pixelResponseRelativeResidual: rows.find((row) => row.metric === "pixelResponseRelativeResidual")?.value ?? null,
    holdoutCoverage: rows.find((row) => row.metric === "holdoutCoverage")?.value ?? null,
  });
  const thresholdPass = reason === "none" && metrics.plateScaleRepeatCv !== null && metrics.distortionHoldoutMaxResidualPx !== null && metrics.psfRepeatCv !== null && metrics.pixelResponseRelativeResidual !== null && metrics.holdoutCoverage !== null && metrics.plateScaleRepeatCv < KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460.plateScaleRepeatCvMax && metrics.distortionHoldoutMaxResidualPx < KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460.distortionHoldoutMaxResidualPx && metrics.psfRepeatCv < KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460.psfRepeatCvMax && metrics.pixelResponseRelativeResidual < KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460.pixelResponseRelativeResidualMax && metrics.holdoutCoverage >= KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460.holdoutCoverageMin;
  const uncertaintyValues = Object.values(uncertaintyComponents);
  const uncertaintyClosed = uncertaintyValues.every(finite);
  const totalLinear = uncertaintyClosed ? uncertaintyValues.reduce((sum, value) => sum + value, 0) : null;
  const baseStatus = reason !== "none" ? "rejected" : thresholdPass && uncertaintyClosed ? "qualified" : "incomplete";
  const status = contentClass === "synthetic-validation-fixture" && baseStatus === "qualified" ? "validation-only" : baseStatus;
  return freezeDeep({
    status,
    reason: reason === "none" && !thresholdPass && rows.length > 0 ? "threshold-failed" : reason,
    contentClass,
    trainRows: train.length,
    holdoutRows: holdout.length,
    overlapRows: overlapIds.length,
    duplicateRows,
    metrics,
    thresholds: KERR_MEASURED_DETECTOR_RESULT_THRESHOLDS_V460,
    thresholdPass,
    uncertaintyBudget: freezeDeep({ components: uncertaintyComponents, totalLinear, combination: "linear-unless-independence-proven" as const, rssAllowed: false as const, closed: uncertaintyClosed }),
    authorityEligible: status === "qualified" && contentClass === "measured-detector-calibration" && thresholdPass && uncertaintyClosed,
  });
}

export function parseKerrMeasuredDetectorBlindResultsArtifactV460(value: unknown): KerrMeasuredDetectorBlindResultsArtifactV460 {
  const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrMeasuredDetectorBlindResultsArtifactV460> : null;
  if (!artifact || artifact.version !== KERR_MEASURED_DETECTOR_BLIND_RESULTS_ARTIFACT_VERSION_V460 || artifact.status !== "blind-results-evaluator-qualified-production-results-unavailable" || !SHA256.test(artifact.artifactSha256 ?? "") || !artifact.source || Object.values(artifact.source).some((entry) => !SHA256.test(entry)) || artifact.evaluator?.qualified !== true || artifact.evaluator.metricCount !== 5 || artifact.evaluator.rowIdentityRequired !== true || artifact.evaluator.sourceShaLockedRequired !== true || artifact.evaluator.thresholdComparisonExplicit !== true || artifact.evaluator.linearUncertaintyRequired !== true || artifact.evaluator.syntheticAuthorityFirewall !== true || artifact.control?.status !== "validation-only" || artifact.control.authorityEligible !== false || artifact.control.thresholdPass !== true || artifact.control.uncertaintyBudget.closed !== true || artifact.production?.status !== "incomplete" || artifact.production.reason !== "measured-inputs-unavailable" || artifact.production.trainRows !== 0 || artifact.production.holdoutRows !== 0 || Object.values(artifact.production.metrics).some((entry) => entry !== null) || artifact.production.authorityEligible !== false || artifact.inspect?.measuredInputsAvailable !== false || artifact.inspect.fitExecuted !== false || artifact.inspect.holdoutExecuted !== false || artifact.inspect.thresholdGateExecuted !== false || artifact.inspect.uncertaintyBudgetClosed !== false || artifact.inspect.authorityGranted !== false || artifact.inspect.fitsWriteAllowed !== false || artifact.inspect.pngWriteAllowed !== false || artifact.qualification?.evaluatorQualified !== true || artifact.qualification.controlResultValidationOnly !== true || artifact.qualification.productionResultQualified !== false || artifact.qualification.uncertaintyBudgetQualified !== false || artifact.qualification.detectorAuthorityGranted !== false || artifact.qualification.browserQualification !== "not-run" || artifact.boundary?.syntheticControlMayGrantAuthority !== false || artifact.boundary.productionPixelsAvailable !== false || artifact.boundary.sciencePayloadMutationAllowed !== false || artifact.boundary.fitsWriteAllowed !== false || artifact.boundary.pngWriteAllowed !== false || artifact.boundary.networkAttempted !== false || artifact.boundary.automaticRetryApplied !== false || artifact.formalProductPointer !== "v263" || artifact.formalDefaultKernel !== "legacy-eih-1pn" || artifact.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v460-blind-results-artifact-identity");
  return freezeDeep(value as KerrMeasuredDetectorBlindResultsArtifactV460);
}
export function createKerrMeasuredDetectorBlindResultsSummaryV460(value: unknown): KerrMeasuredDetectorBlindResultsSummaryV460 {
  const artifact = parseKerrMeasuredDetectorBlindResultsArtifactV460(value);
  return freezeDeep({ version: KERR_MEASURED_DETECTOR_BLIND_RESULTS_SUMMARY_VERSION_V460, status: artifact.status, artifactSha256: artifact.artifactSha256, evaluator: artifact.evaluator, control: artifact.control, production: artifact.production, inspect: artifact.inspect, qualification: artifact.qualification, boundary: artifact.boundary });
}
export function parseKerrMeasuredDetectorBlindResultsApiV460(value: unknown): KerrMeasuredDetectorBlindResultsApiV460 {
  const api = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrMeasuredDetectorBlindResultsApiV460> : null;
  if (!api || api.version !== KERR_MEASURED_DETECTOR_BLIND_RESULTS_API_VERSION_V460 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v460-blind-results-api-identity");
  return freezeDeep(value as KerrMeasuredDetectorBlindResultsApiV460);
}

export function createKerrMeasuredDetectorBlindControlRowsV460(sourceSha256: string): readonly KerrMeasuredDetectorBlindMeasurementRowV460[] {
  const rows: KerrMeasuredDetectorBlindMeasurementRowV460[] = [
    { rowId: "control-train-plate", split: "train", fold: 1, metric: "plateScaleRepeatCv", value: 0.001, unit: "coefficient-of-variation", sourceSha256 },
    { rowId: "control-holdout-distortion", split: "holdout", fold: 2, metric: "distortionHoldoutMaxResidualPx", value: 0.02, unit: "pixel-residual", sourceSha256 },
    { rowId: "control-train-psf", split: "train", fold: 2, metric: "psfRepeatCv", value: 0.01, unit: "coefficient-of-variation", sourceSha256 },
    { rowId: "control-holdout-response", split: "holdout", fold: 3, metric: "pixelResponseRelativeResidual", value: 0.01, unit: "relative-residual", sourceSha256 },
    { rowId: "control-holdout-coverage", split: "holdout", fold: 1, metric: "holdoutCoverage", value: 0.99, unit: "fraction", sourceSha256 },
  ];
  return Object.freeze(rows);
}
