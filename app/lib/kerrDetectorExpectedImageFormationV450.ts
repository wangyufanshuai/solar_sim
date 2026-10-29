export const KERR_DETECTOR_EXPECTED_IMAGE_VERSION_V450 =
  "v450-kerr-detector-expected-image-formation-v1" as const;
export const KERR_DETECTOR_EXPECTED_IMAGE_ARTIFACT_VERSION_V450 =
  "v450-kerr-detector-expected-image-formation-artifact-v1" as const;
export const KERR_DETECTOR_EXPECTED_IMAGE_SUMMARY_VERSION_V450 =
  "v450-kerr-detector-expected-image-formation-summary-v1" as const;
export const KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450 =
  "v450-kerr-detector-expected-image-formation-api-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
  }
  return value;
}

function neumaier(values: readonly number[]): number {
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
}

export type KerrDetectorExpectedImageInputV450 = Readonly<{
  sourceKind: "test-fixture";
  fixtureId: string;
  rayId: string;
  rayIndex: 12 | 13 | 14 | 15;
  width: 384;
  height: 384;
  pixelConvention: "FITS-one-based-continuous-pixel-centers";
  continuousPixelX: number;
  continuousPixelY: number;
  sourceExpectedElectrons: number;
}>;

export type KerrDetectorExpectedImageDepositV450 = Readonly<{
  pixelX: number;
  pixelY: number;
  linearIndexZeroBased: number;
  weight: number;
  expectedSourceElectrons: number;
}>;

export type KerrDetectorExpectedImageRowV450 = Readonly<{
  version: typeof KERR_DETECTOR_EXPECTED_IMAGE_VERSION_V450;
  fixtureId: string;
  rayId: string;
  rayIndex: 12 | 13 | 14 | 15;
  continuousPixelX: number;
  continuousPixelY: number;
  sourceExpectedElectrons: number;
  deposits: readonly KerrDetectorExpectedImageDepositV450[];
  depositWeightSum: number;
  depositElectronSum: number;
  weightConservationAbsolute: number;
  electronConservationRelative: number;
  kernel: "deterministic-bilinear-four-pixel-unit-normalized";
  coordinateAuthority: "v441-linear-wcs-qualified";
  electronExpectationAuthority: "v447-fixture-qualified";
  detectorGeometryAuthority: false;
  psfAuthority: false;
  pixelResponseAuthority: false;
  scienceRasterAuthority: false;
  observedImageAvailable: false;
  fixtureOnly: true;
}>;

export type KerrDetectorExpectedImageArtifactV450 = Readonly<{
  version: typeof KERR_DETECTOR_EXPECTED_IMAGE_ARTIFACT_VERSION_V450;
  generatedAt: string;
  status: "expected-electron-image-fixture-qualified-detector-projection-blocked";
  source: Readonly<{
    v441ArtifactSha256: string;
    v443ArtifactSha256: string;
    v447ArtifactSha256: string;
    v449ArtifactSha256: string;
    pythonOracleArtifactSha256: string;
  }>;
  wcs: Readonly<{
    name: "KERR-FINITE-ZAMO-LINEAR-384";
    width: 384;
    height: 384;
    pixelConvention: "FITS-one-based-continuous-pixel-centers";
  }>;
  rows: readonly KerrDetectorExpectedImageRowV450[];
  counts: Readonly<{
    sourceRowCount: 4;
    sparseDepositRowCount: 16;
    measuredDetectorGeometryRows: 0;
    psfRows: 0;
    pixelResponseRows: 0;
    scienceRasterRows: 0;
    observedImageRows: 0;
  }>;
  maxima: Readonly<{
    weightConservationAbsolute: number;
    electronConservationRelative: number;
    pythonWeightAbsoluteDifference: number;
    pythonElectronRelativeDifference: number;
    sourceCoordinateJoinResidualPixel: number;
  }>;
  qualification: Readonly<{
    wcsCoordinateAuthorityQualified: true;
    expectedElectronFormationFixtureQualified: true;
    deterministicReplayQualified: true;
    pythonDecimalOracleQualified: true;
    pixelIndexBoundaryQualified: true;
    detectorProjectionAuthority: false;
    psfAuthority: false;
    pixelResponseAuthority: false;
    scienceRasterAuthority: false;
    observedImageAvailable: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    sparseFixtureOnly: true;
    fullRasterMaterialized: false;
    pngGenerated: false;
    fitsGenerated: false;
    runtimeScienceImageAllowed: false;
    cinematicMayClaimDetectorImage: false;
  }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  networkAttempted: false;
  automaticRetryApplied: false;
  artifactSha256: string;
}>;

