import { createHash } from "node:crypto";
import { parseKerrDetectorCalibrationPackV364, type KerrDetectorCalibrationPackArtifactV364 } from "./kerrDetectorCalibrationPackV364";
import { parseKerrDetectorCalibrationPlanV363, type KerrDetectorCalibrationPlanArtifactV363 } from "./kerrDetectorCalibrationPlanV363";
import { parseKerrInstrumentSpectralAdmissionArtifactV425, type KerrInstrumentSpectralAdmissionArtifactV425 } from "./kerrInstrumentSpectralAdmissionV425";

export const KERR_HIGH_ENERGY_RESPONSE_VERSION_V426 = "v426-kerr-high-energy-instrument-response-contract-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_ARTIFACT_VERSION_V426 = "v426-kerr-high-energy-instrument-response-contract-artifact-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_SUMMARY_VERSION_V426 = "v426-kerr-high-energy-instrument-response-contract-summary-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_API_VERSION_V426 = "v426-kerr-high-energy-instrument-response-contract-api-v1" as const;
export const KERR_V425_ARTIFACT_SHA256_V426 = "36cd452f7e94d38da5b4877b9c57304ede3cc45475a02d1c8250e12d1f6e189b" as const;
export const KERR_V425_FILE_SHA256_V426 = "efc3a55ce483f5cf0eb99d582d078186e4287aca582fe6b61bb19dbbad3909e4" as const;
export const KERR_V363_ARTIFACT_SHA256_V426 = "33ab861e95b5442c7911851d7f90fc409c65a2404b6af3eb4456e062914a0089" as const;
export const KERR_V363_FILE_SHA256_V426 = "5b6e8b0cdcfc0a9c47d0f9387677ab2ab4e9912c7c061ce894a952d0f723accf" as const;
export const KERR_V364_ARTIFACT_SHA256_V426 = "8dd15d6bcc8a26cf71c683ca13bcd7898e3cefc3153d493b156348f5371c01e1" as const;
export const KERR_V364_FILE_SHA256_V426 = "537b15b1268faa38689bb59f556373407eab2795516e930452604256a83612b6" as const;

export type KerrHighEnergyResponseSourceKindV426 = "test-fixture" | "measured-import";
export type KerrHighEnergyResponseManifestV426 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_VERSION_V426;
  sourceKind: KerrHighEnergyResponseSourceKindV426;
  identity: Readonly<{
    measuredAcquisition: boolean;
    architecture: "band-appropriate-energy-resolved-polarimeter";
    manufacturer: string;
    model: string;
    serialOrCampaignId: string;
    performedAtUtc: string;
    laboratoryOrArchive: string;
  }>;
  energyDomainEv: readonly [number, number];
  trueEnergyEdgesEv: readonly number[];
  detectorChannelEdgesEv: readonly number[];
  response: Readonly<{
    effectiveAreaM2: readonly number[];
    effectiveAreaIncludesQuantumEfficiency: boolean;
    modulationFactor: readonly number[];
    polarizationAngleZeroDeg: readonly number[];
    redistributionMatrix: readonly (readonly number[])[];
    backgroundRateCountsPerS: readonly number[];
    responseParameterOrder: "effective-area-then-modulation-factor-then-angle-zero-then-background";
    responseParameterCovariance: readonly (readonly number[])[];
    redistributionRowCovariances: readonly (readonly (readonly number[])[])[];
  }>;
  acquisition: Readonly<{
    exposureTimeS: number;
    detectorTemperatureK: number;
    deadTimeModel: "explicit-measured-model" | "fixture-none";
    pileupModel: "explicit-measured-model" | "fixture-none";
  }>;
  provenance: Readonly<{
    sourceUrl: string | null;
    licenseOrTerms: string;
    identityFileSha256: string;
    effectiveAreaFileSha256: string;
    modulationFileSha256: string;
    redistributionFileSha256: string;
    backgroundFileSha256: string;
    covarianceFileSha256: string;
    processingParametersSha256: string;
    attestation: "real-measured-high-energy-response-not-synthetic-or-example" | "declared-test-fixture-nonpublishable";
  }>;
}>;

