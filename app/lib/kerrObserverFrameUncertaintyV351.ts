import type { KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrScienceObservationProductV341 } from "./kerrScienceObservationProductV341";
import type { KerrScienceBandUncertaintyProvenanceV326 } from "./kerrScienceBandUncertaintyProvenanceV326";
import type { KerrScienceBandObservationArtifactV350 } from "./kerrScienceBandObservationV350";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_OBSERVER_FRAME_UNCERTAINTY_VERSION_V351 = "v351-kerr-observer-frame-uncertainty-ledger-v1" as const;
export type KerrObserverFrameUncertaintyRowV351 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  bandId: KerrThinDiskBandIdV320;
  observerFrame: Readonly<{
    redshiftFactor: number;
    emissionRadiusCoordinate: number;
    emissionRadiusUnit: "GM/c^2";
    sourceField: "emissionRadiusM";
    semanticStatus: "legacy-field-name-geometric-unit-explicit";
  }>;
  energyRadiance: Readonly<{
    nominalWM2Sr: number;
    lowerWM2Sr: number;
    upperWM2Sr: number;
    unit: "W m^-2 sr^-1";
    reportedRelativeEnvelope: number;
    compensatedLinearRelativeEnvelope: number;
  }>;
  includedRelativeComponents: Readonly<{
    bandQuadratureRelative: number;
    diskQuadratureRelative: number;
    carterKerrSchildSpectralRelative: number;
    redshiftPerturbationRelative: number;
  }>;
  excludedDiagnostics: Readonly<{
    geometryRedshiftDifference: Readonly<{ value: number; reason: "already-propagated-into-redshift-perturbation-no-double-count" }>;
    geometryRadiusDifference: Readonly<{ value: number; unit: "GM/c^2"; reason: "dimensionful-coordinate-diagnostic-not-relative-radiance" }>;
    instrumentQuadratureRelative: Readonly<{ value: number; reason: "synthetic-operator-numerical-audit-not-detector-independent-radiance" }>;
    evpaDifference: Readonly<{ value: number; unit: "deg"; reason: "angular-polarization-diagnostic-not-radiance" }>;
  }>;
  syntheticExpectationEnvelope: Readonly<{
    value: null;
    status: "unavailable";
    reason: "no-componentwise-photon-response-uncertainty-propagation";
  }>;
  combinationPolicy: "compensated-linear-sum-no-independence-claim-no-rss";
  provenance: Readonly<{
    fullShortAuthoritySha256: string;
    observationArtifactSha256: string;
    uncertaintyArtifactSha256: string;
    instrumentArtifactSha256: string;
  }>;
}>;

export type KerrObserverFrameUncertaintyArtifactV351 = Readonly<{
  version: typeof KERR_OBSERVER_FRAME_UNCERTAINTY_VERSION_V351;
  generatedAt: string;
  status: "qualified-componentwise-observer-frame-ledger";
  source: Readonly<{
    observationPath: "dist/science/kerr-band-observation-v350/observation.json";
    observationFileSha256: string;
    observationArtifactSha256: string;
    productPath: "dist/science/kerr-observation-product-v341/observation-product.json";
    productFileSha256: string;
    productArtifactSha256: string;
    uncertaintyPath: "dist/science/kerr-science-band-uncertainty-v326/provenance-reference.json";
    uncertaintyFileSha256: string;
    uncertaintyArtifactSha256: string;
    instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json";
    instrumentFileSha256: string;
    instrumentArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  counts: Readonly<{ rayCount: 4; bandCount: 3; rowCount: 12; includedRelativeComponentCount: 4; excludedDiagnosticCount: 4 }>;
  rows: readonly KerrObserverFrameUncertaintyRowV351[];
  maxima: Readonly<{
    compensatedLinearRelativeEnvelope: number;
    envelopeReconstructionRelativeDifference: number;
    geometryRadiusDifference: number;
    instrumentQuadratureRelative: number;
    evpaDifferenceDeg: number;
  }>;
  combinationPolicy: "compensated-linear-sum-no-independence-claim-no-rss";
  interpretation: "deterministic-audit-envelope-not-statistical-confidence-interval";
  syntheticExpectationEnvelope: "unavailable-no-componentwise-photon-response-uncertainty-propagation";
  scienceCinematicBoundary: "observer-frame-uncertainty-ledger-never-cinematic-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/; const RAYS = [12, 13, 14, 15] as const; const BANDS = ["visible", "euv", "soft-x-ray"] as const;
function compensatedSum(values: readonly number[]): number { let sum = 0; let compensation = 0; for (const value of values) { const next = sum + value; compensation += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum; sum = next; } return sum + compensation; }
function relativeDifference(left: number, right: number): number { return Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right)); }
function key(rayIndex: number, bandId: KerrThinDiskBandIdV320): string { return `${rayIndex}:${bandId}`; }

