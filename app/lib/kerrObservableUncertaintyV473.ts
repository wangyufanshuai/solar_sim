export const KERR_OBSERVABLE_UNCERTAINTY_ARTIFACT_VERSION_V473 =
  "v473-kerr-observable-uncertainty-artifact-v1" as const;
export const KERR_OBSERVABLE_UNCERTAINTY_SUMMARY_VERSION_V473 =
  "v473-kerr-observable-uncertainty-summary-v1" as const;
export const KERR_OBSERVABLE_UNCERTAINTY_API_VERSION_V473 =
  "v473-kerr-observable-uncertainty-api-v1" as const;

export const KERR_UNCERTAINTY_ENTRY_IDS_V473 = Object.freeze([
  "geometry-classification",
  "emission-radius",
  "redshift-factor",
  "evpa",
  "screen-alpha-beta",
  "continuous-wcs-coordinate",
  "orientation-basis",
  "thin-disk-local-emission",
  "observed-radiance",
  "detector-response",
  "stokes-iquv",
  "science-raster-pixel",
  "fits-science-image",
] as const);

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};
export const canonicalKerrObservableUncertaintyPayloadV473 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrUncertaintyEntryIdV473 = (typeof KERR_UNCERTAINTY_ENTRY_IDS_V473)[number];
export type KerrUncertaintyComponentV473 = Readonly<{
  id: string;
  category:
    | "formulation-difference"
    | "tolerance-convergence"
    | "coordinate-replay"
    | "independent-oracle"
    | "tensor-cross-check"
    | "derivative-audit"
    | "invariant-residual"
    | "inverse-coupling";
  value: number;
  units: string;
  sourceId: string;
  correlationGroup: string;
  independentlyEstimated: boolean;
}>;

export type KerrUncertaintyAcceptanceV473 = Readonly<{
  metric: string;
  observed: number;
  limit: number;
  relation: "<" | "<=";
  passed: true;
}> | null;

export type KerrObservableUncertaintyEntryV473 = Readonly<{
  observableId: KerrUncertaintyEntryIdV473;
  status:
    | "qualified-short-budget"
    | "qualified-coordinate-budget"
    | "qualified-analytic-partial-budget"
    | "unavailable-production-budget";
  components: readonly KerrUncertaintyComponentV473[];
  combinationPolicy:
    | "single-component"
    | "maximum-correlated-tolerances"
    | "linear-sum-no-independence-proof"
    | "separate-physical-channels"
    | "unavailable";
  combinedValue: number | null;
  combinedUnits: string | null;
  acceptance: KerrUncertaintyAcceptanceV473;
  sourceQualifiedWithoutNumericLimit: boolean;
  independenceProven: false;
  productionBudgetClosed: false;
  missingProductionComponents: readonly string[];
  unavailableReason: string | null;
}>;

