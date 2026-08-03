import { createHash } from "node:crypto";

export const KERR_HIGH_ENERGY_ACQUISITION_PACK_VERSION_V427 =
  "v427-kerr-high-energy-response-acquisition-pack-v1" as const;
export const KERR_HIGH_ENERGY_ACQUISITION_ARTIFACT_VERSION_V427 =
  "v427-kerr-high-energy-response-acquisition-pack-artifact-v1" as const;
export const KERR_HIGH_ENERGY_ACQUISITION_SUMMARY_VERSION_V427 =
  "v427-kerr-high-energy-response-acquisition-pack-summary-v1" as const;
export const KERR_HIGH_ENERGY_ACQUISITION_API_VERSION_V427 =
  "v427-kerr-high-energy-response-acquisition-pack-api-v1" as const;

export const KERR_V426_ARTIFACT_SHA256_V427 =
  "17de5699cef0619dc3ea165ede2d05828ec55bfd3b9cc09a12d24e4c35637c44" as const;
export const KERR_V426_FILE_SHA256_V427 =
  "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061" as const;
export const KERR_V426_EVIDENCE_SHA256_V427 =
  "7170277ec5eb1be52f48fde0ec38cfb449886d72e38ecef6432b0b71171d6d4f" as const;
export const KERR_V426_EVIDENCE_FILE_SHA256_V427 =
  "51776e08d6394082edbbf7593d13eb8fdd010893a1ed19ccbb8a57b60184b9a2" as const;
export const KERR_V426_POINTER_SHA256_V427 =
  "4ca644ed3aa2d0298f000e80d7e2bf7776c8e3ea198673482f10bfc950c66f0f" as const;
export const KERR_V426_POINTER_FILE_SHA256_V427 =
  "ebef90d600ea0ffe4546e344112db2a4c46edfc48b468fffb9ba9f886023e369" as const;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);

export type KerrHighEnergyResponseAcquisitionIdentityV427 = Readonly<{
  sourceKind: "test-fixture" | "measured-import";
  measuredAcquisition: boolean;
  architecture: "band-appropriate-energy-resolved-polarimeter";
  manufacturer: string;
  model: string;
  serialOrCampaignId: string;
  performedAtUtc: string;
  laboratoryOrArchive: string;
}>;

export type KerrHighEnergyEnergyBinV427 = Readonly<{
  id: string;
  lowerEv: number;
  upperEv: number;
}>;