export function createKerrObserverFrameUncertaintyV351(observation: KerrScienceBandObservationArtifactV350, product: KerrScienceObservationProductV341, uncertainty: KerrScienceBandUncertaintyProvenanceV326, instrument: KerrScienceInstrumentResponseV332, source: KerrObserverFrameUncertaintyArtifactV351["source"], artifactSha256 = "pending"): KerrObserverFrameUncertaintyArtifactV351 {
  if (observation.status !== "qualified-read-only-band-observation-provenance" || product.status !== "qualified-sparse-observation-product" || uncertainty.mode !== "science" || instrument.status !== "qualified-synthetic-reference-instrument-operator" || observation.denseAggregateSha256 !== null || product.authority.denseAggregateSha256 !== null || uncertainty.source.denseAggregateSha256 !== null || instrument.source.denseAggregateSha256 !== null || source.fullShortAuthoritySha256 !== product.authority.fullShortAuthoritySha256) throw new Error("v351-source-boundary");
  const observations = new Map(observation.rows.map((row) => [key(row.rayIndex, row.bandId), row])); const products = new Map(product.measurements.map((row) => [key(row.rayIndex, row.bandId), row])); const uncertainties = new Map(uncertainty.rows.map((row) => [key(row.rayIndex, row.bandId), row])); const instruments = new Map(instrument.rows.map((row) => [key(row.rayIndex, row.bandId), row]));
  let maximumReconstruction = 0; const rows = RAYS.flatMap((rayIndex) => BANDS.map((bandId): KerrObserverFrameUncertaintyRowV351 => { const observationRow = observations.get(key(rayIndex, bandId)); const productRow = products.get(key(rayIndex, bandId)); const uncertaintyRow = uncertainties.get(key(rayIndex, bandId)); const instrumentRow = instruments.get(key(rayIndex, bandId)); if (!observationRow || !productRow || !uncertaintyRow || !instrumentRow) throw new Error(`v351-row-missing:${rayIndex}:${bandId}`); const components = [uncertaintyRow.bandQuadratureRelative, uncertaintyRow.diskQuadratureRelative, uncertaintyRow.carterKerrSchildSpectralRelative, uncertaintyRow.redshiftPerturbationRelative] as const; const compensated = compensatedSum(components); const reconstruction = relativeDifference(compensated, uncertaintyRow.conservativeLinearRelativeEnvelope); maximumReconstruction = Math.max(maximumReconstruction, reconstruction); if (reconstruction > 1e-12 || relativeDifference(observationRow.energyRadianceWM2Sr, productRow.observedEnergyRadianceWM2Sr) > 1e-14 || relativeDifference(observationRow.energyRadianceLowerWM2Sr, productRow.lowerAuditEnvelopeWM2Sr) > 1e-14 || relativeDifference(observationRow.energyRadianceUpperWM2Sr, productRow.upperAuditEnvelopeWM2Sr) > 1e-14) throw new Error(`v351-row-conservation:${rayIndex}:${bandId}`); return Object.freeze({ rayIndex, spinA: productRow.spinA, bandId, observerFrame: { redshiftFactor: productRow.redshiftFactor, emissionRadiusCoordinate: productRow.emissionRadiusM, emissionRadiusUnit: "GM/c^2", sourceField: "emissionRadiusM", semanticStatus: "legacy-field-name-geometric-unit-explicit" }, energyRadiance: { nominalWM2Sr: productRow.observedEnergyRadianceWM2Sr, lowerWM2Sr: productRow.lowerAuditEnvelopeWM2Sr, upperWM2Sr: productRow.upperAuditEnvelopeWM2Sr, unit: "W m^-2 sr^-1", reportedRelativeEnvelope: uncertaintyRow.conservativeLinearRelativeEnvelope, compensatedLinearRelativeEnvelope: compensated }, includedRelativeComponents: { bandQuadratureRelative: uncertaintyRow.bandQuadratureRelative, diskQuadratureRelative: uncertaintyRow.diskQuadratureRelative, carterKerrSchildSpectralRelative: uncertaintyRow.carterKerrSchildSpectralRelative, redshiftPerturbationRelative: uncertaintyRow.redshiftPerturbationRelative }, excludedDiagnostics: { geometryRedshiftDifference: { value: uncertaintyRow.geometryRedshiftDifference, reason: "already-propagated-into-redshift-perturbation-no-double-count" }, geometryRadiusDifference: { value: uncertaintyRow.geometryRadiusDifferenceM, unit: "GM/c^2", reason: "dimensionful-coordinate-diagnostic-not-relative-radiance" }, instrumentQuadratureRelative: { value: instrumentRow.quadratureRelativeDifference, reason: "synthetic-operator-numerical-audit-not-detector-independent-radiance" }, evpaDifference: { value: productRow.evpaDifferenceDeg, unit: "deg", reason: "angular-polarization-diagnostic-not-radiance" } }, syntheticExpectationEnvelope: { value: null, status: "unavailable", reason: "no-componentwise-photon-response-uncertainty-propagation" }, combinationPolicy: "compensated-linear-sum-no-independence-claim-no-rss", provenance: { fullShortAuthoritySha256: source.fullShortAuthoritySha256, observationArtifactSha256: source.observationArtifactSha256, uncertaintyArtifactSha256: source.uncertaintyArtifactSha256, instrumentArtifactSha256: source.instrumentArtifactSha256 } }) as KerrObserverFrameUncertaintyRowV351; }));
  if (rows.length !== 12 || new Set(rows.map((row) => key(row.rayIndex, row.bandId))).size !== 12) throw new Error("v351-row-count");
  return Object.freeze({ version: KERR_OBSERVER_FRAME_UNCERTAINTY_VERSION_V351, generatedAt: new Date().toISOString(), status: "qualified-componentwise-observer-frame-ledger", source, counts: { rayCount: 4, bandCount: 3, rowCount: 12, includedRelativeComponentCount: 4, excludedDiagnosticCount: 4 }, rows: Object.freeze(rows), maxima: { compensatedLinearRelativeEnvelope: Math.max(...rows.map((row) => row.energyRadiance.compensatedLinearRelativeEnvelope)), envelopeReconstructionRelativeDifference: maximumReconstruction, geometryRadiusDifference: Math.max(...rows.map((row) => row.excludedDiagnostics.geometryRadiusDifference.value)), instrumentQuadratureRelative: Math.max(...rows.map((row) => row.excludedDiagnostics.instrumentQuadratureRelative.value)), evpaDifferenceDeg: Math.max(...rows.map((row) => row.excludedDiagnostics.evpaDifference.value)) }, combinationPolicy: "compensated-linear-sum-no-independence-claim-no-rss", interpretation: "deterministic-audit-envelope-not-statistical-confidence-interval", syntheticExpectationEnvelope: "unavailable-no-componentwise-photon-response-uncertainty-propagation", scienceCinematicBoundary: "observer-frame-uncertainty-ledger-never-cinematic-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 }) as KerrObserverFrameUncertaintyArtifactV351;
}

export function parseKerrObserverFrameUncertaintyArtifactV351(value: unknown): KerrObserverFrameUncertaintyArtifactV351 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrObserverFrameUncertaintyArtifactV351> : null; const rows = source?.rows ?? []; if (!source || source.version !== KERR_OBSERVER_FRAME_UNCERTAINTY_VERSION_V351 || source.status !== "qualified-componentwise-observer-frame-ledger" || !SHA.test(source.source?.observationFileSha256 ?? "") || !SHA.test(source.source?.productFileSha256 ?? "") || !SHA.test(source.source?.uncertaintyFileSha256 ?? "") || !SHA.test(source.source?.instrumentFileSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.bandCount !== 3 || source.counts.rowCount !== 12 || source.counts.includedRelativeComponentCount !== 4 || source.counts.excludedDiagnosticCount !== 4 || rows.length !== 12 || rows.some((row) => !RAYS.includes(row.rayIndex) || !BANDS.includes(row.bandId) || row.observerFrame.emissionRadiusUnit !== "GM/c^2" || row.observerFrame.semanticStatus !== "legacy-field-name-geometric-unit-explicit" || row.energyRadiance.lowerWM2Sr > row.energyRadiance.nominalWM2Sr || row.energyRadiance.upperWM2Sr < row.energyRadiance.nominalWM2Sr || row.combinationPolicy !== "compensated-linear-sum-no-independence-claim-no-rss" || row.syntheticExpectationEnvelope.value !== null || row.syntheticExpectationEnvelope.status !== "unavailable" || row.excludedDiagnostics.geometryRedshiftDifference.reason !== "already-propagated-into-redshift-perturbation-no-double-count" || row.excludedDiagnostics.geometryRadiusDifference.reason !== "dimensionful-coordinate-diagnostic-not-relative-radiance" || row.excludedDiagnostics.instrumentQuadratureRelative.reason !== "synthetic-operator-numerical-audit-not-detector-independent-radiance" || row.excludedDiagnostics.evpaDifference.reason !== "angular-polarization-diagnostic-not-radiance") || source.maxima?.envelopeReconstructionRelativeDifference == null || source.maxima.envelopeReconstructionRelativeDifference > 1e-12 || source.combinationPolicy !== "compensated-linear-sum-no-independence-claim-no-rss" || source.syntheticExpectationEnvelope !== "unavailable-no-componentwise-photon-response-uncertainty-propagation" || source.scienceCinematicBoundary !== "observer-frame-uncertainty-ledger-never-cinematic-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v351-observer-frame-uncertainty-identity"); return value as KerrObserverFrameUncertaintyArtifactV351; }