export type KerrObservableUncertaintyArtifactV473 = Readonly<{
  version: typeof KERR_OBSERVABLE_UNCERTAINTY_ARTIFACT_VERSION_V473;
  generatedAt: string;
  status: "observable-uncertainty-qualified-production-ledger-open-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    entryCount: 13;
    quantifiedEntryCount: 9;
    unavailableEntryCount: 4;
    componentCount: 16;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    noRssWithoutIndependenceProof: true;
    linearAdditionRequiredWithoutIndependence: true;
    separatePhysicalChannelsNotCombined: true;
    unavailableIsNotZero: true;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  entries: readonly KerrObservableUncertaintyEntryV473[];
  summary: Readonly<{
    quantifiedEntryCount: 9;
    combinedEntryCount: 8;
    separateChannelEntryCount: 1;
    unavailableEntryCount: 4;
    componentCount: 16;
    numericAcceptanceCount: 7;
    sourceQualifiedWithoutNumericLimitCount: 2;
    linearSumEntryCount: 3;
    maximumEntryCount: 1;
    singleComponentEntryCount: 4;
    rssEntryCount: 0;
    productionBudgetClosedCount: 0;
  }>;
  productionLedger: Readonly<{
    status: "open";
    measuredDetectorCalibrationAvailable: false;
    denseSamplingAvailable: false;
    modelDiscrepancyQuantified: false;
    instrumentResponseQuantified: false;
    backgroundReadNoiseQuantified: false;
    productionPixelUncertaintyAvailable: false;
    missingComponentIds: readonly [
      "measured-detector-calibration",
      "dense-sampling",
      "model-discrepancy",
      "instrument-background-read-noise",
    ];
  }>;
  lifecycle: Readonly<{
    existingCanvasCount: 1;
    newCanvasCreated: false;
    sceneRevisionDelta: 0;
    workers: 0;
    gpuBuffers: 0;
    pipelines: 0;
    textures: 0;
    renderTargets: 0;
    typedArrayCaches: 0;
    objectUrls: 0;
    cameraLeases: 0;
    subscriptions: 0;
    allResourcesAtBaseline: true;
  }>;
  boundary: Readonly<{
    productionAuthorityGranted: false;
    sciencePixelRows: 0;
    stokesMeasurementRows: 0;
    fitsImageRows: 0;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    imageProductsGenerated: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrObservableUncertaintySummaryV473 = Readonly<{
  version: typeof KERR_OBSERVABLE_UNCERTAINTY_SUMMARY_VERSION_V473;
  status: KerrObservableUncertaintyArtifactV473["status"];
  artifactSha256: string;
  contract: KerrObservableUncertaintyArtifactV473["contract"];
  entries: KerrObservableUncertaintyArtifactV473["entries"];
  summary: KerrObservableUncertaintyArtifactV473["summary"];
  productionLedger: KerrObservableUncertaintyArtifactV473["productionLedger"];
  lifecycle: KerrObservableUncertaintyArtifactV473["lifecycle"];
  boundary: KerrObservableUncertaintyArtifactV473["boundary"];
}>;

export type KerrObservableUncertaintyApiV473 = Readonly<{
  version: typeof KERR_OBSERVABLE_UNCERTAINTY_API_VERSION_V473;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrObservableUncertaintySummaryV473 | null;
}>;

export function parseKerrObservableUncertaintyArtifactV473(
  value: unknown,
): KerrObservableUncertaintyArtifactV473 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrObservableUncertaintyArtifactV473>)
      : null;
  const entries = artifact?.entries;

  if (
    !artifact ||
    artifact.version !== KERR_OBSERVABLE_UNCERTAINTY_ARTIFACT_VERSION_V473 ||
    artifact.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.entryCount !== 13 ||
    artifact.contract.quantifiedEntryCount !== 9 ||
    artifact.contract.unavailableEntryCount !== 4 ||
    artifact.contract.componentCount !== 16 ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.noRssWithoutIndependenceProof !== true ||
    artifact.contract.linearAdditionRequiredWithoutIndependence !== true ||
    artifact.contract.separatePhysicalChannelsNotCombined !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    !entries ||
    entries.length !== KERR_UNCERTAINTY_ENTRY_IDS_V473.length ||
    entries.some((entry, index) => entry.observableId !== KERR_UNCERTAINTY_ENTRY_IDS_V473[index]) ||
    entries.some(
      (entry) =>
        entry.independenceProven !== false ||
        entry.productionBudgetClosed !== false ||
        entry.components.some(
          (component) =>
            !component.id ||
            !Number.isFinite(component.value) ||
            component.value < 0 ||
            !component.units ||
            !component.sourceId ||
            !component.correlationGroup,
        ) ||
        (entry.combinationPolicy === "unavailable" &&
          (entry.components.length !== 0 ||
            entry.combinedValue !== null ||
            entry.combinedUnits !== null ||
            !entry.unavailableReason)) ||
        (entry.combinationPolicy !== "unavailable" &&
          (entry.components.length === 0 || entry.unavailableReason !== null)) ||
        (entry.acceptance !== null &&
          (!Number.isFinite(entry.acceptance.observed) ||
            !Number.isFinite(entry.acceptance.limit) ||
            entry.acceptance.passed !== true)),
    ) ||
    entries.reduce((sum, entry) => sum + entry.components.length, 0) !== 16 ||
    artifact.summary?.quantifiedEntryCount !== 9 ||
    artifact.summary.combinedEntryCount !== 8 ||
    artifact.summary.separateChannelEntryCount !== 1 ||
    artifact.summary.unavailableEntryCount !== 4 ||
    artifact.summary.componentCount !== 16 ||
    artifact.summary.numericAcceptanceCount !== 7 ||
    artifact.summary.sourceQualifiedWithoutNumericLimitCount !== 2 ||
    artifact.summary.linearSumEntryCount !== 3 ||
    artifact.summary.maximumEntryCount !== 1 ||
    artifact.summary.singleComponentEntryCount !== 4 ||
    artifact.summary.rssEntryCount !== 0 ||
    artifact.summary.productionBudgetClosedCount !== 0 ||
    entries.filter((entry) => entry.combinationPolicy !== "unavailable").length !== 9 ||
    entries.filter((entry) => entry.combinedValue !== null).length !== 8 ||
    entries.filter((entry) => entry.combinationPolicy === "separate-physical-channels").length !== 1 ||
    entries.filter((entry) => entry.combinationPolicy === "linear-sum-no-independence-proof").length !==
      3 ||
    entries.filter((entry) => entry.combinationPolicy === "maximum-correlated-tolerances").length !==
      1 ||
    entries.filter((entry) => entry.combinationPolicy === "single-component").length !== 4 ||
    entries.some((entry) => entry.combinationPolicy.includes("rss")) ||
    artifact.productionLedger?.status !== "open" ||
    artifact.productionLedger.measuredDetectorCalibrationAvailable !== false ||
    artifact.productionLedger.denseSamplingAvailable !== false ||
    artifact.productionLedger.modelDiscrepancyQuantified !== false ||
    artifact.productionLedger.instrumentResponseQuantified !== false ||
    artifact.productionLedger.backgroundReadNoiseQuantified !== false ||
    artifact.productionLedger.productionPixelUncertaintyAvailable !== false ||
    artifact.productionLedger.missingComponentIds.length !== 4 ||
    artifact.lifecycle?.existingCanvasCount !== 1 ||
    artifact.lifecycle.newCanvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.lifecycle.allResourcesAtBaseline !== true ||
    [
      artifact.lifecycle.workers,
      artifact.lifecycle.gpuBuffers,
      artifact.lifecycle.pipelines,
      artifact.lifecycle.textures,
      artifact.lifecycle.renderTargets,
      artifact.lifecycle.typedArrayCaches,
      artifact.lifecycle.objectUrls,
      artifact.lifecycle.cameraLeases,
      artifact.lifecycle.subscriptions,
    ].some((count) => count !== 0) ||
    artifact.boundary?.productionAuthorityGranted !== false ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.stokesMeasurementRows !== 0 ||
    artifact.boundary.fitsImageRows !== 0 ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.visualMatrixQualification !== "not-run" ||
    artifact.boundary.soakQualification !== "not-run" ||
    artifact.boundary.rtxWebGpuQualification !== "not-run" ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v473-observable-uncertainty-identity");
  }
  return freezeDeep(value as KerrObservableUncertaintyArtifactV473);
}

export function createKerrObservableUncertaintySummaryV473(
  value: unknown,
): KerrObservableUncertaintySummaryV473 {
  const artifact = parseKerrObservableUncertaintyArtifactV473(value);
  return freezeDeep({
    version: KERR_OBSERVABLE_UNCERTAINTY_SUMMARY_VERSION_V473,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    entries: artifact.entries,
    summary: artifact.summary,
    productionLedger: artifact.productionLedger,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrObservableUncertaintyApiV473(
  value: unknown,
): KerrObservableUncertaintyApiV473 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrObservableUncertaintyApiV473>)
      : null;
  if (
    !api ||
    api.version !== KERR_OBSERVABLE_UNCERTAINTY_API_VERSION_V473 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v473-observable-uncertainty-api-identity");
  }
  return freezeDeep(value as KerrObservableUncertaintyApiV473);
}
