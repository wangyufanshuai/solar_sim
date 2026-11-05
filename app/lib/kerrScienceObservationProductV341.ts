import {
  KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325,
  parseKerrScienceBandUncertaintyViewV325,
  type KerrScienceBandUncertaintyViewV325,
} from "./kerrScienceBandUncertaintyV325";
import {
  parseKerrScienceInstrumentResponseV332,
  type KerrScienceInstrumentResponseV332,
} from "./kerrScienceInstrumentResponseV332";
import { KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331 } from "./kerrSciencePhotonProvenanceV331";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import { resolveKerrStrongGravityVisualContractV305 } from "./kerrStrongGravityVisualV305";
import { KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import {
  KERR_CLASSIFICATION_V299,
  validateKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_OBSERVATION_PRODUCT_VERSION_V341 = "v341-kerr-sparse-observation-product-v1" as const;
export const KERR_SCIENCE_OBSERVATION_PROFILE_AUDIT_VERSION_V341 = "v341-kerr-observation-profile-isolation-audit-v1" as const;

export type KerrScienceObservationMeasurementV341 = Readonly<{
  rayIndex: number;
  spinA: number;
  bandId: KerrThinDiskBandIdV320;
  emissionRadiusM: number;
  redshiftFactor: number;
  imageOrder: number;
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  observedEnergyRadianceWM2Sr: number;
  lowerAuditEnvelopeWM2Sr: number;
  upperAuditEnvelopeWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  detectorIndependentPhotonRadiancePerSM2Sr: number;
  throughputWeightedPhotonRadiancePerSM2Sr: number;
  effectiveBandThroughput: number;
  expectedPhotonRatePerPixelS: number;
  expectedPhotonsPerPixelExposure: number;
  components: KerrScienceBandUncertaintyViewV325["rays"][number]["measurements"][number]["components"];
}>;

export type KerrScienceObservationProductV341 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVATION_PRODUCT_VERSION_V341;
  status: "qualified-sparse-observation-product";
  authority: Readonly<{
    kind: "v312-v313-short-gate-sparse";
    fullShortAuthoritySha256: string;
    geometryEvidenceSha256: string;
    polarizationEvidenceSha256: string;
    rayPlanSha256: string;
    denseCampaignStatus: "incomplete-0-of-49";
    denseAggregateSha256: null;
  }>;
  sources: Readonly<{
    uncertaintyArtifactSha256: typeof KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325;
    photonProvenanceArtifactSha256: typeof KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331;
    instrumentResponseArtifactSha256: string;
  }>;
  instrument: Readonly<{
    modelId: "synthetic-reference-photon-counter-v332";
    status: "synthetic-audit-fixture-not-calibrated-observatory";
    collectingAreaM2: number;
    pixelSolidAngleSr: number;
    exposureTimeS: number;
    stochasticNoise: "disabled";
  }>;
  counts: Readonly<{
    authorityRayCount: 16;
    applicableDiskRayCount: 4;
    unavailableRayCount: 12;
    bandMeasurementCount: 12;
    polarizationMeasurementCount: 4;
  }>;
  measurements: readonly KerrScienceObservationMeasurementV341[];
  maxima: Readonly<{
    conservativeLinearRelativeEnvelope: number;
    instrumentQuadratureRelativeDifference: number;
    evpaDifferenceDeg: number;
    expectedPhotonsPerPixelExposure: number;
  }>;
  units: Readonly<{
    radius: "GM/c^2";
    angle: "deg";
    energyRadiance: "W m^-2 sr^-1";
    photonRadiance: "photons s^-1 m^-2 sr^-1";
    photonRate: "photons s^-1 pixel^-1";
    exposureExpectation: "photons pixel^-1 exposure^-1";
  }>;
  assumptions: readonly [
    "test-particle-kerr",
    "page-thorne-thin-optically-thick-disk",
    "projected-disk-normal-polarization",
    "synthetic-instrument-audit-fixture-not-calibrated-observatory",
    "componentwise-linear-uncertainty-no-independence-claim-no-rss",
  ];
  scienceCinematicBoundary: "physical-observation-product-read-only-cinematic-receives-derived-copy-without-measurement-fields";
  browserQualification: "not-run";
  boundary: "four-disk-ray-twelve-band-sparse-product-not-dense-image-not-measured-counts";
}>;

export type KerrScienceObservationProfileAuditV341 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVATION_PROFILE_AUDIT_VERSION_V341;
  status: "qualified-science-profile-invariant-cinematic-copy-isolated";
  profiles: readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300", "science-cinematic-v7-v340"];
  measurementCount: 12;
  scienceDigest: string;
  scienceDigests: Readonly<Record<"v5" | "v6" | "v7", string>>;
  cinematicDigests: Readonly<Record<"v5" | "v6" | "v7", string>>;
  scienceProfileInvariant: true;
  scienceDeterministic: true;
  cinematicDeterministic: true;
  cinematicPairwiseDistinct: true;
  sourceProductByteIdentical: true;
  presentationCopiesDisjoint: true;
  cinematicPhysicalMeasurementFieldsExcluded: true;
  boundary: "v5-v6-v7-presentation-copies-cannot-mutate-or-encode-back-into-science-product";
}>;

