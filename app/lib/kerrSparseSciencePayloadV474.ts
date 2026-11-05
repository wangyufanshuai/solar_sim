export const KERR_SPARSE_SCIENCE_PAYLOAD_ARTIFACT_VERSION_V474 =
  "v474-kerr-sparse-science-payload-artifact-v1" as const;
export const KERR_SPARSE_SCIENCE_PAYLOAD_SUMMARY_VERSION_V474 =
  "v474-kerr-sparse-science-payload-summary-v1" as const;
export const KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474 =
  "v474-kerr-sparse-science-payload-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "payloadSha256",
  "rowSha256",
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
export const canonicalKerrSparseSciencePayloadV474 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrSparseUncertaintyReferenceV474 = Readonly<{
  observableId:
    | "geometry-classification"
    | "emission-radius"
    | "redshift-factor"
    | "evpa"
    | "screen-alpha-beta"
    | "continuous-wcs-coordinate"
    | "orientation-basis";
  ledgerArtifactSha256: string;
  status: "qualified-short-budget" | "qualified-coordinate-budget";
  combinedValue: number;
  combinedUnits: string;
  productionBudgetClosed: false;
}>;

export type KerrSparseSciencePayloadRowV474 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  observer: Readonly<{
    family: "finite-distance-ZAMO";
    radiusM: 30;
    inclinationDeg: 70;
    azimuthDeg: 0;
  }>;
  screen: Readonly<{
    alphaM: number;
    betaM: number;
    radiusM: number;
    inward: number;
    vertical: number;
    horizontal: number;
  }>;
  constants: Readonly<{
    energy: number;
    angularMomentumZ: number;
    carterConstant: number;
  }>;
  geometry: Readonly<{
    classification: "disk-hit";
    emissionRadiusM: number;
    redshiftFactor: number;
  }>;
  polarization: Readonly<{
    evpaDeg: number;
    orientationQHat: number;
    orientationUHat: number;
    orientationAvailable: true;
    polarizationAmplitude: null;
    stokesI: null;
    stokesQ: null;
    stokesU: null;
    stokesV: null;
  }>;
  coordinate: Readonly<{
    continuousPixelX: number;
    continuousPixelY: number;
    semantics: "FITS-1-based-continuous-source-coordinate-not-pixel-sample";
    pixelSample: null;
    interpolationAllowed: false;
    nearestPixelAssignmentAllowed: false;
  }>;
  radiometry: Readonly<{
    intensity: null;
    reason: "no-admitted-radiometric-payload";
  }>;
  uncertainty: readonly KerrSparseUncertaintyReferenceV474[];
  sourceAuthoritySha256: Readonly<{
    geometry: string;
    polarization: string;
    screenCoordinate: string;
    wcs: string;
    orientationBasis: string;
  }>;
  rowSha256: string;
}>;