export type KerrHighEnergyEffectiveAreaRowV427 = Readonly<{
  measurementId: string;
  binId: string;
  repeatIndex: number;
  effectiveAreaM2: number;
  includesQuantumEfficiency: boolean;
  exposureTimeS: number;
  detectorTemperatureK: number;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyModulationRowV427 = Readonly<{
  measurementId: string;
  binId: string;
  repeatIndex: number;
  modulationFactor: number;
  polarizationAngleZeroDeg: number;
  exposureTimeS: number;
  detectorTemperatureK: number;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyRedistributionRowV427 = Readonly<{
  measurementId: string;
  trueEnergyBinId: string;
  detectorChannelId: string;
  repeatIndex: number;
  probability: number;
  exposureTimeS: number;
  detectorTemperatureK: number;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyBackgroundRowV427 = Readonly<{
  measurementId: string;
  detectorChannelId: string;
  repeatIndex: number;
  rateCountsPerS: number;
  exposureTimeS: number;
  detectorTemperatureK: number;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyCovarianceRowV427 = Readonly<{
  rowParameterId: string;
  columnParameterId: string;
  covariance: number;
  unitProduct: string;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyRedistributionCovarianceRowV427 = Readonly<{
  trueEnergyBinId: string;
  rowChannelId: string;
  columnChannelId: string;
  covariance: number;
  rawArtifactSha256: string;
}>;

export type KerrHighEnergyResponseAcquisitionSubmissionV427 = Readonly<{
  version: "v427-kerr-high-energy-response-acquisition-submission-v1";
  identity: KerrHighEnergyResponseAcquisitionIdentityV427;
  trueEnergyBins: readonly KerrHighEnergyEnergyBinV427[];
  detectorChannels: readonly KerrHighEnergyEnergyBinV427[];
  effectiveAreaRows: readonly KerrHighEnergyEffectiveAreaRowV427[];
  modulationRows: readonly KerrHighEnergyModulationRowV427[];
  redistributionRows: readonly KerrHighEnergyRedistributionRowV427[];
  backgroundRows: readonly KerrHighEnergyBackgroundRowV427[];
  responseCovarianceRows: readonly KerrHighEnergyCovarianceRowV427[];
  redistributionCovarianceRows: readonly KerrHighEnergyRedistributionCovarianceRowV427[];
  acquisition: Readonly<{
    requiredRepeatCount: number;
    deadTimeModel: string;
    pileupModel: string;
  }>;
  provenance: Readonly<{
    sourceUrl: string | null;
    licenseOrTerms: string;
    processingParametersSha256: string;
    fileSha256: Readonly<Record<string, string>>;
    attestation:
      | "declared-test-fixture-nonpublishable"
      | "real-measured-high-energy-response-not-synthetic-or-example";
  }>;
}>;

export type KerrHighEnergyResponseValidatorMetricsV427 = Readonly<{
  trueEnergyBinCount: number;
  detectorChannelCount: number;
  repeatCount: number;
  effectiveAreaRowCount: number;
  modulationRowCount: number;
  redistributionRowCount: number;
  backgroundRowCount: number;
  responseCovarianceRowCount: number;
  redistributionCovarianceRowCount: number;
  uniqueMeasurementIdCount: number;
  maximumRedistributionRowSumAbsolute: number;
  maximumResponseCovarianceSymmetryAbsolute: number;
  minimumResponseCovarianceEigenvalue: number;
  maximumRedistributionCovarianceSymmetryAbsolute: number;
  minimumRedistributionCovarianceEigenvalue: number;
  maximumRedistributionCovarianceSimplexResidual: number;
}>;

export type KerrHighEnergyResponseValidationResultV427 = Readonly<{
  version: "v427-kerr-high-energy-response-acquisition-validation-v1";
  status:
    | "validated-test-fixture-nonpublishable"
    | "validated-measured-structure-awaiting-independent-scientific-validation"
    | "rejected-invalid-submission";
  sourceKind: "test-fixture" | "measured-import" | "unknown";
  valid: boolean;
  measuredAuthorityGranted: false;
  scienceResponseApplicationAllowed: false;
  errors: readonly string[];
  metrics: KerrHighEnergyResponseValidatorMetricsV427;
  boundary: "validator-checks-structure-integrity-units-provenance-and-covariance-but-never-grants-scientific-authority";
}>;

export type KerrHighEnergyAcquisitionPackFileV427 = Readonly<{
  id: string;
  relativePath: string;
  mediaType: string;
  bytes: number;
  sha256: string;
  dataRowCount: number;
  measurementTemplate: boolean;
  admissibleAsMeasured: false;
}>;

export type KerrHighEnergyResponseAcquisitionPackViewV427 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_ACQUISITION_PACK_VERSION_V427;
  status: "qualified-empty-response-acquisition-pack-and-validator-measured-authority-unavailable";
  source: Readonly<{
    v426ArtifactSha256: typeof KERR_V426_ARTIFACT_SHA256_V427;
    v426EvidenceSha256: typeof KERR_V426_EVIDENCE_SHA256_V427;
    v426PointerSha256: typeof KERR_V426_POINTER_SHA256_V427;
  }>;
  files: readonly KerrHighEnergyAcquisitionPackFileV427[];
  counts: Readonly<{
    packFileCount: 9;
    measurementTemplateCount: 7;
    measurementTemplateDataRowCount: 0;
    acquisitionPlanTaskCount: number;
    validatorFixtureDataRowCount: number;
    measuredSubmissionCount: 0;
    measuredDataRowCount: 0;
    scienceResponseApplicationCount: 0;
  }>;
  validator: Readonly<{
    schemaQualified: true;
    independentFixtureQualified: true;
    fixtureStatus: "validated-test-fixture-nonpublishable";
    fixtureMetrics: KerrHighEnergyResponseValidatorMetricsV427;
    invalidFixtureMutationCount: number;
    invalidFixtureRejectionCount: number;
    measuredSubmissionStatus: "unavailable-zero-measured-rows";
  }>;
  products: Readonly<{
    deterministicZip: "available-empty-measurement-templates-only";
    acquisitionPlanFits: "available-plan-table-no-measured-response";
    architecturePng: "available-workflow-diagram-not-detector-image";
    validatorFixture: "available-nonpublishable-validator-test-only";
    measuredResponse: "unavailable";
  }>;
  authorityBoundary: Readonly<{
    packSchemaAuthorityGranted: true;
    validatorAuthorityGranted: true;
    fixturePerformanceAuthorityGranted: false;
    measuredResponseAuthorityGranted: false;
    scienceProjectionAuthorityGranted: false;
    detectorAuthorityGranted: false;
    pixelRasterAuthorityGranted: false;
    denseAuthorityGranted: false;
    unavailableIsNotZero: true;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "empty-acquisition-templates-and-validator-only-no-measured-response-science-projection-detector-counts-pixel-raster-or-dense-authority";
}>;

export type KerrHighEnergyResponseAcquisitionPackArtifactV427 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_ACQUISITION_ARTIFACT_VERSION_V427;
  generatedAt: string;
  status: KerrHighEnergyResponseAcquisitionPackViewV427["status"];
  sourceFiles: Readonly<{
    v426ArtifactFileSha256: typeof KERR_V426_FILE_SHA256_V427;
    v426EvidenceFileSha256: typeof KERR_V426_EVIDENCE_FILE_SHA256_V427;
    v426PointerFileSha256: typeof KERR_V426_POINTER_FILE_SHA256_V427;
    pythonOracleFileSha256: string;
  }>;
  pythonOracleArtifactSha256: string;
  view: KerrHighEnergyResponseAcquisitionPackViewV427;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  measuredSubmissionPresent: false;
  measuredDataRowCount: 0;
  scienceResponseApplicationCount: 0;
  artifactSha256: string;
}>;

export type KerrHighEnergyResponseAcquisitionSummaryV427 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_ACQUISITION_SUMMARY_VERSION_V427;
  status: KerrHighEnergyResponseAcquisitionPackViewV427["status"];
  artifactSha256: string;
  counts: KerrHighEnergyResponseAcquisitionPackViewV427["counts"];
  validator: KerrHighEnergyResponseAcquisitionPackViewV427["validator"];
  products: KerrHighEnergyResponseAcquisitionPackViewV427["products"];
  authorityBoundary: KerrHighEnergyResponseAcquisitionPackViewV427["authorityBoundary"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-pack-validator-and-authority-summary-no-fixture-rows-or-measurement-tables-in-react-state";
}>;

export type KerrHighEnergyResponseAcquisitionApiV427 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_ACQUISITION_API_VERSION_V427;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrHighEnergyResponseAcquisitionSummaryV427 | null;
}>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export function canonicalShaV427(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function matrixSymmetry(matrix: readonly (readonly number[])[]): number {
  return Math.max(0, ...matrix.flatMap((row, i) => row.map((value, j) => Math.abs(value - matrix[j][i]))));
}

function symmetricEigenvalues(matrix: readonly (readonly number[])[]): number[] {
  if (matrix.length === 0) return [];
  const values = matrix.map((row) => [...row]);
  for (let iteration = 0; iteration < matrix.length * matrix.length * 128; iteration += 1) {
    let p = 0;
    let q = 0;
    let maximum = 0;
    for (let row = 0; row < values.length; row += 1) {
      for (let column = row + 1; column < values.length; column += 1) {
        if (Math.abs(values[row][column]) > maximum) {
          maximum = Math.abs(values[row][column]);
          p = row;
          q = column;
        }
      }
    }
    if (maximum < 1e-16) break;
    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const pp = values[p][p];
    const qq = values[q][q];
    const pq = values[p][q];
    values[p][p] = cosine * cosine * pp - 2 * sine * cosine * pq + sine * sine * qq;
    values[q][q] = sine * sine * pp + 2 * sine * cosine * pq + cosine * cosine * qq;
    values[p][q] = 0;
    values[q][p] = 0;
    for (let index = 0; index < values.length; index += 1) {
      if (index === p || index === q) continue;
      const ip = values[index][p];
      const iq = values[index][q];
      values[index][p] = values[p][index] = cosine * ip - sine * iq;
      values[index][q] = values[q][index] = sine * ip + cosine * iq;
    }
  }
  return values.map((row, index) => row[index]).sort((left, right) => left - right);
}

function emptyMetrics(): KerrHighEnergyResponseValidatorMetricsV427 {
  return Object.freeze({
    trueEnergyBinCount: 0,
    detectorChannelCount: 0,
    repeatCount: 0,
    effectiveAreaRowCount: 0,
    modulationRowCount: 0,
    redistributionRowCount: 0,
    backgroundRowCount: 0,
    responseCovarianceRowCount: 0,
    redistributionCovarianceRowCount: 0,
    uniqueMeasurementIdCount: 0,
    maximumRedistributionRowSumAbsolute: Number.POSITIVE_INFINITY,
    maximumResponseCovarianceSymmetryAbsolute: Number.POSITIVE_INFINITY,
    minimumResponseCovarianceEigenvalue: Number.NEGATIVE_INFINITY,
    maximumRedistributionCovarianceSymmetryAbsolute: Number.POSITIVE_INFINITY,
    minimumRedistributionCovarianceEigenvalue: Number.NEGATIVE_INFINITY,
    maximumRedistributionCovarianceSimplexResidual: Number.POSITIVE_INFINITY,
  });
}

const finitePositive = (value: number) => Number.isFinite(value) && value > 0;
const finiteNonnegative = (value: number) => Number.isFinite(value) && value >= 0;
const unique = (values: readonly string[]) => new Set(values).size === values.length;

export function validateKerrHighEnergyResponseSubmissionV427(
  value: unknown,
): KerrHighEnergyResponseValidationResultV427 {
  const source = value as Partial<KerrHighEnergyResponseAcquisitionSubmissionV427> | null;
  const errors: string[] = [];
  if (!source || source.version !== "v427-kerr-high-energy-response-acquisition-submission-v1") {
    return Object.freeze({
      version: "v427-kerr-high-energy-response-acquisition-validation-v1",
      status: "rejected-invalid-submission",
      sourceKind: "unknown",
      valid: false,
      measuredAuthorityGranted: false,
      scienceResponseApplicationAllowed: false,
      errors: Object.freeze(["submission-version"]),
      metrics: emptyMetrics(),
      boundary: "validator-checks-structure-integrity-units-provenance-and-covariance-but-never-grants-scientific-authority",
    });
  }
  const identity = source.identity;
  const trueBins = source.trueEnergyBins ?? [];
  const channels = source.detectorChannels ?? [];
  const areaRows = source.effectiveAreaRows ?? [];
  const modulationRows = source.modulationRows ?? [];
  const redistributionRows = source.redistributionRows ?? [];
  const backgroundRows = source.backgroundRows ?? [];
  const responseCovarianceRows = source.responseCovarianceRows ?? [];
  const redistributionCovarianceRows = source.redistributionCovarianceRows ?? [];
  const sourceKind = identity?.sourceKind ?? "unknown";
  if (!identity || !["test-fixture", "measured-import"].includes(sourceKind) || identity.architecture !== "band-appropriate-energy-resolved-polarimeter") errors.push("identity");
  if (sourceKind === "test-fixture" && (identity?.measuredAcquisition !== false || source.provenance?.attestation !== "declared-test-fixture-nonpublishable" || source.provenance.sourceUrl !== null)) errors.push("fixture-attestation");
  if (sourceKind === "measured-import" && (identity?.measuredAcquisition !== true || source.provenance?.attestation !== "real-measured-high-energy-response-not-synthetic-or-example" || !/^https:\/\//.test(source.provenance.sourceUrl ?? ""))) errors.push("measured-attestation");
  if (!identity || [identity.manufacturer, identity.model, identity.serialOrCampaignId, identity.performedAtUtc, identity.laboratoryOrArchive].some((entry) => typeof entry !== "string" || entry.trim().length === 0)) errors.push("identity-fields");
  if (trueBins.length !== 6 || channels.length !== 6) errors.push("grid-dimensions");
  for (const [label, bins] of [["true", trueBins], ["channel", channels]] as const) {
    if (!unique(bins.map((bin) => bin.id)) || bins.some((bin, index) => !bin.id || !finitePositive(bin.lowerEv) || !finitePositive(bin.upperEv) || bin.upperEv <= bin.lowerEv || (index > 0 && Math.abs(bin.lowerEv - bins[index - 1].upperEv) > 1e-12))) errors.push(`${label}-grid`);
  }
  const repeatCount = source.acquisition?.requiredRepeatCount ?? 0;
  if (!Number.isInteger(repeatCount) || repeatCount < 2 || !source.acquisition?.deadTimeModel?.trim() || !source.acquisition?.pileupModel?.trim()) errors.push("acquisition-model");
  const trueIds = new Set(trueBins.map((bin) => bin.id));
  const channelIds = new Set(channels.map((channel) => channel.id));
  const allMeasurementRows = [...areaRows, ...modulationRows, ...redistributionRows, ...backgroundRows];
  const measurementIds = allMeasurementRows.map((row) => row.measurementId);
  if (!unique(measurementIds) || measurementIds.some((id) => typeof id !== "string" || id.length === 0)) errors.push("measurement-id-uniqueness");
  if (allMeasurementRows.some((row) => !Number.isInteger(row.repeatIndex) || row.repeatIndex < 0 || row.repeatIndex >= repeatCount || !finitePositive(row.exposureTimeS) || !finitePositive(row.detectorTemperatureK) || !SHA.test(row.rawArtifactSha256))) errors.push("measurement-row-metadata");
  if (areaRows.length !== trueBins.length * repeatCount || areaRows.some((row) => !trueIds.has(row.binId) || !finiteNonnegative(row.effectiveAreaM2) || typeof row.includesQuantumEfficiency !== "boolean")) errors.push("effective-area-coverage");
  if (modulationRows.length !== trueBins.length * repeatCount || modulationRows.some((row) => !trueIds.has(row.binId) || !Number.isFinite(row.modulationFactor) || row.modulationFactor < 0 || row.modulationFactor > 1 || !Number.isFinite(row.polarizationAngleZeroDeg))) errors.push("modulation-coverage");
  if (backgroundRows.length !== channels.length * repeatCount || backgroundRows.some((row) => !channelIds.has(row.detectorChannelId) || !finiteNonnegative(row.rateCountsPerS))) errors.push("background-coverage");
  if (redistributionRows.length !== trueBins.length * channels.length * repeatCount || redistributionRows.some((row) => !trueIds.has(row.trueEnergyBinId) || !channelIds.has(row.detectorChannelId) || !Number.isFinite(row.probability) || row.probability < 0 || row.probability > 1)) errors.push("redistribution-coverage");
  const coverageKeys = (rows: readonly { binId?: string; detectorChannelId?: string; trueEnergyBinId?: string; repeatIndex: number }[], kind: "bin" | "channel" | "matrix") => rows.map((row) => kind === "bin" ? `${row.binId}:${row.repeatIndex}` : kind === "channel" ? `${row.detectorChannelId}:${row.repeatIndex}` : `${row.trueEnergyBinId}:${row.detectorChannelId}:${row.repeatIndex}`);
  if (!unique(coverageKeys(areaRows, "bin")) || !unique(coverageKeys(modulationRows, "bin")) || !unique(coverageKeys(backgroundRows, "channel")) || !unique(coverageKeys(redistributionRows, "matrix"))) errors.push("repeat-coverage-uniqueness");
  let maximumRedistributionRowSumAbsolute = 0;
  for (const bin of trueBins) for (let repeat = 0; repeat < repeatCount; repeat += 1) {
    const row = redistributionRows.filter((entry) => entry.trueEnergyBinId === bin.id && entry.repeatIndex === repeat);
    maximumRedistributionRowSumAbsolute = Math.max(maximumRedistributionRowSumAbsolute, Math.abs(row.reduce((sum, entry) => sum + entry.probability, 0) - 1));
  }
  if (maximumRedistributionRowSumAbsolute >= 1e-12) errors.push("redistribution-row-sum");
  const parameterIds = [
    ...trueBins.map((bin) => `effective-area:${bin.id}`),
    ...trueBins.map((bin) => `modulation:${bin.id}`),
    ...trueBins.map((bin) => `angle-zero:${bin.id}`),
    ...channels.map((channel) => `background:${channel.id}`),
  ];
  const parameterIndex = new Map(parameterIds.map((id, index) => [id, index]));
  const responseMatrix = Array.from({ length: parameterIds.length }, () => Array(parameterIds.length).fill(Number.NaN));
  for (const row of responseCovarianceRows) {
    const rowIndex = parameterIndex.get(row.rowParameterId);
    const columnIndex = parameterIndex.get(row.columnParameterId);
    if (rowIndex === undefined || columnIndex === undefined || !Number.isFinite(row.covariance) || !row.unitProduct?.trim() || !SHA.test(row.rawArtifactSha256)) errors.push("response-covariance-row");
    else if (Number.isFinite(responseMatrix[rowIndex][columnIndex])) errors.push("response-covariance-duplicate");
    else responseMatrix[rowIndex][columnIndex] = row.covariance;
  }
  if (responseCovarianceRows.length !== parameterIds.length ** 2 || responseMatrix.some((row) => row.some((entry) => !Number.isFinite(entry)))) errors.push("response-covariance-coverage");
  const responseSymmetry = responseMatrix.every((row) => row.every(Number.isFinite)) ? matrixSymmetry(responseMatrix) : Number.POSITIVE_INFINITY;
  const responseMinimum = Number.isFinite(responseSymmetry) ? (symmetricEigenvalues(responseMatrix)[0] ?? Number.NEGATIVE_INFINITY) : Number.NEGATIVE_INFINITY;
  if (responseSymmetry >= 1e-12) errors.push("response-covariance-symmetry");
  if (responseMinimum < -1e-12) errors.push("response-covariance-psd");
  let redistributionSymmetry = 0;
  let redistributionMinimum = Number.POSITIVE_INFINITY;
  let simplexResidual = 0;
  for (const bin of trueBins) {
    const matrix = Array.from({ length: channels.length }, () => Array(channels.length).fill(Number.NaN));
    for (const row of redistributionCovarianceRows.filter((entry) => entry.trueEnergyBinId === bin.id)) {
      const rowIndex = channels.findIndex((channel) => channel.id === row.rowChannelId);
      const columnIndex = channels.findIndex((channel) => channel.id === row.columnChannelId);
      if (rowIndex < 0 || columnIndex < 0 || !Number.isFinite(row.covariance) || !SHA.test(row.rawArtifactSha256)) errors.push("redistribution-covariance-row");
      else if (Number.isFinite(matrix[rowIndex][columnIndex])) errors.push("redistribution-covariance-duplicate");
      else matrix[rowIndex][columnIndex] = row.covariance;
    }
    if (matrix.some((row) => row.some((entry) => !Number.isFinite(entry)))) {
      errors.push("redistribution-covariance-coverage");
      redistributionSymmetry = Number.POSITIVE_INFINITY;
      redistributionMinimum = Number.NEGATIVE_INFINITY;
      simplexResidual = Number.POSITIVE_INFINITY;
      continue;
    }
    redistributionSymmetry = Math.max(redistributionSymmetry, matrixSymmetry(matrix));
    redistributionMinimum = Math.min(redistributionMinimum, symmetricEigenvalues(matrix)[0] ?? Number.NEGATIVE_INFINITY);
    simplexResidual = Math.max(simplexResidual, ...matrix.map((row) => Math.abs(row.reduce((sum, entry) => sum + entry, 0))));
  }
  if (redistributionCovarianceRows.length !== trueBins.length * channels.length ** 2) errors.push("redistribution-covariance-count");
  if (redistributionSymmetry >= 1e-12) errors.push("redistribution-covariance-symmetry");
  if (redistributionMinimum < -1e-12) errors.push("redistribution-covariance-psd");
  if (simplexResidual >= 1e-12) errors.push("redistribution-covariance-simplex");
  const provenance = source.provenance;
  if (!provenance || !provenance.licenseOrTerms?.trim() || !SHA.test(provenance.processingParametersSha256 ?? "") || Object.keys(provenance.fileSha256 ?? {}).length < 7 || Object.values(provenance.fileSha256 ?? {}).some((entry) => !SHA.test(entry))) errors.push("provenance");
  const metrics = Object.freeze({
    trueEnergyBinCount: trueBins.length,
    detectorChannelCount: channels.length,
    repeatCount,
    effectiveAreaRowCount: areaRows.length,
    modulationRowCount: modulationRows.length,
    redistributionRowCount: redistributionRows.length,
    backgroundRowCount: backgroundRows.length,
    responseCovarianceRowCount: responseCovarianceRows.length,
    redistributionCovarianceRowCount: redistributionCovarianceRows.length,
    uniqueMeasurementIdCount: new Set(measurementIds).size,
    maximumRedistributionRowSumAbsolute,
    maximumResponseCovarianceSymmetryAbsolute: responseSymmetry,
    minimumResponseCovarianceEigenvalue: responseMinimum,
    maximumRedistributionCovarianceSymmetryAbsolute: redistributionSymmetry,
    minimumRedistributionCovarianceEigenvalue: redistributionMinimum,
    maximumRedistributionCovarianceSimplexResidual: simplexResidual,
  });
  const deduplicatedErrors = Object.freeze([...new Set(errors)].sort());
  const valid = deduplicatedErrors.length === 0;
  return Object.freeze({
    version: "v427-kerr-high-energy-response-acquisition-validation-v1",
    status: valid ? sourceKind === "test-fixture" ? "validated-test-fixture-nonpublishable" : "validated-measured-structure-awaiting-independent-scientific-validation" : "rejected-invalid-submission",
    sourceKind,
    valid,
    measuredAuthorityGranted: false,
    scienceResponseApplicationAllowed: false,
    errors: deduplicatedErrors,
    metrics,
    boundary: "validator-checks-structure-integrity-units-provenance-and-covariance-but-never-grants-scientific-authority",
  });
}

export function parseKerrHighEnergyResponseAcquisitionArtifactV427(
  value: unknown,
): KerrHighEnergyResponseAcquisitionPackArtifactV427 {
  const source = value as Partial<KerrHighEnergyResponseAcquisitionPackArtifactV427> | null;
  const view = source?.view;
  if (
    !source ||
    source.version !== KERR_HIGH_ENERGY_ACQUISITION_ARTIFACT_VERSION_V427 ||
    source.status !== "qualified-empty-response-acquisition-pack-and-validator-measured-authority-unavailable" ||
    source.sourceFiles?.v426ArtifactFileSha256 !== KERR_V426_FILE_SHA256_V427 ||
    source.sourceFiles.v426EvidenceFileSha256 !== KERR_V426_EVIDENCE_FILE_SHA256_V427 ||
    source.sourceFiles.v426PointerFileSha256 !== KERR_V426_POINTER_FILE_SHA256_V427 ||
    !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") ||
    !SHA.test(source.pythonOracleArtifactSha256 ?? "") ||
    view?.counts.packFileCount !== 9 ||
    view.counts.measurementTemplateCount !== 7 ||
    view.counts.measurementTemplateDataRowCount !== 0 ||
    view.counts.measuredDataRowCount !== 0 ||
    view.validator.fixtureStatus !== "validated-test-fixture-nonpublishable" ||
    view.validator.invalidFixtureMutationCount !== view.validator.invalidFixtureRejectionCount ||
    view.authorityBoundary.measuredResponseAuthorityGranted !== false ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.measuredSubmissionPresent !== false ||
    source.scienceResponseApplicationCount !== 0 ||
    !SHA.test(source.artifactSha256 ?? "")
  ) throw new Error("v427-artifact-identity");
  return value as KerrHighEnergyResponseAcquisitionPackArtifactV427;
}

export function createKerrHighEnergyResponseAcquisitionSummaryV427(
  artifactValue: unknown,
): KerrHighEnergyResponseAcquisitionSummaryV427 {
  const artifact = parseKerrHighEnergyResponseAcquisitionArtifactV427(artifactValue);
  const view = artifact.view;
  return Object.freeze({
    version: KERR_HIGH_ENERGY_ACQUISITION_SUMMARY_VERSION_V427,
    status: view.status,
    artifactSha256: artifact.artifactSha256,
    counts: view.counts,
    validator: view.validator,
    products: view.products,
    authorityBoundary: view.authorityBoundary,
    denseCampaignStatus: view.denseCampaignStatus,
    fullArtifactAvailable: true,
    boundary: "bounded-pack-validator-and-authority-summary-no-fixture-rows-or-measurement-tables-in-react-state",
  });
}

export function parseKerrHighEnergyResponseAcquisitionApiV427(
  value: unknown,
): KerrHighEnergyResponseAcquisitionApiV427 {
  const source = value as Partial<KerrHighEnergyResponseAcquisitionApiV427> | null;
  if (!source || source.version !== KERR_HIGH_ENERGY_ACQUISITION_API_VERSION_V427) throw new Error("v427-api-version");
  if (source.available === true && source.reason === "ready" && source.summary) {
    const summary = source.summary;
    if (summary.version !== KERR_HIGH_ENERGY_ACQUISITION_SUMMARY_VERSION_V427 || !SHA.test(summary.artifactSha256) || summary.counts.measurementTemplateDataRowCount !== 0 || summary.counts.measuredDataRowCount !== 0 || summary.authorityBoundary.measuredResponseAuthorityGranted !== false || Object.hasOwn(summary, "files") || Object.hasOwn(summary, "fixture")) throw new Error("v427-api-summary");
    return source as KerrHighEnergyResponseAcquisitionApiV427;
  }
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyResponseAcquisitionApiV427;
  throw new Error("v427-api-identity");
}