function sha(value: string): string {
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(value);
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
}

function finitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`v341-${label}`);
  return value;
}

function key(rayIndex: number, bandId: KerrThinDiskBandIdV320): string {
  return `${rayIndex}:${bandId}`;
}

function sha256(value: string, label: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`v341-${label}-sha`);
  return value;
}

export function createKerrScienceObservationProductV341(
  payloadValue: KerrScienceTransferPayloadV299,
  uncertaintyValue: KerrScienceBandUncertaintyViewV325,
  instrumentValue: KerrScienceInstrumentResponseV332,
  instrumentResponseArtifactSha256: string,
): KerrScienceObservationProductV341 {
  const payload = payloadValue;
  const payloadValidation = validateKerrScienceTransferPayloadV299(payload);
  const uncertainty = parseKerrScienceBandUncertaintyViewV325(uncertaintyValue);
  const instrument = parseKerrScienceInstrumentResponseV332(instrumentValue);
  if (!payloadValidation.passed || payload.authorityKind !== "v312-v313-short-gate-sparse"
    || payload.sampleCount !== 16 || payload.denseCampaignComplete || payload.denseAggregateSha256 !== null
    || uncertainty.source.fullShortAuthoritySha256 !== instrument.source.fullShortAuthoritySha256
    || uncertainty.source.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || uncertainty.source.denseAggregateSha256 !== null || instrument.source.denseAggregateSha256 !== null) {
    throw new Error("v341-authority-boundary");
  }
  const instrumentByKey = new Map(instrument.rows.map((row) => [key(row.rayIndex, row.bandId), row]));
  if (instrumentByKey.size !== 12) throw new Error("v341-instrument-identity");
  let maximumEvpaDifference = 0;
  const measurements = uncertainty.rays.flatMap((ray) => {
    const index = ray.rayIndex;
    if (index < 0 || index >= payload.sampleCount
      || payload.classification[index] !== KERR_CLASSIFICATION_V299["disk-hit"]
      || payload.redshiftApplicable[index] !== 1 || payload.evpaApplicable[index] !== 1
      || payload.imageOrderApplicable[index] !== 1
      || Math.abs(payload.spinA[index] - ray.spinA) > 1e-12
      || Math.abs(payload.emissionRadiusM[index] - ray.emissionRadiusM) > 1e-10
      || Math.abs(payload.redshiftFactor[index] - ray.redshiftFactor) > 1e-12) throw new Error(`v341-ray-identity:${index}`);
    const evpaDifferenceDeg = payload.evpaDifferenceDeg[index];
    maximumEvpaDifference = Math.max(maximumEvpaDifference, evpaDifferenceDeg);
    return ray.measurements.map((measurement): KerrScienceObservationMeasurementV341 => {
      const response = instrumentByKey.get(key(index, measurement.bandId));
      if (!response || Math.abs(response.spinA - ray.spinA) > 1e-12
        || response.detectorIndependentPhotonRadiancePerSM2Sr <= 0
        || response.expectedPhotonsPerPixelExposure <= 0) throw new Error(`v341-instrument-row:${index}:${measurement.bandId}`);
      return Object.freeze({
        rayIndex: index,
        spinA: ray.spinA,
        bandId: measurement.bandId,
        emissionRadiusM: ray.emissionRadiusM,
        redshiftFactor: ray.redshiftFactor,
        imageOrder: payload.imageOrder[index],
        walkerPenroseEvpaDeg: payload.evpaDeg[index],
        parallelTransportEvpaDeg: payload.parallelTransportEvpaDeg[index],
        evpaDifferenceDeg,
        observedEnergyRadianceWM2Sr: measurement.observedBandRadianceWM2Sr,
        lowerAuditEnvelopeWM2Sr: measurement.lowerAuditEnvelopeWM2Sr,
        upperAuditEnvelopeWM2Sr: measurement.upperAuditEnvelopeWM2Sr,
        conservativeLinearRelativeEnvelope: measurement.conservativeLinearRelativeEnvelope,
        detectorIndependentPhotonRadiancePerSM2Sr: response.detectorIndependentPhotonRadiancePerSM2Sr,
        throughputWeightedPhotonRadiancePerSM2Sr: response.throughputWeightedPhotonRadiancePerSM2Sr,
        effectiveBandThroughput: response.effectiveBandThroughput,
        expectedPhotonRatePerPixelS: response.expectedPhotonRatePerPixelS,
        expectedPhotonsPerPixelExposure: response.expectedPhotonsPerPixelExposure,
        components: Object.freeze({ ...measurement.components }),
      });
    });
  }).sort((left, right) => left.rayIndex - right.rayIndex || left.bandId.localeCompare(right.bandId));
  if (measurements.length !== 12 || new Set(measurements.map((row) => key(row.rayIndex, row.bandId))).size !== 12) {
    throw new Error("v341-measurement-conservation");
  }
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVATION_PRODUCT_VERSION_V341,
    status: "qualified-sparse-observation-product",
    authority: Object.freeze({
      kind: "v312-v313-short-gate-sparse",
      fullShortAuthoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
      geometryEvidenceSha256: sha256(payload.geometryEvidenceSha256, "geometry"),
      polarizationEvidenceSha256: sha256(payload.polarizationEvidenceSha256, "polarization"),
      rayPlanSha256: sha256(payload.rayPlanSha256, "ray-plan"),
      denseCampaignStatus: "incomplete-0-of-49",
      denseAggregateSha256: null,
    }),
    sources: Object.freeze({
      uncertaintyArtifactSha256: KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325,
      photonProvenanceArtifactSha256: KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331,
      instrumentResponseArtifactSha256: sha256(instrumentResponseArtifactSha256, "instrument-response"),
    }),
    instrument: Object.freeze({
      modelId: instrument.model.modelId,
      status: instrument.model.status,
      collectingAreaM2: finitePositive(instrument.model.collectingAreaM2, "collecting-area"),
      pixelSolidAngleSr: finitePositive(instrument.model.pixelSolidAngleSr, "pixel-solid-angle"),
      exposureTimeS: finitePositive(instrument.model.exposureTimeS, "exposure"),
      stochasticNoise: instrument.model.stochasticNoise,
    }),
    counts: Object.freeze({ authorityRayCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12, bandMeasurementCount: 12, polarizationMeasurementCount: 4 }),
    measurements: Object.freeze(measurements),
    maxima: Object.freeze({
      conservativeLinearRelativeEnvelope: uncertainty.maxima.conservativeLinearRelativeEnvelope,
      instrumentQuadratureRelativeDifference: instrument.maxima.quadratureRelativeDifference,
      evpaDifferenceDeg: maximumEvpaDifference,
      expectedPhotonsPerPixelExposure: instrument.maxima.expectedPhotonsPerPixelExposure,
    }),
    units: Object.freeze({ radius: "GM/c^2", angle: "deg", energyRadiance: "W m^-2 sr^-1", photonRadiance: "photons s^-1 m^-2 sr^-1", photonRate: "photons s^-1 pixel^-1", exposureExpectation: "photons pixel^-1 exposure^-1" }),
    assumptions: Object.freeze(["test-particle-kerr", "page-thorne-thin-optically-thick-disk", "projected-disk-normal-polarization", "synthetic-instrument-audit-fixture-not-calibrated-observatory", "componentwise-linear-uncertainty-no-independence-claim-no-rss"] as const),
    scienceCinematicBoundary: "physical-observation-product-read-only-cinematic-receives-derived-copy-without-measurement-fields",
    browserQualification: "not-run",
    boundary: "four-disk-ray-twelve-band-sparse-product-not-dense-image-not-measured-counts",
  });
}