export type KerrHighEnergyResponseCompilationV426 = Readonly<{
  version: "v426-kerr-high-energy-response-compilation-v1";
  status: "compiled-test-fixture-nonpublishable" | "compiled-measured-manifest-awaiting-independent-validation";
  sourceKind: KerrHighEnergyResponseSourceKindV426;
  manifestCanonicalSha256: string;
  counts: Readonly<{ trueEnergyBinCount: 6; detectorChannelCount: 6; responseParameterCount: 24; redistributionElementCount: 36; v425SourcePredictionCount: 24; v425CoveredSourcePredictionCount: 24 }>;
  metrics: Readonly<{
    energyEdgesStrictlyIncreasing: true;
    channelEdgesStrictlyIncreasing: true;
    maximumRedistributionRowSumAbsolute: number;
    minimumRedistributionProbability: number;
    maximumRedistributionProbability: number;
    minimumEffectiveAreaM2: number;
    maximumEffectiveAreaM2: number;
    minimumModulationFactor: number;
    maximumModulationFactor: number;
    maximumResponseCovarianceSymmetryAbsolute: number;
    minimumResponseCovarianceEigenvalue: number;
    maximumRedistributionCovarianceSymmetryAbsolute: number;
    minimumRedistributionCovarianceEigenvalue: number;
    maximumRedistributionCovarianceSimplexResidual: number;
    maximumPythonOracleDifference: number;
  }>;
  independentScientificValidation: "pending";
  measuredAuthorityGranted: false;
  manifestPublishable: boolean;
  boundary: "compiler-validates-energy-grid-effective-area-modulation-angle-redistribution-background-and-covariance-but-never-grants-authority";
}>;

export type KerrHighEnergyResponseAdmissionV426 = Readonly<{
  version: "v426-kerr-high-energy-response-admission-v1";
  status: "rejected-test-fixture-nonpublishable" | "blocked-independent-validation-not-qualified" | "qualified-measured-high-energy-response-local-shadow-only";
  authorityGranted: boolean;
  reasons: readonly string[];
  compilationStatus: KerrHighEnergyResponseCompilationV426["status"];
  independentValidationStatus: "not-run" | "validation-failed" | "measured-validation-qualified";
  scienceResponseApplicationAllowed: boolean;
  cinematicMutationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  boundary: "admission-never-mutates-source-science-cinematic-or-product-state";
}>;

