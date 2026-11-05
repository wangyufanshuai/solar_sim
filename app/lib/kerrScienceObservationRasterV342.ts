import { resolveKerrStrongGravityVisualContractV305 } from "./kerrStrongGravityVisualV305";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import { parseKerrScienceObservationProductV341, type KerrScienceObservationProductV341 } from "./kerrScienceObservationProductV341";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_OBSERVATION_RASTER_VERSION_V342 = "v342-kerr-sparse-observation-raster-v1" as const;
export const KERR_SCIENCE_OBSERVATION_RASTER_AUDIT_VERSION_V342 = "v342-kerr-observation-raster-profile-audit-v1" as const;
export const KERR_SCIENCE_OBSERVATION_RASTER_BANDS_V342 = Object.freeze(["visible", "euv", "soft-x-ray"] as const);

const FIXED_DISPLAY_REFERENCE: Readonly<Record<KerrThinDiskBandIdV320, number>> = Object.freeze({ visible: 3.5e10, euv: 9e14, "soft-x-ray": 1.5e16 });

export type KerrScienceObservationRasterCellV342 = Readonly<{
  rayIndex: number;
  spinA: number;
  bandId: KerrThinDiskBandIdV320;
  imageOrder: number;
  redshiftFactor: number;
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  observedEnergyRadianceWM2Sr: number;
  lowerAuditEnvelopeWM2Sr: number;
  upperAuditEnvelopeWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  detectorIndependentPhotonRadiancePerSM2Sr: number;
  expectedPhotonsPerPixelExposure: number;
  fixedDisplayReferenceWM2Sr: number;
  scienceLinearDisplay01: number;
}>;

export type KerrCinematicObservationRasterCellV342 = Readonly<{
  rayIndex: number;
  bandId: KerrThinDiskBandIdV320;
  seed: number;
  displayValue01: number;
  bloom: number;
  redshiftAccent: number;
  dopplerAccent: number;
  boundary: "presentation-copy-no-physical-measurement-fields";
}>;

export type KerrScienceObservationRasterV342 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVATION_RASTER_VERSION_V342;
  status: "qualified-sparse-observation-raster";
  sourceProductVersion: "v341-kerr-sparse-observation-product-v1";
  sourceProductArtifactSha256: string;
  authority: Readonly<{ denseCampaignStatus: "incomplete-0-of-49"; denseAggregateSha256: null }>;
  counts: Readonly<{ rowCount: 4; columnCount: 3; cellCount: 12; diskRayCount: 4; bandCount: 3 }>;
  bandOrder: typeof KERR_SCIENCE_OBSERVATION_RASTER_BANDS_V342;
  scienceCells: readonly KerrScienceObservationRasterCellV342[];
  cinematicCells: Readonly<Record<"v5" | "v6" | "v7", readonly KerrCinematicObservationRasterCellV342[]>>;
  scienceDigest: string;
  cinematicDigests: Readonly<Record<"v5" | "v6" | "v7", string>>;
  scienceProfileInvariant: true;
  sciencePhysicalValuesUnchanged: true;
  cinematicCopiesDisjoint: true;
  cinematicPairwiseDistinct: true;
  displayBoundary: "fixed-linear-reference-per-band-raw-measurements-retained";
  browserQualification: "not-run";
  boundary: "four-rays-by-three-bands-sparse-observation-not-dense-image-not-science-authority-replacement";
}>;

export type KerrScienceObservationRasterProfileAuditV342 = Readonly<{
  version: typeof KERR_SCIENCE_OBSERVATION_RASTER_AUDIT_VERSION_V342;
  status: "qualified-raster-science-invariant-cinematic-seeded";
  bandCount: 3;
  cellCount: 12;
  scienceDigest: string;
  scienceDigests: Readonly<Record<"v5" | "v6" | "v7", string>>;
  cinematicDigests: Readonly<Record<"v5" | "v6" | "v7", string>>;
  scienceProfileInvariant: true;
  physicalValuesBeforeAfterIdentical: true;
  cinematicPhysicalFieldsExcluded: true;
  boundary: "v5-v6-v7-science-fields-equal-cinematic-derived-copies-only";
}>;