export function parseKerrScienceObservationProductV341(value: unknown): KerrScienceObservationProductV341 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceObservationProductV341> : null;
  if (!source || source.version !== KERR_SCIENCE_OBSERVATION_PRODUCT_VERSION_V341
    || source.status !== "qualified-sparse-observation-product" || source.authority?.kind !== "v312-v313-short-gate-sparse"
    || source.authority.denseCampaignStatus !== "incomplete-0-of-49" || source.authority.denseAggregateSha256 !== null
    || source.sources?.uncertaintyArtifactSha256 !== KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325
    || source.sources.photonProvenanceArtifactSha256 !== KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331
    || source.instrument?.status !== "synthetic-audit-fixture-not-calibrated-observatory" || source.instrument.stochasticNoise !== "disabled"
    || source.counts?.authorityRayCount !== 16 || source.counts.applicableDiskRayCount !== 4 || source.counts.unavailableRayCount !== 12
    || source.counts.bandMeasurementCount !== 12 || source.counts.polarizationMeasurementCount !== 4
    || !Array.isArray(source.measurements) || source.measurements.length !== 12
    || source.measurements.some((row) => !Number.isSafeInteger(row.rayIndex) || row.rayIndex < 12 || row.rayIndex > 15
      || !["visible", "euv", "soft-x-ray"].includes(row.bandId) || !Number.isFinite(row.walkerPenroseEvpaDeg)
      || !Number.isFinite(row.parallelTransportEvpaDeg) || row.evpaDifferenceDeg < 0 || row.evpaDifferenceDeg >= 0.5
      || row.lowerAuditEnvelopeWM2Sr > row.observedEnergyRadianceWM2Sr || row.upperAuditEnvelopeWM2Sr < row.observedEnergyRadianceWM2Sr
      || row.expectedPhotonsPerPixelExposure <= 0 || row.effectiveBandThroughput <= 0 || row.effectiveBandThroughput > 1)
    || source.scienceCinematicBoundary !== "physical-observation-product-read-only-cinematic-receives-derived-copy-without-measurement-fields"
    || source.browserQualification !== "not-run"
    || source.boundary !== "four-disk-ray-twelve-band-sparse-product-not-dense-image-not-measured-counts") throw new Error("v341-observation-product-identity");
  return value as KerrScienceObservationProductV341;
}