export type KerrHighEnergyResponseViewV426 = Readonly<{
  version: "v426-kerr-high-energy-instrument-response-view-v1";
  status: "qualified-high-energy-response-schema-and-compiler-fixture-only-measured-response-unavailable";
  source: Readonly<{
    v425SpectralAdmissionArtifactSha256: typeof KERR_V425_ARTIFACT_SHA256_V426;
    v363CalibrationPlanArtifactSha256: typeof KERR_V363_ARTIFACT_SHA256_V426;
    v364EmptyCalibrationPackArtifactSha256: typeof KERR_V364_ARTIFACT_SHA256_V426;
  }>;
  schema: Readonly<{
    bandAppropriateArchitectureRequired: true;
    energyDomainRequired: true;
    effectiveAreaRequired: true;
    quantumEfficiencyInclusionDeclarationRequired: true;
    modulationFactorRequired: true;
    polarizationAngleZeroRequired: true;
    redistributionMatrixRequired: true;
    backgroundRequired: true;
    fullResponseParameterCovarianceRequired: true;
    redistributionSimplexCovarianceRequired: true;
    exposureTemperatureDeadTimePileupRequired: true;
    rawArtifactShasRequired: true;
    measuredAttestationRequired: true;
  }>;
  fixture: Readonly<{
    manifest: KerrHighEnergyResponseManifestV426;
    compilation: KerrHighEnergyResponseCompilationV426;
    admission: KerrHighEnergyResponseAdmissionV426;
    purpose: "compiler-validation-only-never-science-response";
  }>;
  counts: Readonly<{
    schemaRequiredFieldGroupCount: 13;
    fixtureTrueEnergyBinCount: 6;
    fixtureDetectorChannelCount: 6;
    fixtureResponseParameterCount: 24;
    fixtureRedistributionElementCount: 36;
    v425SourcePredictionCount: 24;
    fixtureDomainCoveredSourceCount: 24;
    scienceResponseEligibleSourceCount: 0;
    scienceResponseApplicationCount: 0;
    measuredManifestCount: 0;
  }>;
  qualification: Readonly<{
    schemaQualified: true;
    compilerQualifiedByIndependentFixture: true;
    energyCoverageLogicQualified: true;
    redistributionNormalizationQualified: true;
    responseCovarianceQualified: true;
    redistributionSimplexCovarianceQualified: true;
    measuredHighEnergyResponseQualified: false;
    scienceResponseApplicationQualified: false;
    detectorCountsQualified: false;
    pixelRasterQualified: false;
    denseAuthorityQualified: false;
  }>;
  authorityBoundary: Readonly<{
    contractAuthorityGranted: true;
    fixturePerformanceAuthorityGranted: false;
    measuredResponseAuthorityGranted: false;
    scienceProjectionAuthorityGranted: false;
    detectorAuthorityGranted: false;
    pixelRasterAuthorityGranted: false;
    denseAuthorityGranted: false;
    unavailableIsNotZero: true;
  }>;
  products: Readonly<{
    json: "available-schema-fixture-compilation-and-admission";
    csv: "available-six-bin-fixture-structure-table-nonpublishable";
    fitsBinaryTable: "available-fixture-response-structure-no-science-projection";
    png: "available-response-architecture-diagnostic-not-detector-image";
    measuredResponsePack: "unavailable";
    scienceResponseProjection: "unavailable";
  }>;
  scienceCinematicBoundary: Readonly<{
    science: "immutable-response-contract-fixture-and-admission-state";
    cinematic: "may-style-response-topology-and-energy-rail-only";
    fixtureValueUseInScienceAllowed: false;
    responseValueFabricationAllowed: false;
    measurementClaimAllowed: false;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "high-energy-response-schema-compiler-and-nonpublishable-fixture-only-no-measured-response-science-projection-counts-pixel-raster-or-dense-authority";
}>;

export type KerrHighEnergyResponseArtifactV426 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_ARTIFACT_VERSION_V426;
  generatedAt: string;
  status: KerrHighEnergyResponseViewV426["status"];
  sourceFiles: Readonly<{ v425FileSha256: typeof KERR_V425_FILE_SHA256_V426; v363FileSha256: typeof KERR_V363_FILE_SHA256_V426; v364FileSha256: typeof KERR_V364_FILE_SHA256_V426; pythonOracleFileSha256: string }>;
  pythonOracleArtifactSha256: string;
  view: KerrHighEnergyResponseViewV426;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  measuredManifestPresent: false;
  scienceResponseApplicationCount: 0;
  artifactSha256: string;
}>;
export type KerrHighEnergyResponseSummaryV426 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_SUMMARY_VERSION_V426;
  status: KerrHighEnergyResponseViewV426["status"];
  artifactSha256: string;
  schema: KerrHighEnergyResponseViewV426["schema"];
  counts: KerrHighEnergyResponseViewV426["counts"];
  compilation: KerrHighEnergyResponseCompilationV426;
  admission: KerrHighEnergyResponseAdmissionV426;
  qualification: KerrHighEnergyResponseViewV426["qualification"];
  authorityBoundary: KerrHighEnergyResponseViewV426["authorityBoundary"];
  products: KerrHighEnergyResponseViewV426["products"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-schema-metrics-and-admission-summary-no-response-matrix-or-covariance-in-react-state";
}>;
export type KerrHighEnergyResponseApiV426 = Readonly<{ version: typeof KERR_HIGH_ENERGY_RESPONSE_API_VERSION_V426; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrHighEnergyResponseSummaryV426 | null }>;

