export const KERR_INSTRUMENT_AUTHORITY_MATRIX_VERSION_V511 =
  "v511-kerr-instrument-authority-matrix-v1" as const;
export const KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511 =
  "v511-kerr-instrument-authority-matrix-api-v1" as const;

export const KERR_INSTRUMENT_AUTHORITY_STAGE_IDS_V511 = Object.freeze([
  "v444-photon-response",
  "v445-electron-preflight",
  "v452-response-composition",
  "v458-measured-intake",
  "v465-response-contract",
  "v510-portable-provenance",
] as const);

export type KerrInstrumentAuthorityStageIdV511 =
  (typeof KERR_INSTRUMENT_AUTHORITY_STAGE_IDS_V511)[number];

export type KerrInstrumentAuthorityStageV511 = Readonly<{
  id: KerrInstrumentAuthorityStageIdV511;
  sourceVersion: string;
  sourceArtifactSha256: string;
  authorityClass:
    | "computational-photon-observable"
    | "blocked-prerequisites"
    | "validation-fixture-only"
    | "measured-intake-blocked"
    | "response-contract-only"
    | "portable-provenance";
  inputRows: number;
  outputRows: number;
  measuredRows: 0;
  authorityGranted: boolean;
  detectorResponseAvailable: false;
  observedCountsAvailable: false;
  scienceRasterAvailable: false;
  reason: string;
}>;