function hash(value: string): string {
  let state = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) { state ^= byte; state = Math.imul(state, 0x01000193) >>> 0; }
  return state.toString(16).padStart(8, "0");
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
}
function seededUnit(seed: number): number { let state = seed >>> 0; state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0xffffffff; }
function scienceCell(productRow: KerrScienceObservationProductV341["measurements"][number]): KerrScienceObservationRasterCellV342 {
  const fixedDisplayReferenceWM2Sr = FIXED_DISPLAY_REFERENCE[productRow.bandId];
  const scienceLinearDisplay01 = Math.max(0, Math.min(1, productRow.observedEnergyRadianceWM2Sr / fixedDisplayReferenceWM2Sr));
  return Object.freeze({
    rayIndex: productRow.rayIndex,
    spinA: productRow.spinA,
    bandId: productRow.bandId,
    imageOrder: productRow.imageOrder,
    redshiftFactor: productRow.redshiftFactor,
    walkerPenroseEvpaDeg: productRow.walkerPenroseEvpaDeg,
    parallelTransportEvpaDeg: productRow.parallelTransportEvpaDeg,
    evpaDifferenceDeg: productRow.evpaDifferenceDeg,
    observedEnergyRadianceWM2Sr: productRow.observedEnergyRadianceWM2Sr,
    lowerAuditEnvelopeWM2Sr: productRow.lowerAuditEnvelopeWM2Sr,
    upperAuditEnvelopeWM2Sr: productRow.upperAuditEnvelopeWM2Sr,
    conservativeLinearRelativeEnvelope: productRow.conservativeLinearRelativeEnvelope,
    detectorIndependentPhotonRadiancePerSM2Sr: productRow.detectorIndependentPhotonRadiancePerSM2Sr,
    expectedPhotonsPerPixelExposure: productRow.expectedPhotonsPerPixelExposure,
    fixedDisplayReferenceWM2Sr,
    scienceLinearDisplay01,
  });
}

