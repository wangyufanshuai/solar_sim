import { createHash } from "node:crypto";

export const KERR_DETECTOR_ELECTRON_KERNEL_VERSION_V447 = "v447-kerr-detector-electron-expectation-kernel-v1" as const;
export const KERR_DETECTOR_ELECTRON_KERNEL_ARTIFACT_VERSION_V447 = "v447-kerr-detector-electron-expectation-kernel-artifact-v1" as const;
export const KERR_DETECTOR_ELECTRON_KERNEL_SUMMARY_VERSION_V447 = "v447-kerr-detector-electron-expectation-summary-v1" as const;
export const KERR_DETECTOR_ELECTRON_KERNEL_API_VERSION_V447 = "v447-kerr-detector-electron-expectation-api-v1" as const;
const SHA256 = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const freeze = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freeze(child); } return value; };
const neumaier = (values: readonly number[]): number => { let sum = 0, correction = 0; for (const value of values) { const next = sum + value; correction += Math.abs(sum) >= Math.abs(value) ? sum - next + value : value - next + sum; sum = next; } return sum + correction; };

export type KerrDetectorElectronUncertaintyInputV447 = Readonly<{
  sourceRadianceRelative: number;
  geometricAreaRelative: number;
  pixelSolidAngleRelative: number;
  exposureSecondsAbsolute: number;
  photonToElectronFactorRelative: number;
  backgroundRateAbsolute: number;
  darkCurrentRateAbsolute: number;
  knownComputationalRelative: number;
  correlationEvidenceAvailable: false;
}>;
export type KerrDetectorElectronExpectationInputV447 = Readonly<{
  sourceKind: "test-fixture";
  fixtureId: string;
  rayIndex: 12 | 13 | 14 | 15;
  photonToElectronSemantics: "throughput-includes-detector-qe" | "separate-detector-qe-applied";
  sourcePhotonRadiancePerSM2Sr: number;
  geometricAreaM2: number;
  pixelSolidAngleSr: number;
  exposureSeconds: number;
  photonToElectronFactor: number;
  backgroundElectronPerSecondPerPixel: number;
  darkCurrentElectronPerSecondPerPixel: number;
  readNoiseRmsElectronPerFrame: number;
  frameCount: number;
  uncertainty: KerrDetectorElectronUncertaintyInputV447;
}>;
export type KerrDetectorElectronExpectationResultV447 = Readonly<{
  version: typeof KERR_DETECTOR_ELECTRON_KERNEL_VERSION_V447;
  fixtureId: string;
  rayIndex: 12 | 13 | 14 | 15;
  sourceExpectedElectrons: number;
  backgroundExpectedElectrons: number;
  darkExpectedElectrons: number;
  totalExpectedElectrons: number;
  poissonVarianceElectronSquared: number;
  readNoiseVarianceElectronSquared: number;
  predictiveVarianceElectronSquared: number;
  predictiveNoiseRmsElectron: number;
  systematicContributionsElectron: Readonly<{ sourceRadiance: number; geometricArea: number; pixelSolidAngle: number; exposure: number; photonToElectronFactor: number; backgroundRate: number; darkCurrentRate: number; knownComputational: number }>;
  systematicUpperBoundElectron: number;
  systematicUpperBoundRelative: number;
  systematicCombinationPolicy: "linear-sum-correlation-unknown";
  predictiveNoisePolicy: "conditional-independent-poisson-source-background-dark-plus-independent-read-noise-fixture-assumption";
  gainRequiredForElectronExpectation: false;
  expectedAduApplicable: false;
  observedCountsApplicable: false;
  scienceRasterAllowed: false;
  fixtureOnly: true;
}>;

function assertInput(input: KerrDetectorElectronExpectationInputV447): void {
  const positive = [input.sourcePhotonRadiancePerSM2Sr, input.geometricAreaM2, input.pixelSolidAngleSr, input.exposureSeconds, input.photonToElectronFactor];
  const nonNegative = [input.backgroundElectronPerSecondPerPixel, input.darkCurrentElectronPerSecondPerPixel, input.readNoiseRmsElectronPerFrame, input.uncertainty.sourceRadianceRelative, input.uncertainty.geometricAreaRelative, input.uncertainty.pixelSolidAngleRelative, input.uncertainty.exposureSecondsAbsolute, input.uncertainty.photonToElectronFactorRelative, input.uncertainty.backgroundRateAbsolute, input.uncertainty.darkCurrentRateAbsolute, input.uncertainty.knownComputationalRelative];
  if (input.sourceKind !== "test-fixture" || !/^[a-z0-9-]{1,64}$/.test(input.fixtureId) || ![12, 13, 14, 15].includes(input.rayIndex) || positive.some((value) => !finite(value) || value <= 0) || input.photonToElectronFactor > 1 || nonNegative.some((value) => !finite(value) || value < 0) || !Number.isInteger(input.frameCount) || input.frameCount < 1 || input.frameCount > 100_000 || input.uncertainty.correlationEvidenceAvailable !== false || (input.photonToElectronSemantics === "throughput-includes-detector-qe" && input.photonToElectronFactor !== 1) || !["throughput-includes-detector-qe", "separate-detector-qe-applied"].includes(input.photonToElectronSemantics)) throw new Error("v447-electron-input-boundary");
}