export type KerrInstrumentAuthorityMatrixArtifactV511 = Readonly<{
  version: typeof KERR_INSTRUMENT_AUTHORITY_MATRIX_VERSION_V511;
  generatedAt: string;
  status: "instrument-authority-matrix-qualified-measured-response-blocked";
  source: Readonly<{
    v444ArtifactSha256: string;
    v445ArtifactSha256: string;
    v452ArtifactSha256: string;
    v458ArtifactSha256: string;
    v465ArtifactSha256: string;
    v510ArtifactSha256: string;
    v510EnvelopeSha256: string;
  }>;
  stages: readonly KerrInstrumentAuthorityStageV511[];
  dimensionalContract: Readonly<{
    sourceObservable: "photon-radiance-per-second-per-square-metre-per-steradian";
    electronExpectationEquation:
      "integral-Lph-times-area-times-solid-angle-times-exposure-times-response-plus-backgrounds";
    responseAppliedExactlyOnce: true;
    collectingAreaGeometricOnly: true;
    gainAppliedAfterElectronExpectation: true;
    psfAndDistortionAppliedBeforeRasterQualification: true;
    missingQuantityPolicy: "null-not-zero";
  }>;
  transitions: readonly Readonly<{
    id: "radiance-to-electrons" | "electrons-to-adu" | "adu-to-science-raster";
    status: "blocked";
    missingAuthorities: readonly string[];
    syntheticFallbackAllowed: false;
  }>[];
  counts: Readonly<{
    stageCount: 6;
    sourcePhotonRows: 4;
    computationalFixtureRows: 4;
    measuredCalibrationFiles: 0;
    requiredMeasuredCalibrationFiles: 6;
    measuredResponseRows: 0;
    electronExpectationRows: 0;
    observedCountRows: 0;
    sciencePixelRows: 0;
  }>;
  qualification: Readonly<{
    sourceChainCanonicalShaQualified: true;
    dimensionalContractQualified: true;
    responseDoubleCountingFirewallQualified: true;
    syntheticAuthorityFirewallQualified: true;
    portableProvenanceQualified: true;
    measuredDetectorAuthorityGranted: false;
    productionResponseQualified: false;
    scienceRasterQualified: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    detectorResponseAvailable: false;
    observedCountsAvailable: false;
    observedIntensityAvailable: false;
    scienceRasterAvailable: false;
    fitsProducts: 0;
    pngProducts: 0;
    denseCampaignStatus: "incomplete-0-of-49";
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrInstrumentAuthorityMatrixSummaryV511 = Pick<
  KerrInstrumentAuthorityMatrixArtifactV511,
  | "version"
  | "status"
  | "source"
  | "stages"
  | "dimensionalContract"
  | "transitions"
  | "counts"
  | "qualification"
  | "boundary"
  | "artifactSha256"
>;

export type KerrInstrumentAuthorityMatrixApiV511 = Readonly<{
  version: typeof KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrInstrumentAuthorityMatrixSummaryV511 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalKerrInstrumentAuthorityMatrixV511 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export function parseKerrInstrumentAuthorityMatrixArtifactV511(
  value: unknown,
): KerrInstrumentAuthorityMatrixArtifactV511 {
  if (!isRecord(value)) throw new Error("v511-matrix-shape");
  const artifact = value as Partial<KerrInstrumentAuthorityMatrixArtifactV511>;
  if (
    artifact.version !== KERR_INSTRUMENT_AUTHORITY_MATRIX_VERSION_V511 ||
    artifact.status !== "instrument-authority-matrix-qualified-measured-response-blocked" ||
    !isRecord(artifact.source) ||
    Object.values(artifact.source).some((entry) => !SHA256.test(String(entry))) ||
    !Array.isArray(artifact.stages) ||
    artifact.stages.length !== 6 ||
    artifact.stages.some(
      (stage, index) =>
        stage.id !== KERR_INSTRUMENT_AUTHORITY_STAGE_IDS_V511[index] ||
        !SHA256.test(stage.sourceArtifactSha256) ||
        stage.measuredRows !== 0 ||
        stage.detectorResponseAvailable !== false ||
        stage.observedCountsAvailable !== false ||
        stage.scienceRasterAvailable !== false ||
        stage.inputRows < 0 ||
        stage.outputRows < 0,
    ) ||
    artifact.stages[0].authorityGranted !== true ||
    artifact.stages.slice(1).some((stage) => stage.authorityGranted !== false) ||
    artifact.dimensionalContract?.responseAppliedExactlyOnce !== true ||
    artifact.dimensionalContract.collectingAreaGeometricOnly !== true ||
    artifact.dimensionalContract.gainAppliedAfterElectronExpectation !== true ||
    artifact.dimensionalContract.missingQuantityPolicy !== "null-not-zero" ||
    !Array.isArray(artifact.transitions) ||
    artifact.transitions.length !== 3 ||
    artifact.transitions.some(
      (transition) =>
        transition.status !== "blocked" ||
        transition.missingAuthorities.length === 0 ||
        transition.syntheticFallbackAllowed !== false,
    ) ||
    artifact.counts?.stageCount !== 6 ||
    artifact.counts.sourcePhotonRows !== 4 ||
    artifact.counts.computationalFixtureRows !== 4 ||
    artifact.counts.measuredCalibrationFiles !== 0 ||
    artifact.counts.requiredMeasuredCalibrationFiles !== 6 ||
    artifact.counts.measuredResponseRows !== 0 ||
    artifact.counts.electronExpectationRows !== 0 ||
    artifact.counts.observedCountRows !== 0 ||
    artifact.counts.sciencePixelRows !== 0 ||
    artifact.qualification?.sourceChainCanonicalShaQualified !== true ||
    artifact.qualification.dimensionalContractQualified !== true ||
    artifact.qualification.responseDoubleCountingFirewallQualified !== true ||
    artifact.qualification.syntheticAuthorityFirewallQualified !== true ||
    artifact.qualification.portableProvenanceQualified !== true ||
    artifact.qualification.measuredDetectorAuthorityGranted !== false ||
    artifact.qualification.productionResponseQualified !== false ||
    artifact.qualification.scienceRasterQualified !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.boundary?.detectorResponseAvailable !== false ||
    artifact.boundary.observedCountsAvailable !== false ||
    artifact.boundary.observedIntensityAvailable !== false ||
    artifact.boundary.scienceRasterAvailable !== false ||
    artifact.boundary.fitsProducts !== 0 ||
    artifact.boundary.pngProducts !== 0 ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.formalProductPointer !== "v263" ||
    artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some(
      (entry) => !entry.path || !SHA256.test(entry.sha256),
    ) ||
    !SHA256.test(artifact.sourceSha256 ?? "") ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v511-instrument-authority-matrix-boundary");
  }
  return artifact as KerrInstrumentAuthorityMatrixArtifactV511;
}

export function createKerrInstrumentAuthorityMatrixSummaryV511(
  value: unknown,
): KerrInstrumentAuthorityMatrixSummaryV511 {
  const artifact = parseKerrInstrumentAuthorityMatrixArtifactV511(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    stages: artifact.stages,
    dimensionalContract: artifact.dimensionalContract,
    transitions: artifact.transitions,
    counts: artifact.counts,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

function validateKerrInstrumentAuthorityMatrixSummaryV511(
  value: unknown,
): asserts value is KerrInstrumentAuthorityMatrixSummaryV511 {
  if (!isRecord(value)) throw new Error("v511-matrix-summary-shape");
  parseKerrInstrumentAuthorityMatrixArtifactV511({
    ...value,
    generatedAt: "summary-validation-only",
    sourceManifest: [],
    sourceSha256: "0".repeat(64),
  });
}

export function parseKerrInstrumentAuthorityMatrixApiV511(
  value: unknown,
): KerrInstrumentAuthorityMatrixApiV511 {
  if (!isRecord(value)) throw new Error("v511-matrix-api-shape");
  if (
    value.version !== KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v511-matrix-api-boundary");
  }
  if (value.available) {
    validateKerrInstrumentAuthorityMatrixSummaryV511(value.summary);
  } else if (value.summary !== null) {
    throw new Error("v511-matrix-api-unavailable-summary");
  }
  return value as unknown as KerrInstrumentAuthorityMatrixApiV511;
}