type OracleV426 = Readonly<{ version: "v426-kerr-high-energy-response-python-oracle-v1"; status: "qualified-high-energy-response-fixture-compiler-oracle-no-measured-authority"; manifest: KerrHighEnergyResponseManifestV426; metrics: KerrHighEnergyResponseCompilationV426["metrics"]; artifactSha256: string }>;
const SHA = /^[a-f0-9]{64}$/; const TRANSIENT = new Set(["generatedAt", "artifactSha256"]);
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !TRANSIENT.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalShaV426 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const finite = (values: readonly number[]) => values.every(Number.isFinite);
const increasing = (values: readonly number[]) => values.every((value, index) => index === 0 || value > values[index - 1]);
function symmetricEigenvalues(matrix: readonly (readonly number[])[]): number[] { const values = matrix.map((row) => [...row]), size = values.length; for (let iteration = 0; iteration < size * size * 128; iteration += 1) { let p = 0, q = 1, maximum = 0; for (let row = 0; row < size; row += 1) for (let column = row + 1; column < size; column += 1) if (Math.abs(values[row][column]) > maximum) { maximum = Math.abs(values[row][column]); p = row; q = column; } if (maximum < 1e-16) break; const angle = .5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]), c = Math.cos(angle), s = Math.sin(angle), app = values[p][p], aqq = values[q][q], apq = values[p][q]; values[p][p] = c*c*app - 2*s*c*apq + s*s*aqq; values[q][q] = s*s*app + 2*s*c*apq + c*c*aqq; values[p][q] = values[q][p] = 0; for (let index = 0; index < size; index += 1) if (index !== p && index !== q) { const aip = values[index][p], aiq = values[index][q]; values[index][p] = values[p][index] = c*aip - s*aiq; values[index][q] = values[q][index] = s*aip + c*aiq; } } return values.map((row, index) => row[index]).sort((a,b)=>a-b); }
const symmetry = (matrix: readonly (readonly number[])[]) => Math.max(0, ...matrix.flatMap((row, i) => row.map((value, j) => Math.abs(value - matrix[j][i]))));
const maxDifference = (left: unknown, right: unknown): number => {
  if (typeof left === "number" && typeof right === "number") return Math.abs(left - right);
  if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maxDifference(entry, right[index])));
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>, rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    if (keys.length !== Object.keys(rightRecord).length || keys.some((key) => !Object.hasOwn(rightRecord, key))) return Number.POSITIVE_INFINITY;
    return Math.max(0, ...keys.map((key) => maxDifference(leftRecord[key], rightRecord[key])));
  }
  return left === right ? 0 : Number.POSITIVE_INFINITY;
};

