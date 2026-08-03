export const KERR_DIMENSIONLESS_PHOTON_ATLAS_VERSION_V487 =
  "v487-kerr-dimensionless-photon-atlas-artifact-v1" as const;
export const KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487 =
  "v487-kerr-dimensionless-photon-atlas-api-v1" as const;

export interface KerrDimensionlessLandmarkV487 {
  id: string;
  anchorIndex: number;
  emitterCoordinate: number;
  observerCoordinate: number;
  observerCoordinateUncertaintyUpperBound: number;
  relativeCoordinateUncertaintyUpperBound: number;
  applicability: "dimensionless-feature-position-only";
}

export interface KerrDimensionlessPhotonRayV487 {
  rayId: string;
  redshiftFactor: number;
  shiftClass: "blueshift" | "redshift";
  coordinateSystem: "dimensionless-frequency-over-unspecified-reference";
  landmarks: readonly KerrDimensionlessLandmarkV487[];
  commonScaleMode: Readonly<{
    projectedCoordinate: number;
    varianceUpperBound: number;
    standardDeviationUpperBoundDisplayOnly: number;
    interpretation: "deterministic-upper-bound-not-1sigma";
  }>;
  identifiability: Readonly<{
    identifiableDimension: 1;
    unidentifiableDimension: 4;
    fullConditionNumber: "infinite-singular";
    fisherInformationAuthorityGranted: false;
    likelihoodAuthorityGranted: false;
  }>;
  sourceIdentity: Readonly<Record<string, string>>;
}

export interface KerrDimensionlessPhotonAtlasArtifactV487 {
  version: typeof KERR_DIMENSIONLESS_PHOTON_ATLAS_VERSION_V487;
  status: "dimensionless-photon-atlas-qualified-physical-observables-blocked-browser-pending";
  contract: Readonly<{
    rayCount: 4;
    landmarkCount: 20;
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference";
    deterministicUpperBoundOnly: true;
    statisticalOneSigmaAuthorityGranted: false;
    diagnosticVectorPlotOnly: true;
    maximumResponseBytes: number;
    localShadowOnly: true;
    formalProductPointer: "v263";
  }>;
  rays: readonly KerrDimensionlessPhotonRayV487[];
  payloadSha256: string;
  vectorDiagnostic: Readonly<{
    path: string;
    mediaType: "image/svg+xml; charset=utf-8";
    width: number;
    height: number;
    fileSha256: string;
    deterministic: true;
    linearDisplay: true;
    bloomIntensity: 0;
    colorGradeIntensity: 0;
    scientificFieldMutationAllowed: false;
  }>;
  audit: Readonly<{
    joinedRayCount: 4;
    joinedLandmarkCount: 20;
    matrixElementCountCopied: 0;
    projectionRecordCountCopied: 0;
    detectorObservableRows: 0;
    observedIntensityRows: 0;
    sciencePixelRows: 0;
    fitsProducts: 0;
    pngProducts: 0;
  }>;
  boundary: Readonly<{
    dimensionlessCoordinateAtlasAuthorityGranted: true;
    diagnosticSvgAuthorityGranted: true;
    absoluteFrequencyAuthorityGranted: false;
    physicalLineIdentityAuthorityGranted: false;
    physicalBandpassAuthorityGranted: false;
    detectorThroughputAuthorityGranted: false;
    observedIntensityAuthorityGranted: false;
    statisticalLikelihoodAuthorityGranted: false;
    scienceRasterAuthorityGranted: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    denseShardRunAllowed: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
  }>;
  sourceSha256: string;
  artifactSha256: string;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
}

export type KerrDimensionlessPhotonAtlasSummaryV487 = Readonly<{
  version: typeof KERR_DIMENSIONLESS_PHOTON_ATLAS_VERSION_V487;
  status: KerrDimensionlessPhotonAtlasArtifactV487["status"];
  coordinateSystem: KerrDimensionlessPhotonAtlasArtifactV487["contract"]["coordinateSystem"];
  rays: readonly KerrDimensionlessPhotonRayV487[];
  payloadSha256: string;
  artifactSha256: string;
  svgSha256: string;
  svgHref: string;
  audit: KerrDimensionlessPhotonAtlasArtifactV487["audit"];
  boundary: KerrDimensionlessPhotonAtlasArtifactV487["boundary"];
}>;