export type KerrDetectorExpectedImageSummaryV450 = Readonly<{
  version: typeof KERR_DETECTOR_EXPECTED_IMAGE_SUMMARY_VERSION_V450;
  status: KerrDetectorExpectedImageArtifactV450["status"];
  artifactSha256: string;
  wcs: KerrDetectorExpectedImageArtifactV450["wcs"];
  rows: readonly KerrDetectorExpectedImageRowV450[];
  counts: KerrDetectorExpectedImageArtifactV450["counts"];
  maxima: KerrDetectorExpectedImageArtifactV450["maxima"];
  qualification: KerrDetectorExpectedImageArtifactV450["qualification"];
  boundary: KerrDetectorExpectedImageArtifactV450["boundary"];
}>;

export type KerrDetectorExpectedImageApiV450 = Readonly<{
  version: typeof KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrDetectorExpectedImageSummaryV450 | null;
}>;

function assertInput(input: KerrDetectorExpectedImageInputV450): void {
  if (
    input.sourceKind !== "test-fixture" ||
    !/^[a-z0-9-]{1,64}$/.test(input.fixtureId) ||
    !/^[a-z0-9-]{1,64}$/.test(input.rayId) ||
    ![12, 13, 14, 15].includes(input.rayIndex) ||
    input.width !== 384 ||
    input.height !== 384 ||
    input.pixelConvention !== "FITS-one-based-continuous-pixel-centers" ||
    !finite(input.continuousPixelX) ||
    !finite(input.continuousPixelY) ||
    input.continuousPixelX <= 1 ||
    input.continuousPixelX >= input.width ||
    input.continuousPixelY <= 1 ||
    input.continuousPixelY >= input.height ||
    !finite(input.sourceExpectedElectrons) ||
    input.sourceExpectedElectrons <= 0
  ) {
    throw new Error("v450-image-formation-input-boundary");
  }
}

export function formKerrDetectorExpectedImageFixtureV450(
  input: KerrDetectorExpectedImageInputV450,
): KerrDetectorExpectedImageRowV450 {
  assertInput(input);
  const x0 = Math.floor(input.continuousPixelX);
  const y0 = Math.floor(input.continuousPixelY);
  const fractionX = input.continuousPixelX - x0;
  const fractionY = input.continuousPixelY - y0;
  const cells = [
    [x0, y0, (1 - fractionX) * (1 - fractionY)],
    [x0 + 1, y0, fractionX * (1 - fractionY)],
    [x0, y0 + 1, (1 - fractionX) * fractionY],
    [x0 + 1, y0 + 1, fractionX * fractionY],
  ] as const;
  const deposits = cells.map(([pixelX, pixelY, weight]) =>
    freezeDeep({
      pixelX,
      pixelY,
      linearIndexZeroBased: (pixelY - 1) * input.width + (pixelX - 1),
      weight,
      expectedSourceElectrons: input.sourceExpectedElectrons * weight,
    }),
  );
  const depositWeightSum = neumaier(deposits.map((entry) => entry.weight));
  const depositElectronSum = neumaier(
    deposits.map((entry) => entry.expectedSourceElectrons),
  );
  const weightConservationAbsolute = Math.abs(depositWeightSum - 1);
  const electronConservationRelative =
    Math.abs(depositElectronSum - input.sourceExpectedElectrons) /
    input.sourceExpectedElectrons;
  if (
    deposits.some(
      (entry) =>
        !Number.isInteger(entry.pixelX) ||
        !Number.isInteger(entry.pixelY) ||
        entry.pixelX < 1 ||
        entry.pixelX > input.width ||
        entry.pixelY < 1 ||
        entry.pixelY > input.height ||
        entry.linearIndexZeroBased < 0 ||
        entry.linearIndexZeroBased >= input.width * input.height ||
        !finite(entry.weight) ||
        entry.weight < 0 ||
        entry.weight > 1 ||
        !finite(entry.expectedSourceElectrons) ||
        entry.expectedSourceElectrons < 0,
    ) ||
    weightConservationAbsolute > 1e-15 ||
    electronConservationRelative > 1e-15
  ) {
    throw new Error("v450-image-formation-conservation");
  }
  return freezeDeep({
    version: KERR_DETECTOR_EXPECTED_IMAGE_VERSION_V450,
    fixtureId: input.fixtureId,
    rayId: input.rayId,
    rayIndex: input.rayIndex,
    continuousPixelX: input.continuousPixelX,
    continuousPixelY: input.continuousPixelY,
    sourceExpectedElectrons: input.sourceExpectedElectrons,
    deposits,
    depositWeightSum,
    depositElectronSum,
    weightConservationAbsolute,
    electronConservationRelative,
    kernel: "deterministic-bilinear-four-pixel-unit-normalized",
    coordinateAuthority: "v441-linear-wcs-qualified",
    electronExpectationAuthority: "v447-fixture-qualified",
    detectorGeometryAuthority: false,
    psfAuthority: false,
    pixelResponseAuthority: false,
    scienceRasterAuthority: false,
    observedImageAvailable: false,
    fixtureOnly: true,
  });
}