export function parseKerrHighEnergyResponseManifestV426(value: unknown): KerrHighEnergyResponseManifestV426 {
  const source = value as Partial<KerrHighEnergyResponseManifestV426> | null;
  if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_VERSION_V426 || !["test-fixture","measured-import"].includes(source.sourceKind ?? "") || source.identity?.architecture !== "band-appropriate-energy-resolved-polarimeter" || !Array.isArray(source.energyDomainEv) || source.energyDomainEv.length !== 2 || !Array.isArray(source.trueEnergyEdgesEv) || source.trueEnergyEdgesEv.length !== 7 || !Array.isArray(source.detectorChannelEdgesEv) || source.detectorChannelEdgesEv.length !== 7 || !increasing(source.trueEnergyEdgesEv) || !increasing(source.detectorChannelEdgesEv) || source.trueEnergyEdgesEv[0] !== source.energyDomainEv[0] || source.trueEnergyEdgesEv[6] !== source.energyDomainEv[1]) throw new Error("v426-manifest-grid");
  const response = source.response;
  if (!response || response.effectiveAreaM2?.length !== 6 || response.modulationFactor?.length !== 6 || response.polarizationAngleZeroDeg?.length !== 6 || response.backgroundRateCountsPerS?.length !== 6 || !finite(response.effectiveAreaM2) || response.effectiveAreaM2.some((entry) => entry < 0) || !finite(response.modulationFactor) || response.modulationFactor.some((entry) => entry < 0 || entry > 1) || !finite(response.polarizationAngleZeroDeg) || !finite(response.backgroundRateCountsPerS) || response.backgroundRateCountsPerS.some((entry) => entry < 0) || response.responseParameterOrder !== "effective-area-then-modulation-factor-then-angle-zero-then-background" || !Array.isArray(response.redistributionMatrix) || response.redistributionMatrix.length !== 6 || response.redistributionMatrix.some((row) => !Array.isArray(row) || row.length !== 6 || !finite(row) || row.some((entry) => entry < 0 || entry > 1)) || !Array.isArray(response.responseParameterCovariance) || response.responseParameterCovariance.length !== 24 || response.responseParameterCovariance.some((row) => !Array.isArray(row) || row.length !== 24 || !finite(row)) || !Array.isArray(response.redistributionRowCovariances) || response.redistributionRowCovariances.length !== 6 || response.redistributionRowCovariances.some((matrix) => !Array.isArray(matrix) || matrix.length !== 6 || matrix.some((row) => !Array.isArray(row) || row.length !== 6 || !finite(row)))) throw new Error("v426-manifest-response");
  const provenance = source.provenance;
  if (!provenance || ![provenance.identityFileSha256, provenance.effectiveAreaFileSha256, provenance.modulationFileSha256, provenance.redistributionFileSha256, provenance.backgroundFileSha256, provenance.covarianceFileSha256, provenance.processingParametersSha256].every((entry) => SHA.test(entry ?? "")) || !source.acquisition || !(source.acquisition.exposureTimeS > 0) || !(source.acquisition.detectorTemperatureK > 0)) throw new Error("v426-manifest-provenance");
  if (source.sourceKind === "test-fixture" && (source.identity?.measuredAcquisition !== false || provenance.attestation !== "declared-test-fixture-nonpublishable" || provenance.sourceUrl !== null || source.acquisition.deadTimeModel !== "fixture-none" || source.acquisition.pileupModel !== "fixture-none")) throw new Error("v426-fixture-attestation");
  if (source.sourceKind === "measured-import" && (source.identity?.measuredAcquisition !== true || provenance.attestation !== "real-measured-high-energy-response-not-synthetic-or-example" || !/^https:\/\//.test(provenance.sourceUrl ?? "") || source.acquisition.deadTimeModel !== "explicit-measured-model" || source.acquisition.pileupModel !== "explicit-measured-model")) throw new Error("v426-measured-attestation");
  return value as KerrHighEnergyResponseManifestV426;
}

export function compileKerrHighEnergyResponseV426(manifestValue: unknown, v425: KerrInstrumentSpectralAdmissionArtifactV425, oracleMetrics?: KerrHighEnergyResponseCompilationV426["metrics"]): KerrHighEnergyResponseCompilationV426 {
  const manifest = parseKerrHighEnergyResponseManifestV426(manifestValue), response = manifest.response;
  const rowResidual = Math.max(...response.redistributionMatrix.map((row) => Math.abs(row.reduce((sum, value) => sum + value, 0) - 1)));
  const responseSymmetry = symmetry(response.responseParameterCovariance), responseMinimum = symmetricEigenvalues(response.responseParameterCovariance)[0];
  let redistributionSymmetry = 0, redistributionMinimum = Number.POSITIVE_INFINITY, simplexResidual = 0;
  for (const covariance of response.redistributionRowCovariances) { redistributionSymmetry = Math.max(redistributionSymmetry, symmetry(covariance)); redistributionMinimum = Math.min(redistributionMinimum, symmetricEigenvalues(covariance)[0]); simplexResidual = Math.max(simplexResidual, ...covariance.map((row) => Math.abs(row.reduce((sum, value) => sum + value, 0)))); }
  const energies = v425.view.rows.map((row) => row.photonEnergyEv), covered = energies.filter((energy) => energy >= manifest.energyDomainEv[0] && energy <= manifest.energyDomainEv[1]).length;
  const rawMetrics = {
    energyEdgesStrictlyIncreasing: true as const, channelEdgesStrictlyIncreasing: true as const,
    maximumRedistributionRowSumAbsolute: rowResidual,
    minimumRedistributionProbability: Math.min(...response.redistributionMatrix.flat()), maximumRedistributionProbability: Math.max(...response.redistributionMatrix.flat()),
    minimumEffectiveAreaM2: Math.min(...response.effectiveAreaM2), maximumEffectiveAreaM2: Math.max(...response.effectiveAreaM2),
    minimumModulationFactor: Math.min(...response.modulationFactor), maximumModulationFactor: Math.max(...response.modulationFactor),
    maximumResponseCovarianceSymmetryAbsolute: responseSymmetry, minimumResponseCovarianceEigenvalue: responseMinimum,
    maximumRedistributionCovarianceSymmetryAbsolute: redistributionSymmetry, minimumRedistributionCovarianceEigenvalue: redistributionMinimum,
    maximumRedistributionCovarianceSimplexResidual: simplexResidual, maximumPythonOracleDifference: 0,
  };
  const metrics = Object.freeze({ ...rawMetrics, maximumPythonOracleDifference: oracleMetrics ? maxDifference(rawMetrics, { ...oracleMetrics, maximumPythonOracleDifference: 0 }) : 0 });
  if (covered !== 24 || rowResidual >= 1e-12 || responseSymmetry >= 1e-12 || responseMinimum < -1e-12 || redistributionSymmetry >= 1e-12 || redistributionMinimum < -1e-12 || simplexResidual >= 1e-12 || metrics.maximumPythonOracleDifference >= 1e-12) throw new Error(`v426-compiler-gate:${JSON.stringify(metrics)}`);
  return Object.freeze({ version: "v426-kerr-high-energy-response-compilation-v1", status: manifest.sourceKind === "test-fixture" ? "compiled-test-fixture-nonpublishable" : "compiled-measured-manifest-awaiting-independent-validation", sourceKind: manifest.sourceKind, manifestCanonicalSha256: canonicalShaV426(manifest), counts: Object.freeze({ trueEnergyBinCount: 6, detectorChannelCount: 6, responseParameterCount: 24, redistributionElementCount: 36, v425SourcePredictionCount: 24, v425CoveredSourcePredictionCount: 24 }), metrics, independentScientificValidation: "pending", measuredAuthorityGranted: false, manifestPublishable: manifest.sourceKind === "measured-import", boundary: "compiler-validates-energy-grid-effective-area-modulation-angle-redistribution-background-and-covariance-but-never-grants-authority" });
}

export function evaluateKerrHighEnergyResponseAdmissionV426(compilation: KerrHighEnergyResponseCompilationV426, validation: "not-run" | "validation-failed" | "measured-validation-qualified"): KerrHighEnergyResponseAdmissionV426 {
  const fixture = compilation.sourceKind === "test-fixture", qualified = !fixture && validation === "measured-validation-qualified";
  return Object.freeze({ version: "v426-kerr-high-energy-response-admission-v1", status: fixture ? "rejected-test-fixture-nonpublishable" : qualified ? "qualified-measured-high-energy-response-local-shadow-only" : "blocked-independent-validation-not-qualified", authorityGranted: qualified, reasons: Object.freeze(fixture ? ["test-fixture-nonpublishable"] : qualified ? [] : ["independent-validation-not-qualified"]), compilationStatus: compilation.status, independentValidationStatus: validation, scienceResponseApplicationAllowed: qualified, cinematicMutationAllowed: false, productPromotionAllowed: false, formalProductPointer: "v263", boundary: "admission-never-mutates-source-science-cinematic-or-product-state" });
}

export function createKerrHighEnergyResponseViewV426(v425Value: unknown, v363Value: unknown, v364Value: unknown, oracleValue: unknown): KerrHighEnergyResponseViewV426 {
  const v425 = parseKerrInstrumentSpectralAdmissionArtifactV425(v425Value), v363: KerrDetectorCalibrationPlanArtifactV363 = parseKerrDetectorCalibrationPlanV363(v363Value), v364: KerrDetectorCalibrationPackArtifactV364 = parseKerrDetectorCalibrationPackV364(v364Value), oracle = oracleValue as OracleV426;
  if (v425.artifactSha256 !== KERR_V425_ARTIFACT_SHA256_V426 || v363.artifactSha256 !== KERR_V363_ARTIFACT_SHA256_V426 || v364.artifactSha256 !== KERR_V364_ARTIFACT_SHA256_V426 || oracle.version !== "v426-kerr-high-energy-response-python-oracle-v1" || oracle.status !== "qualified-high-energy-response-fixture-compiler-oracle-no-measured-authority" || !SHA.test(oracle.artifactSha256) || v363.counts.bandCount !== 3 || v364.counts.measuredDataRowCount !== 0) throw new Error("v426-source-lock");
  const manifest = parseKerrHighEnergyResponseManifestV426(oracle.manifest), compilation = compileKerrHighEnergyResponseV426(manifest, v425, oracle.metrics), admission = evaluateKerrHighEnergyResponseAdmissionV426(compilation, "not-run");
  return Object.freeze({ version: "v426-kerr-high-energy-instrument-response-view-v1", status: "qualified-high-energy-response-schema-and-compiler-fixture-only-measured-response-unavailable", source: Object.freeze({ v425SpectralAdmissionArtifactSha256: KERR_V425_ARTIFACT_SHA256_V426, v363CalibrationPlanArtifactSha256: KERR_V363_ARTIFACT_SHA256_V426, v364EmptyCalibrationPackArtifactSha256: KERR_V364_ARTIFACT_SHA256_V426 }), schema: Object.freeze({ bandAppropriateArchitectureRequired: true, energyDomainRequired: true, effectiveAreaRequired: true, quantumEfficiencyInclusionDeclarationRequired: true, modulationFactorRequired: true, polarizationAngleZeroRequired: true, redistributionMatrixRequired: true, backgroundRequired: true, fullResponseParameterCovarianceRequired: true, redistributionSimplexCovarianceRequired: true, exposureTemperatureDeadTimePileupRequired: true, rawArtifactShasRequired: true, measuredAttestationRequired: true }), fixture: Object.freeze({ manifest, compilation, admission, purpose: "compiler-validation-only-never-science-response" }), counts: Object.freeze({ schemaRequiredFieldGroupCount: 13, fixtureTrueEnergyBinCount: 6, fixtureDetectorChannelCount: 6, fixtureResponseParameterCount: 24, fixtureRedistributionElementCount: 36, v425SourcePredictionCount: 24, fixtureDomainCoveredSourceCount: 24, scienceResponseEligibleSourceCount: 0, scienceResponseApplicationCount: 0, measuredManifestCount: 0 }), qualification: Object.freeze({ schemaQualified: true, compilerQualifiedByIndependentFixture: true, energyCoverageLogicQualified: true, redistributionNormalizationQualified: true, responseCovarianceQualified: true, redistributionSimplexCovarianceQualified: true, measuredHighEnergyResponseQualified: false, scienceResponseApplicationQualified: false, detectorCountsQualified: false, pixelRasterQualified: false, denseAuthorityQualified: false }), authorityBoundary: Object.freeze({ contractAuthorityGranted: true, fixturePerformanceAuthorityGranted: false, measuredResponseAuthorityGranted: false, scienceProjectionAuthorityGranted: false, detectorAuthorityGranted: false, pixelRasterAuthorityGranted: false, denseAuthorityGranted: false, unavailableIsNotZero: true }), products: Object.freeze({ json: "available-schema-fixture-compilation-and-admission", csv: "available-six-bin-fixture-structure-table-nonpublishable", fitsBinaryTable: "available-fixture-response-structure-no-science-projection", png: "available-response-architecture-diagnostic-not-detector-image", measuredResponsePack: "unavailable", scienceResponseProjection: "unavailable" }), scienceCinematicBoundary: Object.freeze({ science: "immutable-response-contract-fixture-and-admission-state", cinematic: "may-style-response-topology-and-energy-rail-only", fixtureValueUseInScienceAllowed: false, responseValueFabricationAllowed: false, measurementClaimAllowed: false }), denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "high-energy-response-schema-compiler-and-nonpublishable-fixture-only-no-measured-response-science-projection-counts-pixel-raster-or-dense-authority" });
}

export function parseKerrHighEnergyResponseArtifactV426(value: unknown): KerrHighEnergyResponseArtifactV426 { const source = value as Partial<KerrHighEnergyResponseArtifactV426> | null; if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_ARTIFACT_VERSION_V426 || source.status !== "qualified-high-energy-response-schema-and-compiler-fixture-only-measured-response-unavailable" || source.sourceFiles?.v425FileSha256 !== KERR_V425_FILE_SHA256_V426 || source.sourceFiles.v363FileSha256 !== KERR_V363_FILE_SHA256_V426 || source.sourceFiles.v364FileSha256 !== KERR_V364_FILE_SHA256_V426 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || source.view?.fixture.compilation.status !== "compiled-test-fixture-nonpublishable" || source.view.fixture.admission.status !== "rejected-test-fixture-nonpublishable" || source.view.counts.scienceResponseEligibleSourceCount !== 0 || source.view.counts.scienceResponseApplicationCount !== 0 || source.view.authorityBoundary.measuredResponseAuthorityGranted !== false || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.measuredManifestPresent !== false || source.scienceResponseApplicationCount !== 0 || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v426-artifact-identity"); return value as KerrHighEnergyResponseArtifactV426; }
export function createKerrHighEnergyResponseSummaryV426(value: unknown): KerrHighEnergyResponseSummaryV426 { const artifact = parseKerrHighEnergyResponseArtifactV426(value); return Object.freeze({ version: KERR_HIGH_ENERGY_RESPONSE_SUMMARY_VERSION_V426, status: artifact.status, artifactSha256: artifact.artifactSha256, schema: artifact.view.schema, counts: artifact.view.counts, compilation: artifact.view.fixture.compilation, admission: artifact.view.fixture.admission, qualification: artifact.view.qualification, authorityBoundary: artifact.view.authorityBoundary, products: artifact.view.products, denseCampaignStatus: "incomplete-0-of-49", fullArtifactAvailable: true, boundary: "bounded-schema-metrics-and-admission-summary-no-response-matrix-or-covariance-in-react-state" }); }
export function parseKerrHighEnergyResponseSummaryV426(value: unknown): KerrHighEnergyResponseSummaryV426 { const source = value as Partial<KerrHighEnergyResponseSummaryV426> | null; if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_SUMMARY_VERSION_V426 || !SHA.test(source.artifactSha256 ?? "") || source.counts?.schemaRequiredFieldGroupCount !== 13 || source.counts.scienceResponseEligibleSourceCount !== 0 || source.compilation?.status !== "compiled-test-fixture-nonpublishable" || source.admission?.status !== "rejected-test-fixture-nonpublishable" || source.authorityBoundary?.measuredResponseAuthorityGranted !== false || source.fullArtifactAvailable !== true || source.boundary !== "bounded-schema-metrics-and-admission-summary-no-response-matrix-or-covariance-in-react-state" || Object.hasOwn(source,"manifest") || Object.hasOwn(source,"responseMatrix")) throw new Error("v426-summary-identity"); return value as KerrHighEnergyResponseSummaryV426; }
export function parseKerrHighEnergyResponseApiV426(value: unknown): KerrHighEnergyResponseApiV426 { const source = value as Partial<KerrHighEnergyResponseApiV426> | null; if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_API_VERSION_V426) throw new Error("v426-api-version"); if (source.available === true && source.reason === "ready" && source.summary) return Object.freeze({ ...source, summary: parseKerrHighEnergyResponseSummaryV426(source.summary) }) as KerrHighEnergyResponseApiV426; if (source.available === false && source.summary === null && ["lite-boundary","local-shadow-only","evidence-corrupt","request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyResponseApiV426; throw new Error("v426-api-identity"); }

export function serializeKerrHighEnergyResponseCsvV426(view: KerrHighEnergyResponseViewV426): string { const manifest = view.fixture.manifest, header = ["true_energy_low_eV","true_energy_high_eV","detector_channel_low_eV","detector_channel_high_eV","effective_area_m2","modulation_factor","polarization_angle_zero_deg","background_rate_counts_per_s","redistribution_row_sum","source_kind","measured_authority","science_response_application_allowed"], rows = Array.from({length:6},(_,index)=>[manifest.trueEnergyEdgesEv[index],manifest.trueEnergyEdgesEv[index+1],manifest.detectorChannelEdgesEv[index],manifest.detectorChannelEdgesEv[index+1],manifest.response.effectiveAreaM2[index],manifest.response.modulationFactor[index],manifest.response.polarizationAngleZeroDeg[index],manifest.response.backgroundRateCountsPerS[index],manifest.response.redistributionMatrix[index].reduce((sum,value)=>sum+value,0),manifest.sourceKind,false,false]); return `${[header,...rows].map((row)=>row.join(",")).join("\n")}\n`; }