export type KerrDimensionlessPhotonAtlasApiV487 = Readonly<{
  version: typeof KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487;
  available: boolean;
  reason: string;
  summary: KerrDimensionlessPhotonAtlasSummaryV487 | null;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isSha = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function canonicalKerrDimensionlessPhotonAtlasV487(value: unknown): string {
  const transient = new Set([
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "stageChainSha256",
    "evidenceSha256",
    "pointerSha256",
  ]);
  const normalize = (entry: unknown): unknown =>
    Array.isArray(entry)
      ? entry.map(normalize)
      : !isRecord(entry)
        ? entry
        : Object.fromEntries(
            Object.entries(entry)
              .filter(([key]) => !transient.has(key))
              .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
              .map(([key, nested]) => [key, normalize(nested)]),
          );
  return JSON.stringify(normalize(value));
}

export function parseKerrDimensionlessPhotonAtlasArtifactV487(
  value: unknown,
): KerrDimensionlessPhotonAtlasArtifactV487 {
  if (!isRecord(value) || value.version !== KERR_DIMENSIONLESS_PHOTON_ATLAS_VERSION_V487) {
    throw new Error("v487-atlas-version");
  }
  const contract = value.contract;
  const vector = value.vectorDiagnostic;
  const audit = value.audit;
  const boundary = value.boundary;
  if (
    value.status !== "dimensionless-photon-atlas-qualified-physical-observables-blocked-browser-pending" ||
    !isRecord(contract) ||
    contract.rayCount !== 4 ||
    contract.landmarkCount !== 20 ||
    contract.coordinateSystem !== "dimensionless-frequency-over-unspecified-reference" ||
    contract.deterministicUpperBoundOnly !== true ||
    contract.statisticalOneSigmaAuthorityGranted !== false ||
    contract.diagnosticVectorPlotOnly !== true ||
    contract.localShadowOnly !== true ||
    contract.formalProductPointer !== "v263" ||
    !Array.isArray(value.rays) ||
    value.rays.length !== 4 ||
    !isSha(value.payloadSha256) ||
    !isSha(value.artifactSha256) ||
    !isSha(value.sourceSha256) ||
    !isRecord(vector) ||
    !isSha(vector.fileSha256) ||
    vector.deterministic !== true ||
    vector.linearDisplay !== true ||
    vector.bloomIntensity !== 0 ||
    vector.colorGradeIntensity !== 0 ||
    vector.scientificFieldMutationAllowed !== false ||
    !isRecord(audit) ||
    audit.joinedRayCount !== 4 ||
    audit.joinedLandmarkCount !== 20 ||
    audit.matrixElementCountCopied !== 0 ||
    audit.projectionRecordCountCopied !== 0 ||
    audit.sciencePixelRows !== 0 ||
    !isRecord(boundary) ||
    boundary.dimensionlessCoordinateAtlasAuthorityGranted !== true ||
    boundary.scienceRasterAuthorityGranted !== false ||
    boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    boundary.browserQualification !== "not-run" ||
    value.formalProductPointer !== "v263" ||
    value.formalDefaultKernel !== "legacy-eih-1pn"
  ) {
    throw new Error("v487-atlas-boundary");
  }
  for (const ray of value.rays) {
    if (
      !isRecord(ray) ||
      typeof ray.rayId !== "string" ||
      !finite(ray.redshiftFactor) ||
      (ray.shiftClass !== "blueshift" && ray.shiftClass !== "redshift") ||
      !Array.isArray(ray.landmarks) ||
      ray.landmarks.length !== 5
    ) {
      throw new Error("v487-ray-shape");
    }
    for (const landmark of ray.landmarks) {
      if (
        !isRecord(landmark) ||
        !finite(landmark.emitterCoordinate) ||
        !finite(landmark.observerCoordinate) ||
        !finite(landmark.observerCoordinateUncertaintyUpperBound) ||
        landmark.applicability !== "dimensionless-feature-position-only"
      ) {
        throw new Error("v487-landmark-shape");
      }
    }
  }
  return value as unknown as KerrDimensionlessPhotonAtlasArtifactV487;
}

export function createKerrDimensionlessPhotonAtlasSummaryV487(
  value: unknown,
): KerrDimensionlessPhotonAtlasSummaryV487 {
  const artifact = parseKerrDimensionlessPhotonAtlasArtifactV487(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    coordinateSystem: artifact.contract.coordinateSystem,
    rays: artifact.rays,
    payloadSha256: artifact.payloadSha256,
    artifactSha256: artifact.artifactSha256,
    svgSha256: artifact.vectorDiagnostic.fileSha256,
    svgHref: "/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas?format=svg",
    audit: artifact.audit,
    boundary: artifact.boundary,
  });
}

export function parseKerrDimensionlessPhotonAtlasSummaryV487(
  value: unknown,
): KerrDimensionlessPhotonAtlasSummaryV487 {
  if (
    !isRecord(value) ||
    value.version !== KERR_DIMENSIONLESS_PHOTON_ATLAS_VERSION_V487 ||
    value.status !== "dimensionless-photon-atlas-qualified-physical-observables-blocked-browser-pending" ||
    value.coordinateSystem !== "dimensionless-frequency-over-unspecified-reference" ||
    !Array.isArray(value.rays) ||
    value.rays.length !== 4 ||
    value.rays.flatMap((ray) => isRecord(ray) && Array.isArray(ray.landmarks) ? ray.landmarks : []).length !== 20 ||
    !isSha(value.payloadSha256) ||
    !isSha(value.artifactSha256) ||
    !isSha(value.svgSha256) ||
    value.svgHref !== "/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas?format=svg" ||
    !isRecord(value.audit) ||
    value.audit.matrixElementCountCopied !== 0 ||
    value.audit.projectionRecordCountCopied !== 0 ||
    value.audit.sciencePixelRows !== 0 ||
    !isRecord(value.boundary) ||
    value.boundary.dimensionlessCoordinateAtlasAuthorityGranted !== true ||
    value.boundary.scienceRasterAuthorityGranted !== false ||
    value.boundary.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v487-summary-boundary");
  }
  return value as unknown as KerrDimensionlessPhotonAtlasSummaryV487;
}

export function parseKerrDimensionlessPhotonAtlasApiV487(
  value: unknown,
): KerrDimensionlessPhotonAtlasApiV487 {
  if (!isRecord(value) || value.version !== KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487) {
    throw new Error("v487-api-version");
  }
  if (typeof value.available !== "boolean" || typeof value.reason !== "string") {
    throw new Error("v487-api-shape");
  }
  if (value.available) parseKerrDimensionlessPhotonAtlasSummaryV487(value.summary);
  else if (value.summary !== null) throw new Error("v487-api-unavailable-summary");
  return value as unknown as KerrDimensionlessPhotonAtlasApiV487;
}
