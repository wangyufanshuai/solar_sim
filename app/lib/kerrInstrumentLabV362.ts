import type { DetectorCalibrationInspectArtifactV361 } from "./detectorCalibrationAdmissionV361";
import type { KerrDetectorBreakEvenArtifactV360 } from "./kerrDetectorBreakEvenV360";
import type { KerrObservablePhotonUncertaintyArtifactV358 } from "./kerrObservablePhotonUncertaintyV358";
import type { KerrPhotonCountingNoiseBudgetArtifactV359 } from "./kerrPhotonCountingNoiseBudgetV359";
import type { KerrSpectralConfidenceScaleArtifactV357 } from "./kerrSpectralConfidenceScaleV357";
import type { KerrSpectralEnvelopeArtifactV356 } from "./kerrSpectralEnvelopeV356";

export const KERR_INSTRUMENT_LAB_VERSION_V362 = "v362-kerr-instrument-lab-summary-v1" as const;

export type KerrInstrumentLabSourceSetV362 = Readonly<{
  v356: KerrSpectralEnvelopeArtifactV356;
  v357: KerrSpectralConfidenceScaleArtifactV357;
  v358: KerrObservablePhotonUncertaintyArtifactV358;
  v359: KerrPhotonCountingNoiseBudgetArtifactV359;
  v360: KerrDetectorBreakEvenArtifactV360;
  v361: DetectorCalibrationInspectArtifactV361;
}>;

export type KerrInstrumentLabStageV362 = Readonly<{
  version: "v356" | "v357" | "v358" | "v359" | "v360" | "v361";
  label: string;
  status: string;
  authority: "synthetic-qualified" | "measured-blocked";
  artifactSha256: string;
}>;

export type KerrInstrumentLabSnapshotV362 = Readonly<{
  version: typeof KERR_INSTRUMENT_LAB_VERSION_V362;
  status: "implemented-synthetic-instrument-chain-measured-calibration-blocked";
  stages: readonly KerrInstrumentLabStageV362[];
  stageCount: 6;
  syntheticQualifiedCount: 5;
  measuredQualifiedCount: 0;
  measuredCalibration: Readonly<{
    status: "blocked-measured-calibration-input-unavailable";
    missingRequirementCount: 11;
    attemptConsumed: false;
    networkAttempted: false;
  }>;
  provenanceDigest: string;
  scienceBufferMutationAllowed: false;
  cinematicColorInputAllowed: false;
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  boundary: "read-only-sanitized-instrument-summary-not-measured-detector-authority";
}>;

const SHA = /^[a-f0-9]{64}$/;

function digest(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function createKerrInstrumentLabSnapshotV362(source: KerrInstrumentLabSourceSetV362): KerrInstrumentLabSnapshotV362 {
  if (source.v356.status !== "qualified-synthetic-provenance-and-reconstructable-envelope-audit"
    || source.v357.status !== "qualified-synthetic-multiscale-envelope-audit"
    || source.v358.status !== "qualified-synthetic-observable-photon-uncertainty-propagation"
    || source.v359.status !== "qualified-conditional-poisson-systematic-noise-budget"
    || source.v360.status !== "qualified-synthetic-detector-break-even-requirement-audit"
    || source.v361.status !== "blocked-measured-calibration-input-unavailable") throw new Error("v362-instrument-stage-status");
  const artifacts = [source.v356, source.v357, source.v358, source.v359, source.v360];
  if (artifacts.some((artifact) => artifact.denseCampaignStatus !== "incomplete-0-of-49" || artifact.denseAggregateSha256 !== null || artifact.browserQualification !== "not-run")) throw new Error("v362-instrument-dense-boundary");
  if (source.v361.missingRequirements.length !== 11 || source.v361.attemptConsumed || source.v361.networkAttempted || source.v361.admissionQualified) throw new Error("v362-instrument-measured-boundary");
  const stages = Object.freeze([
    { version: "v356", label: "Uncertainty envelope", status: source.v356.status, authority: "synthetic-qualified", artifactSha256: source.v356.artifactSha256 },
    { version: "v357", label: "1σ / 2σ / 3σ scale", status: source.v357.status, authority: "synthetic-qualified", artifactSha256: source.v357.artifactSha256 },
    { version: "v358", label: "Expected photons", status: source.v358.status, authority: "synthetic-qualified", artifactSha256: source.v358.artifactSha256 },
    { version: "v359", label: "Conditional counting noise", status: source.v359.status, authority: "synthetic-qualified", artifactSha256: source.v359.artifactSha256 },
    { version: "v360", label: "Detector break-even", status: source.v360.status, authority: "synthetic-qualified", artifactSha256: source.v360.artifactSha256 },
    { version: "v361", label: "Measured calibration admission", status: source.v361.status, authority: "measured-blocked", artifactSha256: source.v361.artifactSha256 },
  ] satisfies KerrInstrumentLabStageV362[]);
  if (stages.some((stage) => !SHA.test(stage.artifactSha256))) throw new Error("v362-instrument-source-sha");
  return Object.freeze({
    version: KERR_INSTRUMENT_LAB_VERSION_V362,
    status: "implemented-synthetic-instrument-chain-measured-calibration-blocked",
    stages,
    stageCount: 6,
    syntheticQualifiedCount: 5,
    measuredQualifiedCount: 0,
    measuredCalibration: Object.freeze({ status: "blocked-measured-calibration-input-unavailable", missingRequirementCount: 11, attemptConsumed: false, networkAttempted: false }),
    provenanceDigest: digest(stages.map((stage) => `${stage.version}:${stage.artifactSha256}`).join("|")),
    scienceBufferMutationAllowed: false,
    cinematicColorInputAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    denseAggregateSha256: null,
    browserQualification: "not-run",
    boundary: "read-only-sanitized-instrument-summary-not-measured-detector-authority",
  });
}

export function parseKerrInstrumentLabSnapshotV362(value: unknown): KerrInstrumentLabSnapshotV362 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v362-instrument-object");
  const source = value as Partial<KerrInstrumentLabSnapshotV362>;
  if (source.version !== KERR_INSTRUMENT_LAB_VERSION_V362
    || source.status !== "implemented-synthetic-instrument-chain-measured-calibration-blocked"
    || source.stageCount !== 6 || source.syntheticQualifiedCount !== 5 || source.measuredQualifiedCount !== 0
    || source.stages?.length !== 6 || source.stages.some((stage) => !SHA.test(stage.artifactSha256))
    || !/^[a-f0-9]{8}$/.test(source.provenanceDigest ?? "")
    || source.measuredCalibration?.status !== "blocked-measured-calibration-input-unavailable"
    || source.measuredCalibration.missingRequirementCount !== 11 || source.measuredCalibration.attemptConsumed !== false || source.measuredCalibration.networkAttempted !== false
    || source.scienceBufferMutationAllowed !== false || source.cinematicColorInputAllowed !== false
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null
    || source.browserQualification !== "not-run"
    || source.boundary !== "read-only-sanitized-instrument-summary-not-measured-detector-authority") throw new Error("v362-instrument-identity");
  return value as KerrInstrumentLabSnapshotV362;
}