export type KerrSparseSciencePayloadArtifactV474 = Readonly<{
  version: typeof KERR_SPARSE_SCIENCE_PAYLOAD_ARTIFACT_VERSION_V474;
  generatedAt: string;
  status: "sparse-science-envelope-qualified-production-payload-blocked-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    rowCount: 4;
    uncertaintyReferenceCountPerRow: 7;
    atomicJoinRequired: true;
    exactRayIdJoinRequired: true;
    exactRayIndexJoinRequired: true;
    sourceShaRequired: true;
    rowShaRequired: true;
    payloadShaRequired: true;
    continuousCoordinateIsNotPixelSample: true;
    orientationBasisIsNotStokes: true;
    sparseAuthorityIsNotDenseAuthority: true;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  join: Readonly<{
    sourceRowCounts: Readonly<{ v419: 4; v420: 4; v422: 4 }>;
    joinedRowCount: 4;
    exactJoinKeyCount: 4;
    duplicateJoinKeyCount: 0;
    missingJoinKeyCount: 0;
    classificationMismatchCount: 0;
    spinMismatchCount: 0;
    redshiftMismatchCount: 0;
    evpaMismatchCount: 0;
    coordinateMismatchCount: 0;
    maximumContinuousCoordinateDifference: number;
    maximumEvpaDifferenceDeg: number;
    atomicJoinCommitted: true;
    partialJoinPublished: false;
  }>;
  rows: readonly KerrSparseSciencePayloadRowV474[];
  payloadSha256: string;
  qualification: Readonly<{
    sparseAuthorityQualified: true;
    provenanceJoined: true;
    uncertaintyJoined: true;
    applicabilityExplicit: true;
    denseAuthorityQualified: false;
    productionPayloadQualified: false;
    scienceRasterQualified: false;
    fitsImageQualified: false;
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
    offlineSparseEnvelopeBuilt: true;
    productionSciencePayloadAllowed: false;
    sciencePixelRows: 0;
    stokesMeasurementRows: 0;
    fitsImageRows: 0;
    runtimeSciencePayloadMutationAllowed: false;
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

export type KerrSparseSciencePayloadSummaryV474 = Readonly<{
  version: typeof KERR_SPARSE_SCIENCE_PAYLOAD_SUMMARY_VERSION_V474;
  status: KerrSparseSciencePayloadArtifactV474["status"];
  artifactSha256: string;
  payloadSha256: string;
  contract: KerrSparseSciencePayloadArtifactV474["contract"];
  join: KerrSparseSciencePayloadArtifactV474["join"];
  rows: KerrSparseSciencePayloadArtifactV474["rows"];
  qualification: KerrSparseSciencePayloadArtifactV474["qualification"];
  lifecycle: KerrSparseSciencePayloadArtifactV474["lifecycle"];
  boundary: KerrSparseSciencePayloadArtifactV474["boundary"];
}>;

export type KerrSparseSciencePayloadApiV474 = Readonly<{
  version: typeof KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrSparseSciencePayloadSummaryV474 | null;
}>;

export function parseKerrSparseSciencePayloadArtifactV474(
  value: unknown,
): KerrSparseSciencePayloadArtifactV474 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSparseSciencePayloadArtifactV474>)
      : null;
  const rows = artifact?.rows;

  if (
    !artifact ||
    artifact.version !== KERR_SPARSE_SCIENCE_PAYLOAD_ARTIFACT_VERSION_V474 ||
    artifact.status !==
      "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.rowCount !== 4 ||
    artifact.contract.uncertaintyReferenceCountPerRow !== 7 ||
    artifact.contract.atomicJoinRequired !== true ||
    artifact.contract.exactRayIdJoinRequired !== true ||
    artifact.contract.exactRayIndexJoinRequired !== true ||
    artifact.contract.sourceShaRequired !== true ||
    artifact.contract.rowShaRequired !== true ||
    artifact.contract.payloadShaRequired !== true ||
    artifact.contract.continuousCoordinateIsNotPixelSample !== true ||
    artifact.contract.orientationBasisIsNotStokes !== true ||
    artifact.contract.sparseAuthorityIsNotDenseAuthority !== true ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.join?.sourceRowCounts.v419 !== 4 ||
    artifact.join.sourceRowCounts.v420 !== 4 ||
    artifact.join.sourceRowCounts.v422 !== 4 ||
    artifact.join.joinedRowCount !== 4 ||
    artifact.join.exactJoinKeyCount !== 4 ||
    artifact.join.duplicateJoinKeyCount !== 0 ||
    artifact.join.missingJoinKeyCount !== 0 ||
    artifact.join.classificationMismatchCount !== 0 ||
    artifact.join.spinMismatchCount !== 0 ||
    artifact.join.redshiftMismatchCount !== 0 ||
    artifact.join.evpaMismatchCount !== 0 ||
    artifact.join.coordinateMismatchCount !== 0 ||
    artifact.join.atomicJoinCommitted !== true ||
    artifact.join.partialJoinPublished !== false ||
    !rows ||
    rows.length !== 4 ||
    rows.some(
      (row, index) =>
        row.rayId !== ("disk-0" + index) ||
        row.rayIndex !== 12 + index ||
        row.observer.family !== "finite-distance-ZAMO" ||
        row.observer.radiusM !== 30 ||
        row.observer.inclinationDeg !== 70 ||
        row.observer.azimuthDeg !== 0 ||
        row.geometry.classification !== "disk-hit" ||
        !Number.isFinite(row.geometry.emissionRadiusM) ||
        !Number.isFinite(row.geometry.redshiftFactor) ||
        !Number.isFinite(row.polarization.evpaDeg) ||
        !Number.isFinite(row.polarization.orientationQHat) ||
        !Number.isFinite(row.polarization.orientationUHat) ||
        row.polarization.orientationAvailable !== true ||
        row.polarization.polarizationAmplitude !== null ||
        row.polarization.stokesI !== null ||
        row.polarization.stokesQ !== null ||
        row.polarization.stokesU !== null ||
        row.polarization.stokesV !== null ||
        row.coordinate.semantics !==
          "FITS-1-based-continuous-source-coordinate-not-pixel-sample" ||
        row.coordinate.pixelSample !== null ||
        row.coordinate.interpolationAllowed !== false ||
        row.coordinate.nearestPixelAssignmentAllowed !== false ||
        row.radiometry.intensity !== null ||
        row.radiometry.reason !== "no-admitted-radiometric-payload" ||
        row.uncertainty.length !== 7 ||
        row.uncertainty.some(
          (entry) =>
            !SHA256.test(entry.ledgerArtifactSha256) ||
            !Number.isFinite(entry.combinedValue) ||
            entry.productionBudgetClosed !== false,
        ) ||
        Object.values(row.sourceAuthoritySha256).some((sha) => !SHA256.test(sha)) ||
        !SHA256.test(row.rowSha256),
    ) ||
    new Set(rows.map((row) => row.rayId)).size !== 4 ||
    !SHA256.test(artifact.payloadSha256 ?? "") ||
    artifact.qualification?.sparseAuthorityQualified !== true ||
    artifact.qualification.provenanceJoined !== true ||
    artifact.qualification.uncertaintyJoined !== true ||
    artifact.qualification.applicabilityExplicit !== true ||
    artifact.qualification.denseAuthorityQualified !== false ||
    artifact.qualification.productionPayloadQualified !== false ||
    artifact.qualification.scienceRasterQualified !== false ||
    artifact.qualification.fitsImageQualified !== false ||
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
    artifact.boundary?.offlineSparseEnvelopeBuilt !== true ||
    artifact.boundary.productionSciencePayloadAllowed !== false ||
    artifact.boundary.sciencePixelRows !== 0 ||
    artifact.boundary.stokesMeasurementRows !== 0 ||
    artifact.boundary.fitsImageRows !== 0 ||
    artifact.boundary.runtimeSciencePayloadMutationAllowed !== false ||
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
    throw new Error("v474-sparse-science-payload-identity");
  }
  return freezeDeep(value as KerrSparseSciencePayloadArtifactV474);
}

export function createKerrSparseSciencePayloadSummaryV474(
  value: unknown,
): KerrSparseSciencePayloadSummaryV474 {
  const artifact = parseKerrSparseSciencePayloadArtifactV474(value);
  return freezeDeep({
    version: KERR_SPARSE_SCIENCE_PAYLOAD_SUMMARY_VERSION_V474,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    payloadSha256: artifact.payloadSha256,
    contract: artifact.contract,
    join: artifact.join,
    rows: artifact.rows,
    qualification: artifact.qualification,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrSparseSciencePayloadApiV474(
  value: unknown,
): KerrSparseSciencePayloadApiV474 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrSparseSciencePayloadApiV474>)
      : null;
  if (
    !api ||
    api.version !== KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v474-sparse-science-payload-api-identity");
  }
  return freezeDeep(value as KerrSparseSciencePayloadApiV474);
}