const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalPayloadV450 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

function validDeposit(value: unknown): value is KerrDetectorExpectedImageDepositV450 {
  const row = value as Partial<KerrDetectorExpectedImageDepositV450> | null;
  return Boolean(
    row &&
      Number.isInteger(row.pixelX) &&
      Number.isInteger(row.pixelY) &&
      Number.isInteger(row.linearIndexZeroBased) &&
      finite(row.weight) &&
      row.weight >= 0 &&
      row.weight <= 1 &&
      finite(row.expectedSourceElectrons) &&
      row.expectedSourceElectrons >= 0,
  );
}

function validRow(value: unknown): value is KerrDetectorExpectedImageRowV450 {
  const row = value as Partial<KerrDetectorExpectedImageRowV450> | null;
  return Boolean(
    row &&
      row.version === KERR_DETECTOR_EXPECTED_IMAGE_VERSION_V450 &&
      typeof row.fixtureId === "string" &&
      typeof row.rayId === "string" &&
      [12, 13, 14, 15].includes(row.rayIndex ?? -1) &&
      finite(row.continuousPixelX) &&
      finite(row.continuousPixelY) &&
      finite(row.sourceExpectedElectrons) &&
      row.sourceExpectedElectrons > 0 &&
      row.deposits?.length === 4 &&
      row.deposits.every(validDeposit) &&
      finite(row.depositWeightSum) &&
      finite(row.depositElectronSum) &&
      finite(row.weightConservationAbsolute) &&
      row.weightConservationAbsolute <= 1e-15 &&
      finite(row.electronConservationRelative) &&
      row.electronConservationRelative <= 1e-15 &&
      row.kernel === "deterministic-bilinear-four-pixel-unit-normalized" &&
      row.coordinateAuthority === "v441-linear-wcs-qualified" &&
      row.electronExpectationAuthority === "v447-fixture-qualified" &&
      row.detectorGeometryAuthority === false &&
      row.psfAuthority === false &&
      row.pixelResponseAuthority === false &&
      row.scienceRasterAuthority === false &&
      row.observedImageAvailable === false &&
      row.fixtureOnly === true,
  );
}