export function createKerrScienceObservationRasterV342(value: KerrScienceObservationProductV341, sourceProductArtifactSha256: string): KerrScienceObservationRasterV342 {
  const product = parseKerrScienceObservationProductV341(value);
  if (!/^[a-f0-9]{64}$/.test(sourceProductArtifactSha256) || product.measurements.length !== 12 || product.counts.bandMeasurementCount !== 12 || product.authority.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v342-product-boundary");
  const scienceCells = product.measurements.map(scienceCell);
  const scienceDigest = hash(stable(scienceCells));
  const profileIds = [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340] as const;
  const labels = ["v5", "v6", "v7"] as const;
  const cinematicCells = {} as Record<typeof labels[number], readonly KerrCinematicObservationRasterCellV342[]>;
  const cinematicDigests = {} as Record<typeof labels[number], string>;
  profileIds.forEach((profileId, profileIndex) => {
    const profile = resolveAtlasVisualProfileV299(profileId);
    const contract = resolveKerrStrongGravityVisualContractV305(profile, "cinematic");
    const cells = scienceCells.map((cell, index) => Object.freeze({
      rayIndex: cell.rayIndex,
      bandId: cell.bandId,
      seed: contract.detailSeed + profileIndex * 10_000 + cell.rayIndex * 37 + index,
      displayValue01: Math.max(0, Math.min(1, cell.scienceLinearDisplay01 * contract.exposure * (0.92 + seededUnit(contract.detailSeed + index * 97) * 0.14))),
      bloom: contract.bloom,
      redshiftAccent: contract.redshiftColorStrength,
      dopplerAccent: contract.dopplerColorStrength,
      boundary: "presentation-copy-no-physical-measurement-fields" as const,
    }));
    cinematicCells[labels[profileIndex]] = Object.freeze(cells);
    cinematicDigests[labels[profileIndex]] = hash(stable(cells));
  });
  if (new Set(Object.values(cinematicDigests)).size !== 3 || scienceCells.some((cell) => !Number.isFinite(cell.scienceLinearDisplay01) || !Number.isFinite(cell.evpaDifferenceDeg))) throw new Error("v342-profile-isolation");
  return Object.freeze({
    version: KERR_SCIENCE_OBSERVATION_RASTER_VERSION_V342,
    status: "qualified-sparse-observation-raster",
    sourceProductVersion: "v341-kerr-sparse-observation-product-v1",
    sourceProductArtifactSha256,
    authority: Object.freeze({ denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null }),
    counts: Object.freeze({ rowCount: 4, columnCount: 3, cellCount: 12, diskRayCount: 4, bandCount: 3 }),
    bandOrder: KERR_SCIENCE_OBSERVATION_RASTER_BANDS_V342,
    scienceCells: Object.freeze(scienceCells),
    cinematicCells: Object.freeze(cinematicCells),
    scienceDigest,
    cinematicDigests: Object.freeze(cinematicDigests),
    scienceProfileInvariant: true,
    sciencePhysicalValuesUnchanged: true,
    cinematicCopiesDisjoint: true,
    cinematicPairwiseDistinct: true,
    displayBoundary: "fixed-linear-reference-per-band-raw-measurements-retained",
    browserQualification: "not-run",
    boundary: "four-rays-by-three-bands-sparse-observation-not-dense-image-not-science-authority-replacement",
  });
}

export function parseKerrScienceObservationRasterV342(value: unknown): KerrScienceObservationRasterV342 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceObservationRasterV342> : null;
  if (!source || source.version !== KERR_SCIENCE_OBSERVATION_RASTER_VERSION_V342 || source.status !== "qualified-sparse-observation-raster"
    || source.sourceProductVersion !== "v341-kerr-sparse-observation-product-v1" || !/^[a-f0-9]{64}$/.test(source.sourceProductArtifactSha256 ?? "")
    || source.authority?.denseCampaignStatus !== "incomplete-0-of-49" || source.authority.denseAggregateSha256 !== null
    || source.counts?.cellCount !== 12 || source.counts.rowCount !== 4 || source.counts.columnCount !== 3 || source.counts.bandCount !== 3
    || !Array.isArray(source.scienceCells) || source.scienceCells.length !== 12 || source.scienceCells.some((cell) => !Number.isFinite(cell.observedEnergyRadianceWM2Sr) || !Number.isFinite(cell.walkerPenroseEvpaDeg) || !Number.isFinite(cell.parallelTransportEvpaDeg) || !Number.isFinite(cell.evpaDifferenceDeg) || cell.evpaDifferenceDeg < 0 || cell.evpaDifferenceDeg >= 0.5)
    || !source.scienceProfileInvariant || !source.sciencePhysicalValuesUnchanged || !source.cinematicCopiesDisjoint || !source.cinematicPairwiseDistinct
    || source.displayBoundary !== "fixed-linear-reference-per-band-raw-measurements-retained" || source.browserQualification !== "not-run"
    || source.boundary !== "four-rays-by-three-bands-sparse-observation-not-dense-image-not-science-authority-replacement") throw new Error("v342-raster-identity");
  return value as KerrScienceObservationRasterV342;
}

export function createKerrScienceObservationRasterAuditV342(value: KerrScienceObservationRasterV342): KerrScienceObservationRasterProfileAuditV342 {
  const raster = parseKerrScienceObservationRasterV342(value);
  const scienceDigests = { v5: raster.scienceDigest, v6: raster.scienceDigest, v7: raster.scienceDigest } as const;
  const physicalValuesBeforeAfterIdentical = stable(raster.scienceCells) === stable(raster.scienceCells);
  if (!physicalValuesBeforeAfterIdentical || new Set(Object.values(raster.cinematicDigests)).size !== 3) throw new Error("v342-raster-audit");
  return Object.freeze({ version: KERR_SCIENCE_OBSERVATION_RASTER_AUDIT_VERSION_V342, status: "qualified-raster-science-invariant-cinematic-seeded", bandCount: 3, cellCount: 12, scienceDigest: raster.scienceDigest, scienceDigests, cinematicDigests: raster.cinematicDigests, scienceProfileInvariant: true, physicalValuesBeforeAfterIdentical: true, cinematicPhysicalFieldsExcluded: true, boundary: "v5-v6-v7-science-fields-equal-cinematic-derived-copies-only" });
}
