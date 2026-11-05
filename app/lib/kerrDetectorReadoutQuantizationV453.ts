export const KERR_DETECTOR_READOUT_VERSION_V453 = "v453-kerr-detector-readout-quantization-v1" as const;
export const KERR_DETECTOR_READOUT_ARTIFACT_VERSION_V453 = "v453-kerr-detector-readout-quantization-artifact-v1" as const;
export const KERR_DETECTOR_READOUT_SUMMARY_VERSION_V453 = "v453-kerr-detector-readout-quantization-summary-v1" as const;
export const KERR_DETECTOR_READOUT_API_VERSION_V453 = "v453-kerr-detector-readout-quantization-api-v1" as const;
const SHA256 = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const freeze = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freeze(child); } return value; };

export type KerrDetectorReadoutFixtureV453 = Readonly<{
  sourceKind: "test-fixture";
  fixtureId: string;
  caseKind: "nominal" | "underflow-clipped" | "full-well-saturated" | "adc-saturated";
  expectedPoissonElectrons: number;
  hypotheticalPoissonElectronCount: number;
  readNoiseSigmaElectron: number;
  readNoiseStandardNormalCoordinate: number;
  fullWellElectron: number;
  gainElectronPerAdu: number;
  biasAdu: number;
  adcBits: number;
}>;

export type KerrDetectorReadoutResultV453 = Readonly<{
  version: typeof KERR_DETECTOR_READOUT_VERSION_V453;
  fixtureId: string;
  caseKind: KerrDetectorReadoutFixtureV453["caseKind"];
  expectedPoissonElectrons: number;
  hypotheticalPoissonElectronCount: number;
  readNoiseElectronFixture: number;
  analogReadoutElectron: number;
  underflowClipped: boolean;
  fullWellSaturated: boolean;
  clippedElectron: number;
  analogAduBeforeQuantization: number;
  adcBits: number;
  adcCodeMaximum: number;
  adcSaturated: boolean;
  digitalAduCode: number;
  digitizationResidualAdu: number;
  reconstructedElectronDiagnostic: number;
  quantizer: "round-half-up-then-clamp";
  poissonSamplingPerformed: false;
  randomnessUsed: false;
  likelihoodEvaluated: false;
  hypotheticalFixtureOnly: true;
  observedCountsApplicable: false;
  measuredDetectorAuthority: false;
  digitalAduAuthority: false;
  scienceRasterAllowed: false;
}>;

