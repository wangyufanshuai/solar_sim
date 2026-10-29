export const KERR_OBSERVABLE_PROVENANCE_ARTIFACT_VERSION_V471 =
  "v471-kerr-observable-provenance-artifact-v1" as const;
export const KERR_OBSERVABLE_PROVENANCE_SUMMARY_VERSION_V471 =
  "v471-kerr-observable-provenance-summary-v1" as const;
export const KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471 =
  "v471-kerr-observable-provenance-api-v1" as const;

export const KERR_OBSERVABLE_IDS_V471 = Object.freeze([
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

export const canonicalKerrObservableProvenancePayloadV471 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrObservableIdV471 = (typeof KERR_OBSERVABLE_IDS_V471)[number];
export type KerrObservableStatusV471 =
  | "available-short-authority"
  | "available-coordinate-authority"
  | "available-analytic-fixture"
  | "unavailable-production-authority";

export type KerrObservableSourceV471 = Readonly<{
  id: string;
  role: string;
  status: string;
  fileSha256: string;
  authoritySha256: string;
}>;

export type KerrObservableVerificationV471 = Readonly<{
  metric: string;
  observed: number;
  limit: number | null;
  relation: "<" | "<=" | ">=" | "qualified-by-source";
  qualified: true;
  sourceId: string;
}> | null;

export type KerrObservableRowV471 = Readonly<{
  id: KerrObservableIdV471;
  domain:
    | "geometry"
    | "polarization"
    | "astrometry"
    | "radiometry"
    | "detector"
    | "science-product";
  label: string;
  semantics: string;
  units: string;
  status: KerrObservableStatusV471;
  available: boolean;
  scientificValueQualified: boolean;
  productionAuthorityGranted: false;
  productionPayloadAllowed: false;
  sciencePixelMutationAllowed: false;
  cinematicWritebackAllowed: false;
  applicability: string;
  recordCount: number;
  notApplicableCount: number;
  sourceIds: readonly string[];
  verification: KerrObservableVerificationV471;
  unavailableReason: string | null;
}>;

export type KerrObservableProvenanceArtifactV471 = Readonly<{
  version: typeof KERR_OBSERVABLE_PROVENANCE_ARTIFACT_VERSION_V471;
  generatedAt: string;
  status: "observable-provenance-qualified-production-blocked-browser-pending";
  sources: readonly KerrObservableSourceV471[];
  contract: Readonly<{
    rowCount: 13;
    sourceCount: 11;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    sourceShaRequired: true;
    unavailableIsNotZero: true;
    sparseAuthorityIsNotDenseAuthority: true;
    analyticFixtureIsNotMeasuredAuthority: true;
    scienceCinematicWritebackForbidden: true;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  rows: readonly KerrObservableRowV471[];
  summary: Readonly<{
    availableRowCount: 9;
    unavailableRowCount: 4;
    shortAuthorityRowCount: 4;
    coordinateAuthorityRowCount: 3;
    analyticFixtureRowCount: 2;
    productionAuthorityGrantedRowCount: 0;
    sciencePixelRows: 0;
    stokesMeasurementRows: 0;
    fitsImageRows: 0;
  }>;
  admission: Readonly<{
    geometryShortAuthorityQualified: true;
    polarizationShortAuthorityQualified: true;
    screenCoordinateAuthorityQualified: true;
    continuousWcsQualified: true;
    orientationBasisQualified: true;
    detectorProjectionAllowed: false;
    stokesMeasurementAvailable: false;
    denseAggregateAvailable: false;
    scienceRasterAllowed: false;
    fitsImageAllowed: false;
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
    fullExecutionArraysIncluded: false;
    rasterArraysIncluded: false;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
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

export type KerrObservableProvenanceSummaryV471 = Readonly<{
  version: typeof KERR_OBSERVABLE_PROVENANCE_SUMMARY_VERSION_V471;
  status: KerrObservableProvenanceArtifactV471["status"];
  artifactSha256: string;
  contract: KerrObservableProvenanceArtifactV471["contract"];
  sources: KerrObservableProvenanceArtifactV471["sources"];
  rows: KerrObservableProvenanceArtifactV471["rows"];
  summary: KerrObservableProvenanceArtifactV471["summary"];
  admission: KerrObservableProvenanceArtifactV471["admission"];
  lifecycle: KerrObservableProvenanceArtifactV471["lifecycle"];
  boundary: KerrObservableProvenanceArtifactV471["boundary"];
}>;

export type KerrObservableProvenanceApiV471 = Readonly<{
  version: typeof KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrObservableProvenanceSummaryV471 | null;
}>;

export function parseKerrObservableProvenanceArtifactV471(
  value: unknown,
): KerrObservableProvenanceArtifactV471 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrObservableProvenanceArtifactV471>)
      : null;
  const rows = artifact?.rows;
  const sources = artifact?.sources;
  const sourceIds = new Set(sources?.map((source) => source.id) ?? []);

  if (
    !artifact ||
    artifact.version !== KERR_OBSERVABLE_PROVENANCE_ARTIFACT_VERSION_V471 ||
    artifact.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
    !sources ||
    sources.length !== 11 ||
    sourceIds.size !== 11 ||
    sources.some(
      (source) =>
        !source.id ||
        !source.role ||
        !source.status ||
        !SHA256.test(source.fileSha256) ||
        !SHA256.test(source.authoritySha256),
    ) ||
    artifact.contract?.rowCount !== 13 ||
    artifact.contract.sourceCount !== 11 ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.sourceShaRequired !== true ||
    artifact.contract.unavailableIsNotZero !== true ||
    artifact.contract.sparseAuthorityIsNotDenseAuthority !== true ||
    artifact.contract.analyticFixtureIsNotMeasuredAuthority !== true ||
    artifact.contract.scienceCinematicWritebackForbidden !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    !rows ||
    rows.length !== KERR_OBSERVABLE_IDS_V471.length ||
    rows.some((row, index) => row.id !== KERR_OBSERVABLE_IDS_V471[index]) ||
    new Set(rows.map((row) => row.id)).size !== rows.length ||
    rows.some(
      (row) =>
        !row.label ||
        !row.semantics ||
        !row.units ||
        row.productionAuthorityGranted !== false ||
        row.productionPayloadAllowed !== false ||
        row.sciencePixelMutationAllowed !== false ||
        row.cinematicWritebackAllowed !== false ||
        row.recordCount < 0 ||
        row.notApplicableCount < 0 ||
        row.sourceIds.length === 0 ||
        row.sourceIds.some((sourceId) => !sourceIds.has(sourceId)) ||
        (row.available && row.unavailableReason !== null) ||
        (!row.available && !row.unavailableReason) ||
        (row.verification !== null &&
          (!Number.isFinite(row.verification.observed) ||
            row.verification.qualified !== true ||
            !sourceIds.has(row.verification.sourceId))),
    ) ||
    artifact.summary?.availableRowCount !== 9 ||
    artifact.summary.unavailableRowCount !== 4 ||
    artifact.summary.shortAuthorityRowCount !== 4 ||
    artifact.summary.coordinateAuthorityRowCount !== 3 ||
    artifact.summary.analyticFixtureRowCount !== 2 ||
    artifact.summary.productionAuthorityGrantedRowCount !== 0 ||
    artifact.summary.sciencePixelRows !== 0 ||
    artifact.summary.stokesMeasurementRows !== 0 ||
    artifact.summary.fitsImageRows !== 0 ||
    rows.filter((row) => row.available).length !== 9 ||
    rows.filter((row) => !row.available).length !== 4 ||
    rows.filter((row) => row.status === "available-short-authority").length !== 4 ||
    rows.filter((row) => row.status === "available-coordinate-authority").length !== 3 ||
    rows.filter((row) => row.status === "available-analytic-fixture").length !== 2 ||
    rows.some((row) => row.productionAuthorityGranted) ||
    artifact.admission?.geometryShortAuthorityQualified !== true ||
    artifact.admission.polarizationShortAuthorityQualified !== true ||
    artifact.admission.screenCoordinateAuthorityQualified !== true ||
    artifact.admission.continuousWcsQualified !== true ||
    artifact.admission.orientationBasisQualified !== true ||
    artifact.admission.detectorProjectionAllowed !== false ||
    artifact.admission.stokesMeasurementAvailable !== false ||
    artifact.admission.denseAggregateAvailable !== false ||
    artifact.admission.scienceRasterAllowed !== false ||
    artifact.admission.fitsImageAllowed !== false ||
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
    artifact.boundary?.fullExecutionArraysIncluded !== false ||
    artifact.boundary.rasterArraysIncluded !== false ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
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
    throw new Error("v471-observable-provenance-identity");
  }

  return freezeDeep(value as KerrObservableProvenanceArtifactV471);
}

export function createKerrObservableProvenanceSummaryV471(
  value: unknown,
): KerrObservableProvenanceSummaryV471 {
  const artifact = parseKerrObservableProvenanceArtifactV471(value);
  return freezeDeep({
    version: KERR_OBSERVABLE_PROVENANCE_SUMMARY_VERSION_V471,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    sources: artifact.sources,
    rows: artifact.rows,
    summary: artifact.summary,
    admission: artifact.admission,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrObservableProvenanceApiV471(
  value: unknown,
): KerrObservableProvenanceApiV471 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrObservableProvenanceApiV471>)
      : null;
  if (
    !api ||
    api.version !== KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v471-observable-provenance-api-identity");
  }
  return freezeDeep(value as KerrObservableProvenanceApiV471);
}
