export const KERR_DETECTOR_RESPONSE_COMPOSITION_VERSION_V452 =
  "v452-kerr-detector-response-composition-v1" as const;
export const KERR_DETECTOR_RESPONSE_COMPOSITION_ARTIFACT_VERSION_V452 =
  "v452-kerr-detector-response-composition-artifact-v1" as const;
export const KERR_DETECTOR_RESPONSE_COMPOSITION_SUMMARY_VERSION_V452 =
  "v452-kerr-detector-response-composition-summary-v1" as const;
export const KERR_DETECTOR_RESPONSE_COMPOSITION_API_VERSION_V452 =
  "v452-kerr-detector-response-composition-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child);
    }
  }
  return value;
};
const neumaier = (values: readonly number[]): number => {
  let sum = 0;
  let correction = 0;
  for (const value of values) {
    const next = sum + value;
    correction +=
      Math.abs(sum) >= Math.abs(value)
        ? sum - next + value
        : value - next + sum;
    sum = next;
  }
  return sum + correction;
};

export type KerrDetectorResponseSemanticsV452 =
  | "throughput-includes-detector-qe"
  | "throughput-excludes-detector-qe";

export type KerrDetectorResponseCompositionInputV452 = Readonly<{
  sourceKind: "test-fixture";
  fixtureId: string;
  rayIndex: 12 | 13 | 14 | 15;
  semantics: KerrDetectorResponseSemanticsV452;
  sourcePhotonRadiancePerSM2Sr: number;
  geometricAreaM2WithoutThroughput: number;
  pixelSolidAngleSr: number;
  exposureSeconds: number;
  throughputFraction: number;
  detectorQuantumEfficiencyFraction: number;
  backgroundElectronPerSecondPerPixel: number;
  darkCurrentElectronPerSecondPerPixel: number;
  gainElectronPerAdu: number;
}>;

export type KerrDetectorResponseCompositionResultV452 = Readonly<{
  version: typeof KERR_DETECTOR_RESPONSE_COMPOSITION_VERSION_V452;
  fixtureId: string;
  rayIndex: 12 | 13 | 14 | 15;
  semantics: KerrDetectorResponseSemanticsV452;
  effectiveThroughputFraction: number;
  effectiveDetectorQuantumEfficiencyFraction: number;
  photonToElectronFactor: number;
  sourceExpectedElectrons: number;
  backgroundExpectedElectrons: number;
  darkExpectedElectrons: number;
  totalExpectedElectrons: number;
  expectedAduDiagnostic: number;
  gainAppliedOnlyAfterElectronExpectation: true;
  throughputAppliedExactlyOnce: true;
  sourceBackgroundDarkSeparated: true;
  observedCountsApplicable: false;
  expectedAduAuthority: false;
  measuredDetectorAuthority: false;
  scienceRasterAllowed: false;
  fixtureOnly: true;
}>;