export function parseKerrDetectorExpectedImageArtifactV450(
  value: unknown,
): KerrDetectorExpectedImageArtifactV450 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDetectorExpectedImageArtifactV450>)
      : null;
  const maxima = artifact?.maxima;
  if (
    !artifact ||
    artifact.version !== KERR_DETECTOR_EXPECTED_IMAGE_ARTIFACT_VERSION_V450 ||
    artifact.status !==
      "expected-electron-image-fixture-qualified-detector-projection-blocked" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !SHA256.test(entry)) ||
    artifact.wcs?.name !== "KERR-FINITE-ZAMO-LINEAR-384" ||
    artifact.wcs.width !== 384 ||
    artifact.wcs.height !== 384 ||
    artifact.wcs.pixelConvention !==
      "FITS-one-based-continuous-pixel-centers" ||
    artifact.rows?.length !== 4 ||
    artifact.rows.some((row) => !validRow(row)) ||
    artifact.counts?.sourceRowCount !== 4 ||
    artifact.counts.sparseDepositRowCount !== 16 ||
    artifact.counts.measuredDetectorGeometryRows !== 0 ||
    artifact.counts.psfRows !== 0 ||
    artifact.counts.pixelResponseRows !== 0 ||
    artifact.counts.scienceRasterRows !== 0 ||
    artifact.counts.observedImageRows !== 0 ||
    !maxima ||
    !finite(maxima.weightConservationAbsolute) ||
    maxima.weightConservationAbsolute > 1e-15 ||
    !finite(maxima.electronConservationRelative) ||
    maxima.electronConservationRelative > 1e-15 ||
    !finite(maxima.pythonWeightAbsoluteDifference) ||
    maxima.pythonWeightAbsoluteDifference >= 1e-12 ||
    !finite(maxima.pythonElectronRelativeDifference) ||
    maxima.pythonElectronRelativeDifference >= 1e-12 ||
    !finite(maxima.sourceCoordinateJoinResidualPixel) ||
    maxima.sourceCoordinateJoinResidualPixel >= 1e-12 ||
    artifact.qualification?.wcsCoordinateAuthorityQualified !== true ||
    artifact.qualification.expectedElectronFormationFixtureQualified !== true ||
    artifact.qualification.deterministicReplayQualified !== true ||
    artifact.qualification.pythonDecimalOracleQualified !== true ||
    artifact.qualification.pixelIndexBoundaryQualified !== true ||
    artifact.qualification.detectorProjectionAuthority !== false ||
    artifact.qualification.psfAuthority !== false ||
    artifact.qualification.pixelResponseAuthority !== false ||
    artifact.qualification.scienceRasterAuthority !== false ||
    artifact.qualification.observedImageAvailable !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.boundary?.sparseFixtureOnly !== true ||
    artifact.boundary.fullRasterMaterialized !== false ||
    artifact.boundary.pngGenerated !== false ||
    artifact.boundary.fitsGenerated !== false ||
    artifact.boundary.runtimeScienceImageAllowed !== false ||
    artifact.boundary.cinematicMayClaimDetectorImage !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.networkAttempted !== false ||
    artifact.automaticRetryApplied !== false
  ) {
    throw new Error("v450-image-formation-artifact-identity");
  }
  return freezeDeep(value as KerrDetectorExpectedImageArtifactV450);
}

export function createKerrDetectorExpectedImageSummaryV450(
  value: unknown,
): KerrDetectorExpectedImageSummaryV450 {
  const artifact = parseKerrDetectorExpectedImageArtifactV450(value);
  return freezeDeep({
    version: KERR_DETECTOR_EXPECTED_IMAGE_SUMMARY_VERSION_V450,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    wcs: artifact.wcs,
    rows: artifact.rows,
    counts: artifact.counts,
    maxima: artifact.maxima,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
  });
}

export function parseKerrDetectorExpectedImageApiV450(
  value: unknown,
): KerrDetectorExpectedImageApiV450 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrDetectorExpectedImageApiV450>)
      : null;
  if (
    !api ||
    api.version !== KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450 ||
    typeof api.available !== "boolean" ||
    ![
      "ready",
      "lite-boundary",
      "local-shadow-only",
      "evidence-corrupt",
      "request-failed",
    ].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v450-image-formation-api-identity");
  }
  if (api.summary) {
    const summary = api.summary;
    if (
      summary.version !== KERR_DETECTOR_EXPECTED_IMAGE_SUMMARY_VERSION_V450 ||
      !SHA256.test(summary.artifactSha256) ||
      summary.rows.length !== 4 ||
      summary.counts.sparseDepositRowCount !== 16
    ) {
      throw new Error("v450-image-formation-summary-identity");
    }
  }
  return freezeDeep(value as KerrDetectorExpectedImageApiV450);
}