function seededUnit(seed: number): number {
  let value = seed >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return (value >>> 0) / 0xffffffff;
}

export function createKerrScienceObservationProfileAuditV341(
  value: KerrScienceObservationProductV341,
): KerrScienceObservationProfileAuditV341 {
  const product = parseKerrScienceObservationProductV341(value);
  const before = stable(product);
  const profiles = [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340] as const;
  const labels = ["v5", "v6", "v7"] as const;
  const scienceDigests = {} as Record<typeof labels[number], string>;
  const cinematicDigests = {} as Record<typeof labels[number], string>;
  const scienceCopies: Float64Array[] = [];
  const cinematicCopies: Float32Array[] = [];
  profiles.forEach((profileId, profileIndex) => {
    const profile = resolveAtlasVisualProfileV299(profileId);
    const scienceContract = resolveKerrStrongGravityVisualContractV305(profile, "science");
    const cinematicContract = resolveKerrStrongGravityVisualContractV305(profile, "cinematic");
    if (scienceContract.displayTransform !== "linear-no-grade" || scienceContract.exposure !== 1 || scienceContract.bloom !== 0 || scienceContract.noise !== 0) throw new Error("v341-science-contract");
    const science = Float64Array.from(product.measurements.flatMap((row) => [row.observedEnergyRadianceWM2Sr, row.lowerAuditEnvelopeWM2Sr, row.upperAuditEnvelopeWM2Sr, row.redshiftFactor, row.walkerPenroseEvpaDeg, row.expectedPhotonsPerPixelExposure]));
    const cinematic = Float32Array.from(product.measurements.flatMap((row, rowIndex) => {
      const normalized = Math.log10(1 + row.observedEnergyRadianceWM2Sr) / 18;
      const detail = 0.94 + seededUnit(cinematicContract.detailSeed + rowIndex * 131) * 0.12;
      return [Math.min(1, normalized * cinematicContract.exposure * detail), cinematicContract.bloom, cinematicContract.redshiftColorStrength, cinematicContract.dopplerColorStrength];
    }));
    scienceCopies.push(science); cinematicCopies.push(cinematic);
    scienceDigests[labels[profileIndex]] = sha(stable(Array.from(science)));
    cinematicDigests[labels[profileIndex]] = sha(stable(Array.from(cinematic)));
  });
  const sourceProductByteIdentical = before === stable(product);
  const scienceProfileInvariant = new Set(Object.values(scienceDigests)).size === 1;
  const cinematicPairwiseDistinct = new Set(Object.values(cinematicDigests)).size === 3;
  const presentationCopiesDisjoint = scienceCopies.every((science) => cinematicCopies.every((cinematic) => science.buffer !== cinematic.buffer));
  if (!sourceProductByteIdentical || !scienceProfileInvariant || !cinematicPairwiseDistinct || !presentationCopiesDisjoint) throw new Error("v341-profile-isolation");
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVATION_PROFILE_AUDIT_VERSION_V341,
    status: "qualified-science-profile-invariant-cinematic-copy-isolated",
    profiles: Object.freeze([...profiles]) as KerrScienceObservationProfileAuditV341["profiles"],
    measurementCount: 12,
    scienceDigest: scienceDigests.v5,
    scienceDigests: Object.freeze(scienceDigests),
    cinematicDigests: Object.freeze(cinematicDigests),
    scienceProfileInvariant: true,
    scienceDeterministic: true,
    cinematicDeterministic: true,
    cinematicPairwiseDistinct: true,
    sourceProductByteIdentical: true,
    presentationCopiesDisjoint: true,
    cinematicPhysicalMeasurementFieldsExcluded: true,
    boundary: "v5-v6-v7-presentation-copies-cannot-mutate-or-encode-back-into-science-product",
  });
}