export type KerrDetectorResponseCompositionArtifactV452 = Readonly<{
  version: typeof KERR_DETECTOR_RESPONSE_COMPOSITION_ARTIFACT_VERSION_V452;
  generatedAt: string;
  status: "qualified-unit-response-composition-fixture-only-measured-authority-unavailable";
  source: Readonly<{
    v451AdmissionArtifactSha256: string;
    v447ArtifactSha256: string;
    v449ArtifactSha256: string;
  }>;
  rows: readonly KerrDetectorResponseCompositionResultV452[];
  counts: Readonly<{
    fixtureRowCount: 4;
    includesQeRows: 2;
    excludesQeRows: 2;
    measuredRowCount: 0;
    observedCountRowCount: 0;
    scienceRasterRowCount: 0;
  }>;
  maxima: Readonly<{
    oracleSourceRelative: number;
    oracleTotalRelative: number;
    oracleAduRelative: number;
    conservationRelative: number;
    limit: 1e-12;
    qualified: true;
  }>;
  semanticContract: Readonly<{
    collectingAreaExcludesThroughput: true;
    throughputNotDoubleApplied: true;
    qeModeExplicit: true;
    gainExcludedFromElectronExpectation: true;
    backgroundAndDarkSeparated: true;
    normalLikelihoodAuthorityNotGranted: true;
  }>;
  qualification: Readonly<{
    unitResponseCompositionQualified: true;
    pythonDecimalOracleQualified: true;
    deterministicReplayQualified: true;
    throughputModeBoundaryQualified: true;
    gainBoundaryQualified: true;
    measuredDetectorAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceRasterAllowed: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    v451AdmissionStatus: "blocked-v443-detector-inputs-missing";
    fixtureJoinAllowed: true;
    measuredProjectionAllowed: false;
    expectedAduAuthority: false;
    scienceImageMaterializationAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrDetectorResponseCompositionSummaryV452 = Readonly<{
  version: typeof KERR_DETECTOR_RESPONSE_COMPOSITION_SUMMARY_VERSION_V452;
  status: KerrDetectorResponseCompositionArtifactV452["status"];
  artifactSha256: string;
  rows: readonly KerrDetectorResponseCompositionResultV452[];
  counts: KerrDetectorResponseCompositionArtifactV452["counts"];
  maxima: KerrDetectorResponseCompositionArtifactV452["maxima"];
  semanticContract: KerrDetectorResponseCompositionArtifactV452["semanticContract"];
  qualification: KerrDetectorResponseCompositionArtifactV452["qualification"];
  boundary: KerrDetectorResponseCompositionArtifactV452["boundary"];
}>;

export type KerrDetectorResponseCompositionApiV452 = Readonly<{
  version: typeof KERR_DETECTOR_RESPONSE_COMPOSITION_API_VERSION_V452;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrDetectorResponseCompositionSummaryV452 | null;
}>;

function assertInput(input: KerrDetectorResponseCompositionInputV452): void {
  const positive = [
    input.sourcePhotonRadiancePerSM2Sr,
    input.geometricAreaM2WithoutThroughput,
    input.pixelSolidAngleSr,
    input.exposureSeconds,
    input.throughputFraction,
    input.detectorQuantumEfficiencyFraction,
    input.gainElectronPerAdu,
  ];
  if (
    input.sourceKind !== "test-fixture" ||
    !/^[a-z0-9-]{1,64}$/.test(input.fixtureId) ||
    ![12, 13, 14, 15].includes(input.rayIndex) ||
    ![
      "throughput-includes-detector-qe",
      "throughput-excludes-detector-qe",
    ].includes(input.semantics) ||
    positive.some((value) => !finite(value) || value <= 0) ||
    input.throughputFraction > 1 ||
    input.detectorQuantumEfficiencyFraction > 1 ||
    !finite(input.backgroundElectronPerSecondPerPixel) ||
    input.backgroundElectronPerSecondPerPixel < 0 ||
    !finite(input.darkCurrentElectronPerSecondPerPixel) ||
    input.darkCurrentElectronPerSecondPerPixel < 0 ||
    (input.semantics === "throughput-includes-detector-qe" &&
      input.detectorQuantumEfficiencyFraction !== 1)
  ) {
    throw new Error("v452-response-composition-input-boundary");
  }
}

export function computeKerrDetectorResponseCompositionV452(
  input: KerrDetectorResponseCompositionInputV452,
): KerrDetectorResponseCompositionResultV452 {
  assertInput(input);
  const effectiveThroughputFraction = input.throughputFraction;
  const effectiveDetectorQuantumEfficiencyFraction =
    input.semantics === "throughput-includes-detector-qe"
      ? 1
      : input.detectorQuantumEfficiencyFraction;
  const photonToElectronFactor =
    effectiveThroughputFraction * effectiveDetectorQuantumEfficiencyFraction;
  const sourceExpectedElectrons =
    input.sourcePhotonRadiancePerSM2Sr *
    input.geometricAreaM2WithoutThroughput *
    input.pixelSolidAngleSr *
    input.exposureSeconds *
    photonToElectronFactor;
  const backgroundExpectedElectrons =
    input.backgroundElectronPerSecondPerPixel * input.exposureSeconds;
  const darkExpectedElectrons =
    input.darkCurrentElectronPerSecondPerPixel * input.exposureSeconds;
  const totalExpectedElectrons = neumaier([
    sourceExpectedElectrons,
    backgroundExpectedElectrons,
    darkExpectedElectrons,
  ]);
  const expectedAduDiagnostic = totalExpectedElectrons / input.gainElectronPerAdu;
  if (
    ![
      photonToElectronFactor,
      sourceExpectedElectrons,
      backgroundExpectedElectrons,
      darkExpectedElectrons,
      totalExpectedElectrons,
      expectedAduDiagnostic,
    ].every((value) => finite(value) && value >= 0) ||
    Math.abs(
      totalExpectedElectrons -
        neumaier([
          sourceExpectedElectrons,
          backgroundExpectedElectrons,
          darkExpectedElectrons,
        ]),
    ) /
      Math.max(Number.MIN_VALUE, totalExpectedElectrons) >
      1e-15
  ) {
    throw new Error("v452-response-composition-invariant");
  }
  return freeze({
    version: KERR_DETECTOR_RESPONSE_COMPOSITION_VERSION_V452,
    fixtureId: input.fixtureId,
    rayIndex: input.rayIndex,
    semantics: input.semantics,
    effectiveThroughputFraction,
    effectiveDetectorQuantumEfficiencyFraction,
    photonToElectronFactor,
    sourceExpectedElectrons,
    backgroundExpectedElectrons,
    darkExpectedElectrons,
    totalExpectedElectrons,
    expectedAduDiagnostic,
    gainAppliedOnlyAfterElectronExpectation: true,
    throughputAppliedExactlyOnce: true,
    sourceBackgroundDarkSeparated: true,
    observedCountsApplicable: false,
    expectedAduAuthority: false,
    measuredDetectorAuthority: false,
    scienceRasterAllowed: false,
    fixtureOnly: true,
  });
}

const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}
export const canonicalPayloadV452 = (value: unknown): string => JSON.stringify(canonicalize(value));

function validRow(value: unknown): value is KerrDetectorResponseCompositionResultV452 {
  const row = value as Partial<KerrDetectorResponseCompositionResultV452> | null;
  return Boolean(
    row &&
      row.version === KERR_DETECTOR_RESPONSE_COMPOSITION_VERSION_V452 &&
      typeof row.fixtureId === "string" &&
      [12, 13, 14, 15].includes(row.rayIndex ?? -1) &&
      ["throughput-includes-detector-qe", "throughput-excludes-detector-qe"].includes(row.semantics ?? "") &&
      [row.effectiveThroughputFraction, row.effectiveDetectorQuantumEfficiencyFraction, row.photonToElectronFactor, row.sourceExpectedElectrons, row.backgroundExpectedElectrons, row.darkExpectedElectrons, row.totalExpectedElectrons, row.expectedAduDiagnostic].every((value) => finite(value) && value >= 0) &&
      row.gainAppliedOnlyAfterElectronExpectation === true &&
      row.throughputAppliedExactlyOnce === true &&
      row.sourceBackgroundDarkSeparated === true &&
      row.observedCountsApplicable === false &&
      row.expectedAduAuthority === false &&
      row.measuredDetectorAuthority === false &&
      row.scienceRasterAllowed === false &&
      row.fixtureOnly === true,
  );
}

export function parseKerrDetectorResponseCompositionArtifactV452(
  value: unknown,
): KerrDetectorResponseCompositionArtifactV452 {
  const artifact = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrDetectorResponseCompositionArtifactV452>
    : null;
  if (
    !artifact ||
    artifact.version !== KERR_DETECTOR_RESPONSE_COMPOSITION_ARTIFACT_VERSION_V452 ||
    artifact.status !== "qualified-unit-response-composition-fixture-only-measured-authority-unavailable" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !SHA256.test(entry)) ||
    artifact.rows?.length !== 4 ||
    artifact.rows.some((row) => !validRow(row)) ||
    artifact.counts?.fixtureRowCount !== 4 ||
    artifact.counts.includesQeRows !== 2 ||
    artifact.counts.excludesQeRows !== 2 ||
    artifact.counts.measuredRowCount !== 0 ||
    artifact.counts.observedCountRowCount !== 0 ||
    artifact.counts.scienceRasterRowCount !== 0 ||
    !artifact.maxima ||
    artifact.maxima.oracleSourceRelative >= 1e-12 ||
    artifact.maxima.oracleTotalRelative >= 1e-12 ||
    artifact.maxima.oracleAduRelative >= 1e-12 ||
    artifact.maxima.conservationRelative > 1e-15 ||
    artifact.maxima.limit !== 1e-12 ||
    artifact.maxima.qualified !== true ||
    artifact.semanticContract?.collectingAreaExcludesThroughput !== true ||
    artifact.semanticContract.throughputNotDoubleApplied !== true ||
    artifact.semanticContract.qeModeExplicit !== true ||
    artifact.semanticContract.gainExcludedFromElectronExpectation !== true ||
    artifact.semanticContract.backgroundAndDarkSeparated !== true ||
    artifact.semanticContract.normalLikelihoodAuthorityNotGranted !== true ||
    artifact.qualification?.unitResponseCompositionQualified !== true ||
    artifact.qualification.pythonDecimalOracleQualified !== true ||
    artifact.qualification.deterministicReplayQualified !== true ||
    artifact.qualification.throughputModeBoundaryQualified !== true ||
    artifact.qualification.gainBoundaryQualified !== true ||
    artifact.qualification.measuredDetectorAuthorityGranted !== false ||
    artifact.qualification.observedCountsAvailable !== false ||
    artifact.qualification.scienceRasterAllowed !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.boundary?.v451AdmissionStatus !== "blocked-v443-detector-inputs-missing" ||
    artifact.boundary.fixtureJoinAllowed !== true ||
    artifact.boundary.measuredProjectionAllowed !== false ||
    artifact.boundary.expectedAduAuthority !== false ||
    artifact.boundary.scienceImageMaterializationAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v452-response-composition-artifact-identity");
  }
  return freeze(value as KerrDetectorResponseCompositionArtifactV452);
}

export function createKerrDetectorResponseCompositionSummaryV452(
  value: unknown,
): KerrDetectorResponseCompositionSummaryV452 {
  const artifact = parseKerrDetectorResponseCompositionArtifactV452(value);
  return freeze({
    version: KERR_DETECTOR_RESPONSE_COMPOSITION_SUMMARY_VERSION_V452,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    rows: artifact.rows,
    counts: artifact.counts,
    maxima: artifact.maxima,
    semanticContract: artifact.semanticContract,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
  });
}

export function parseKerrDetectorResponseCompositionApiV452(
  value: unknown,
): KerrDetectorResponseCompositionApiV452 {
  const api = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrDetectorResponseCompositionApiV452>
    : null;
  if (
    !api ||
    api.version !== KERR_DETECTOR_RESPONSE_COMPOSITION_API_VERSION_V452 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) throw new Error("v452-response-composition-api-identity");
  return freeze(value as KerrDetectorResponseCompositionApiV452);
}