export function computeKerrDetectorElectronExpectationV447(input: KerrDetectorElectronExpectationInputV447): KerrDetectorElectronExpectationResultV447 {
  assertInput(input);
  const sourceRateElectronPerSecond = input.sourcePhotonRadiancePerSM2Sr * input.geometricAreaM2 * input.pixelSolidAngleSr * input.photonToElectronFactor;
  const sourceExpectedElectrons = sourceRateElectronPerSecond * input.exposureSeconds, backgroundExpectedElectrons = input.backgroundElectronPerSecondPerPixel * input.exposureSeconds, darkExpectedElectrons = input.darkCurrentElectronPerSecondPerPixel * input.exposureSeconds, totalExpectedElectrons = neumaier([sourceExpectedElectrons, backgroundExpectedElectrons, darkExpectedElectrons]), poissonVarianceElectronSquared = totalExpectedElectrons, readNoiseVarianceElectronSquared = input.frameCount * input.readNoiseRmsElectronPerFrame ** 2, predictiveVarianceElectronSquared = neumaier([poissonVarianceElectronSquared, readNoiseVarianceElectronSquared]), predictiveNoiseRmsElectron = Math.sqrt(predictiveVarianceElectronSquared);
  const uncertainty = input.uncertainty, contributions = freeze({ sourceRadiance: sourceExpectedElectrons * uncertainty.sourceRadianceRelative, geometricArea: sourceExpectedElectrons * uncertainty.geometricAreaRelative, pixelSolidAngle: sourceExpectedElectrons * uncertainty.pixelSolidAngleRelative, exposure: (sourceRateElectronPerSecond + input.backgroundElectronPerSecondPerPixel + input.darkCurrentElectronPerSecondPerPixel) * uncertainty.exposureSecondsAbsolute, photonToElectronFactor: sourceExpectedElectrons * uncertainty.photonToElectronFactorRelative, backgroundRate: input.exposureSeconds * uncertainty.backgroundRateAbsolute, darkCurrentRate: input.exposureSeconds * uncertainty.darkCurrentRateAbsolute, knownComputational: sourceExpectedElectrons * uncertainty.knownComputationalRelative });
  const systematicUpperBoundElectron = neumaier(Object.values(contributions)), systematicUpperBoundRelative = systematicUpperBoundElectron / totalExpectedElectrons;
  if (![sourceExpectedElectrons, backgroundExpectedElectrons, darkExpectedElectrons, totalExpectedElectrons, poissonVarianceElectronSquared, readNoiseVarianceElectronSquared, predictiveVarianceElectronSquared, predictiveNoiseRmsElectron, systematicUpperBoundElectron, systematicUpperBoundRelative].every((value) => finite(value) && value >= 0) || Math.abs(totalExpectedElectrons - neumaier([sourceExpectedElectrons, backgroundExpectedElectrons, darkExpectedElectrons])) / totalExpectedElectrons > 1e-15 || Math.abs(predictiveNoiseRmsElectron ** 2 - predictiveVarianceElectronSquared) / predictiveVarianceElectronSquared > 1e-15) throw new Error("v447-electron-budget-invariant");
  return freeze({ version: KERR_DETECTOR_ELECTRON_KERNEL_VERSION_V447, fixtureId: input.fixtureId, rayIndex: input.rayIndex, sourceExpectedElectrons, backgroundExpectedElectrons, darkExpectedElectrons, totalExpectedElectrons, poissonVarianceElectronSquared, readNoiseVarianceElectronSquared, predictiveVarianceElectronSquared, predictiveNoiseRmsElectron, systematicContributionsElectron: contributions, systematicUpperBoundElectron, systematicUpperBoundRelative, systematicCombinationPolicy: "linear-sum-correlation-unknown", predictiveNoisePolicy: "conditional-independent-poisson-source-background-dark-plus-independent-read-noise-fixture-assumption", gainRequiredForElectronExpectation: false, expectedAduApplicable: false, observedCountsApplicable: false, scienceRasterAllowed: false, fixtureOnly: true });
}