export type KerrDetectorReadoutArtifactV453 = Readonly<{
  version: typeof KERR_DETECTOR_READOUT_ARTIFACT_VERSION_V453;
  generatedAt: string;
  status: "qualified-deterministic-readout-quantization-fixture-only-measured-authority-unavailable";
  source: Readonly<{ v452ArtifactSha256: string; v451AdmissionArtifactSha256: string; v449ArtifactSha256: string; pythonOracleArtifactSha256: string }>;
  rows: readonly KerrDetectorReadoutResultV453[];
  counts: Readonly<{ fixtureRowCount: 4; nominalRows: 1; underflowRows: 1; fullWellSaturatedRows: 1; adcSaturatedRows: 1; measuredRows: 0; observedCountRows: 0; scienceRasterRows: 0 }>;
  maxima: Readonly<{ oracleAnalogElectronRelative: number; oracleClippedElectronRelative: number; oracleAduRelative: number; adcCodeAbsoluteDifference: 0; limit: 1e-12; qualified: true }>;
  semanticContract: Readonly<{ poissonCountIsExplicitHypotheticalFixture: true; gaussianCoordinateIsExplicitFixture: true; noRandomSamplingInAuthorityPath: true; fullWellAppliedBeforeGain: true; gainAppliedBeforeBiasAndAdc: true; adcQuantizerDeterministic: true; clippingFlagsPreserved: true; likelihoodAuthorityRemainsV449ExactReferenceOnly: true }>;
  qualification: Readonly<{ deterministicReadoutKernelQualified: true; pythonDecimalOracleQualified: true; underflowBoundaryQualified: true; fullWellBoundaryQualified: true; adcSaturationBoundaryQualified: true; measuredDetectorAuthorityGranted: false; observedCountsAvailable: false; digitalAduAuthorityGranted: false; scienceRasterAllowed: false; browserQualification: "not-run" }>;
  boundary: Readonly<{ v451AdmissionStatus: "blocked-v443-detector-inputs-missing"; v452ResponseCompositionStatus: "qualified-fixture-only"; measuredReadoutAllowed: false; scienceImageMaterializationAllowed: false; networkAttempted: false; automaticRetryApplied: false }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrDetectorReadoutSummaryV453 = Readonly<{ version: typeof KERR_DETECTOR_READOUT_SUMMARY_VERSION_V453; status: KerrDetectorReadoutArtifactV453["status"]; artifactSha256: string; rows: readonly KerrDetectorReadoutResultV453[]; counts: KerrDetectorReadoutArtifactV453["counts"]; maxima: KerrDetectorReadoutArtifactV453["maxima"]; semanticContract: KerrDetectorReadoutArtifactV453["semanticContract"]; qualification: KerrDetectorReadoutArtifactV453["qualification"]; boundary: KerrDetectorReadoutArtifactV453["boundary"] }>;
export type KerrDetectorReadoutApiV453 = Readonly<{ version: typeof KERR_DETECTOR_READOUT_API_VERSION_V453; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrDetectorReadoutSummaryV453 | null }>;

function assertInput(input: KerrDetectorReadoutFixtureV453): void {
  if (input.sourceKind !== "test-fixture" || !/^[a-z0-9-]{1,64}$/.test(input.fixtureId) || !["nominal", "underflow-clipped", "full-well-saturated", "adc-saturated"].includes(input.caseKind) || !finite(input.expectedPoissonElectrons) || input.expectedPoissonElectrons < 0 || !Number.isInteger(input.hypotheticalPoissonElectronCount) || input.hypotheticalPoissonElectronCount < 0 || input.hypotheticalPoissonElectronCount > 1e9 || !finite(input.readNoiseSigmaElectron) || input.readNoiseSigmaElectron < 0 || !finite(input.readNoiseStandardNormalCoordinate) || Math.abs(input.readNoiseStandardNormalCoordinate) > 12 || !finite(input.fullWellElectron) || input.fullWellElectron <= 0 || !finite(input.gainElectronPerAdu) || input.gainElectronPerAdu <= 0 || !finite(input.biasAdu) || input.biasAdu < 0 || !Number.isInteger(input.adcBits) || input.adcBits < 8 || input.adcBits > 24) throw new Error("v453-readout-input-boundary");
}

export function computeKerrDetectorReadoutV453(input: KerrDetectorReadoutFixtureV453): KerrDetectorReadoutResultV453 {
  assertInput(input);
  const readNoiseElectronFixture = input.readNoiseSigmaElectron * input.readNoiseStandardNormalCoordinate;
  const analogReadoutElectron = input.hypotheticalPoissonElectronCount + readNoiseElectronFixture;
  const underflowClipped = analogReadoutElectron < 0;
  const fullWellSaturated = analogReadoutElectron > input.fullWellElectron;
  const clippedElectron = Math.min(input.fullWellElectron, Math.max(0, analogReadoutElectron));
  const analogAduBeforeQuantization = clippedElectron / input.gainElectronPerAdu + input.biasAdu;
  const adcCodeMaximum = 2 ** input.adcBits - 1;
  const adcSaturated = analogAduBeforeQuantization > adcCodeMaximum;
  const digitalAduCode = Math.min(adcCodeMaximum, Math.max(0, Math.floor(analogAduBeforeQuantization + 0.5)));
  const digitizationResidualAdu = digitalAduCode - analogAduBeforeQuantization;
  const reconstructedElectronDiagnostic = Math.max(0, (digitalAduCode - input.biasAdu) * input.gainElectronPerAdu);
  if (![readNoiseElectronFixture, analogReadoutElectron, clippedElectron, analogAduBeforeQuantization, digitizationResidualAdu, reconstructedElectronDiagnostic].every(finite) || !Number.isInteger(digitalAduCode) || digitalAduCode < 0 || digitalAduCode > adcCodeMaximum || (input.caseKind === "nominal" && (underflowClipped || fullWellSaturated || adcSaturated)) || (input.caseKind === "underflow-clipped" && !underflowClipped) || (input.caseKind === "full-well-saturated" && !fullWellSaturated) || (input.caseKind === "adc-saturated" && !adcSaturated)) throw new Error("v453-readout-case-invariant");
  return freeze({ version: KERR_DETECTOR_READOUT_VERSION_V453, fixtureId: input.fixtureId, caseKind: input.caseKind, expectedPoissonElectrons: input.expectedPoissonElectrons, hypotheticalPoissonElectronCount: input.hypotheticalPoissonElectronCount, readNoiseElectronFixture, analogReadoutElectron, underflowClipped, fullWellSaturated, clippedElectron, analogAduBeforeQuantization, adcBits: input.adcBits, adcCodeMaximum, adcSaturated, digitalAduCode, digitizationResidualAdu, reconstructedElectronDiagnostic, quantizer: "round-half-up-then-clamp", poissonSamplingPerformed: false, randomnessUsed: false, likelihoodEvaluated: false, hypotheticalFixtureOnly: true, observedCountsApplicable: false, measuredDetectorAuthority: false, digitalAduAuthority: false, scienceRasterAllowed: false });
}

const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalPayloadV453 = (value: unknown): string => JSON.stringify(canonicalize(value));
function validRow(value: unknown): value is KerrDetectorReadoutResultV453 { const row = value as Partial<KerrDetectorReadoutResultV453> | null; return Boolean(row && row.version === KERR_DETECTOR_READOUT_VERSION_V453 && typeof row.fixtureId === "string" && ["nominal", "underflow-clipped", "full-well-saturated", "adc-saturated"].includes(row.caseKind ?? "") && [row.expectedPoissonElectrons, row.hypotheticalPoissonElectronCount, row.readNoiseElectronFixture, row.analogReadoutElectron, row.clippedElectron, row.analogAduBeforeQuantization, row.adcCodeMaximum, row.digitalAduCode, row.digitizationResidualAdu, row.reconstructedElectronDiagnostic].every(finite) && row.quantizer === "round-half-up-then-clamp" && row.poissonSamplingPerformed === false && row.randomnessUsed === false && row.likelihoodEvaluated === false && row.hypotheticalFixtureOnly === true && row.observedCountsApplicable === false && row.measuredDetectorAuthority === false && row.digitalAduAuthority === false && row.scienceRasterAllowed === false); }
export function parseKerrDetectorReadoutArtifactV453(value: unknown): KerrDetectorReadoutArtifactV453 { const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorReadoutArtifactV453> : null; if (!artifact || artifact.version !== KERR_DETECTOR_READOUT_ARTIFACT_VERSION_V453 || artifact.status !== "qualified-deterministic-readout-quantization-fixture-only-measured-authority-unavailable" || !SHA256.test(artifact.artifactSha256 ?? "") || !artifact.source || Object.values(artifact.source).some((entry) => !SHA256.test(entry)) || artifact.rows?.length !== 4 || artifact.rows.some((row) => !validRow(row)) || artifact.counts?.fixtureRowCount !== 4 || artifact.counts.nominalRows !== 1 || artifact.counts.underflowRows !== 1 || artifact.counts.fullWellSaturatedRows !== 1 || artifact.counts.adcSaturatedRows !== 1 || artifact.counts.measuredRows !== 0 || artifact.counts.observedCountRows !== 0 || artifact.counts.scienceRasterRows !== 0 || !artifact.maxima || Math.max(artifact.maxima.oracleAnalogElectronRelative, artifact.maxima.oracleClippedElectronRelative, artifact.maxima.oracleAduRelative) >= 1e-12 || artifact.maxima.adcCodeAbsoluteDifference !== 0 || artifact.maxima.limit !== 1e-12 || artifact.maxima.qualified !== true || artifact.semanticContract?.poissonCountIsExplicitHypotheticalFixture !== true || artifact.semanticContract.gaussianCoordinateIsExplicitFixture !== true || artifact.semanticContract.noRandomSamplingInAuthorityPath !== true || artifact.semanticContract.fullWellAppliedBeforeGain !== true || artifact.semanticContract.gainAppliedBeforeBiasAndAdc !== true || artifact.semanticContract.adcQuantizerDeterministic !== true || artifact.semanticContract.clippingFlagsPreserved !== true || artifact.semanticContract.likelihoodAuthorityRemainsV449ExactReferenceOnly !== true || artifact.qualification?.deterministicReadoutKernelQualified !== true || artifact.qualification.pythonDecimalOracleQualified !== true || artifact.qualification.underflowBoundaryQualified !== true || artifact.qualification.fullWellBoundaryQualified !== true || artifact.qualification.adcSaturationBoundaryQualified !== true || artifact.qualification.measuredDetectorAuthorityGranted !== false || artifact.qualification.observedCountsAvailable !== false || artifact.qualification.digitalAduAuthorityGranted !== false || artifact.qualification.scienceRasterAllowed !== false || artifact.qualification.browserQualification !== "not-run" || artifact.boundary?.v451AdmissionStatus !== "blocked-v443-detector-inputs-missing" || artifact.boundary.v452ResponseCompositionStatus !== "qualified-fixture-only" || artifact.boundary.measuredReadoutAllowed !== false || artifact.boundary.scienceImageMaterializationAllowed !== false || artifact.boundary.networkAttempted !== false || artifact.boundary.automaticRetryApplied !== false || artifact.formalProductPointer !== "v263" || artifact.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v453-readout-artifact-identity"); return freeze(value as KerrDetectorReadoutArtifactV453); }
export function createKerrDetectorReadoutSummaryV453(value: unknown): KerrDetectorReadoutSummaryV453 { const artifact = parseKerrDetectorReadoutArtifactV453(value); return freeze({ version: KERR_DETECTOR_READOUT_SUMMARY_VERSION_V453, status: artifact.status, artifactSha256: artifact.artifactSha256, rows: artifact.rows, counts: artifact.counts, maxima: artifact.maxima, semanticContract: artifact.semanticContract, qualification: artifact.qualification, boundary: artifact.boundary }); }
export function parseKerrDetectorReadoutApiV453(value: unknown): KerrDetectorReadoutApiV453 { const api = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorReadoutApiV453> : null; if (!api || api.version !== KERR_DETECTOR_READOUT_API_VERSION_V453 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v453-readout-api-identity"); return freeze(value as KerrDetectorReadoutApiV453); }