export type KerrDetectorElectronKernelArtifactV447 = Readonly<{ version: typeof KERR_DETECTOR_ELECTRON_KERNEL_ARTIFACT_VERSION_V447; generatedAt: string; status: "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable"; source: Readonly<{ v444ArtifactSha256: string; v446ArtifactSha256: string; v414ArtifactSha256: string; pythonOracleArtifactSha256: string }>; rows: readonly KerrDetectorElectronExpectationResultV447[]; counts: Readonly<{ fixtureRowCount: 4; measuredRowCount: 0; observedCountRowCount: 0; scienceRasterRowCount: 0 }>; oracleComparison: Readonly<{ maximumSourceExpectedRelative: number; maximumTotalExpectedRelative: number; maximumPredictiveVarianceRelative: number; maximumSystematicUpperBoundRelative: number; limit: 1e-12; qualified: true }>; qualification: Readonly<{ unitStrictKernelQualified: true; pythonDecimalOracleQualified: true; deterministicReplay: true; conservativeSystematicBudgetQualified: true; predictiveNoiseFixtureQualified: true; gainExcludedFromElectronExpectation: true; measuredDetectorAuthorityGranted: false; observedCountsAvailable: false; scienceRasterAllowed: false; browserQualification: "not-run" }>; formalProductPointer: "v263"; denseCampaignStatus: "incomplete-0-of-49"; networkAttempted: false; automaticRetryApplied: false; artifactSha256: string }>;
export type KerrDetectorElectronKernelSummaryV447 = Readonly<{ version: typeof KERR_DETECTOR_ELECTRON_KERNEL_SUMMARY_VERSION_V447; status: KerrDetectorElectronKernelArtifactV447["status"]; artifactSha256: string; counts: KerrDetectorElectronKernelArtifactV447["counts"]; maxima: Readonly<{ totalExpectedElectrons: number; predictiveNoiseRmsElectron: number; systematicUpperBoundRelative: number }>; oracleComparison: KerrDetectorElectronKernelArtifactV447["oracleComparison"]; qualification: KerrDetectorElectronKernelArtifactV447["qualification"] }>;
export type KerrDetectorElectronKernelApiV447 = Readonly<{ version: typeof KERR_DETECTOR_ELECTRON_KERNEL_API_VERSION_V447; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrDetectorElectronKernelSummaryV447 | null }>;
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalShaV447 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
export function parseKerrDetectorElectronKernelArtifactV447(value: unknown): KerrDetectorElectronKernelArtifactV447 { const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorElectronKernelArtifactV447> : null; if (!artifact || artifact.version !== KERR_DETECTOR_ELECTRON_KERNEL_ARTIFACT_VERSION_V447 || artifact.status !== "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable" || !SHA256.test(artifact.artifactSha256 ?? "") || !artifact.source || Object.values(artifact.source).some((entry) => !SHA256.test(entry)) || artifact.rows?.length !== 4 || artifact.rows.some((row) => row.fixtureOnly !== true || row.gainRequiredForElectronExpectation !== false || row.expectedAduApplicable !== false || row.observedCountsApplicable !== false || row.scienceRasterAllowed !== false || row.systematicCombinationPolicy !== "linear-sum-correlation-unknown") || artifact.counts?.fixtureRowCount !== 4 || artifact.counts.measuredRowCount !== 0 || artifact.counts.observedCountRowCount !== 0 || artifact.counts.scienceRasterRowCount !== 0 || artifact.oracleComparison?.qualified !== true || artifact.oracleComparison.limit !== 1e-12 || Math.max(artifact.oracleComparison.maximumSourceExpectedRelative, artifact.oracleComparison.maximumTotalExpectedRelative, artifact.oracleComparison.maximumPredictiveVarianceRelative, artifact.oracleComparison.maximumSystematicUpperBoundRelative) >= 1e-12 || artifact.qualification?.unitStrictKernelQualified !== true || artifact.qualification.pythonDecimalOracleQualified !== true || artifact.qualification.deterministicReplay !== true || artifact.qualification.conservativeSystematicBudgetQualified !== true || artifact.qualification.predictiveNoiseFixtureQualified !== true || artifact.qualification.gainExcludedFromElectronExpectation !== true || artifact.qualification.measuredDetectorAuthorityGranted !== false || artifact.qualification.observedCountsAvailable !== false || artifact.qualification.scienceRasterAllowed !== false || artifact.qualification.browserQualification !== "not-run" || artifact.formalProductPointer !== "v263" || artifact.denseCampaignStatus !== "incomplete-0-of-49" || artifact.networkAttempted !== false || artifact.automaticRetryApplied !== false) throw new Error("v447-artifact-identity"); return freeze(value as KerrDetectorElectronKernelArtifactV447); }
export function createKerrDetectorElectronKernelSummaryV447(value: unknown): KerrDetectorElectronKernelSummaryV447 { const artifact = parseKerrDetectorElectronKernelArtifactV447(value); return freeze({ version: KERR_DETECTOR_ELECTRON_KERNEL_SUMMARY_VERSION_V447, status: artifact.status, artifactSha256: artifact.artifactSha256, counts: artifact.counts, maxima: { totalExpectedElectrons: Math.max(...artifact.rows.map((row) => row.totalExpectedElectrons)), predictiveNoiseRmsElectron: Math.max(...artifact.rows.map((row) => row.predictiveNoiseRmsElectron)), systematicUpperBoundRelative: Math.max(...artifact.rows.map((row) => row.systematicUpperBoundRelative)) }, oracleComparison: artifact.oracleComparison, qualification: artifact.qualification }); }
export function parseKerrDetectorElectronKernelApiV447(value: unknown): KerrDetectorElectronKernelApiV447 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorElectronKernelApiV447> : null; if (!source || source.version !== KERR_DETECTOR_ELECTRON_KERNEL_API_VERSION_V447 || typeof source.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "") || (source.available && !source.summary) || (!source.available && source.summary !== null)) throw new Error("v447-api-identity"); return freeze(value as KerrDetectorElectronKernelApiV447); }
