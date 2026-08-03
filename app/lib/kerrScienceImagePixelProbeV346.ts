export const KERR_SCIENCE_IMAGE_PIXEL_PROBE_VERSION_V346 = "v346-kerr-science-image-pixel-probe-v1" as const;

export type KerrScienceImageBandV346 = "visible" | "euv" | "soft-x-ray";

export type KerrScienceImageProbeCellV346 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  bandId: KerrScienceImageBandV346;
  imageOrder: number;
  redshiftFactor: number;
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  observedEnergyRadianceWM2Sr: number;
  lowerAuditEnvelopeWM2Sr: number;
  upperAuditEnvelopeWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  scienceLinearDisplay01: number;
}>;

export type KerrScienceImagePixelProbeArtifactV346 = Readonly<{
  version: typeof KERR_SCIENCE_IMAGE_PIXEL_PROBE_VERSION_V346;
  generatedAt: string;
  status: "qualified-index-coordinate-probe";
  source: Readonly<{
    rasterPath: "dist/science/kerr-observation-raster-v342/raster.json";
    rasterFileSha256: string;
    rasterArtifactSha256: string;
    imageManifestPath: "dist/science/kerr-observation-images-v343/manifest.json";
    imageManifestSha256: string;
    pngSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  plate: Readonly<{
    width: 1200;
    height: 720;
    grid: Readonly<{ x: 142; y: 108; columnStep: 266; rowStep: 174; cardWidth: 251; cardHeight: 159 }>;
  }>;
  indexCoordinates: Readonly<{
    arrayShape: readonly [3, 4];
    bandOrder: readonly ["visible", "euv", "soft-x-ray"];
    rayOrder: readonly [12, 13, 14, 15];
    fitsAxis1: "ray";
    fitsAxis2: "band";
    fitsPixelsOneBased: true;
    celestialWcsAvailable: false;
    unavailableReason: "sparse-index-grid-has-no-ra-dec-wcs";
  }>;
  cells: readonly KerrScienceImageProbeCellV346[];
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  boundary: "bounded-twelve-cell-index-probe-not-celestial-wcs-not-dense-transfer-map";
  artifactSha256: string;
}>;

export type KerrScienceImageProbeHitV346 = Readonly<{
  key: `${KerrScienceImageBandV346}:${12 | 13 | 14 | 15}`;
  platePixel: readonly [number, number];
  cardBounds: Readonly<{ x: number; y: number; width: 251; height: 159 }>;
  arrayIndex: readonly [number, number];
  fitsPixel: readonly [number, number];
  cell: KerrScienceImageProbeCellV346;
  celestialWcs: "unavailable";
}>;

const SHA = /^[a-f0-9]{64}$/;
const BANDS = ["visible", "euv", "soft-x-ray"] as const;
const RAYS = [12, 13, 14, 15] as const;

function finiteCell(cell: KerrScienceImageProbeCellV346): boolean {
  return [cell.spinA, cell.imageOrder, cell.redshiftFactor, cell.walkerPenroseEvpaDeg,
    cell.parallelTransportEvpaDeg, cell.evpaDifferenceDeg, cell.observedEnergyRadianceWM2Sr,
    cell.lowerAuditEnvelopeWM2Sr, cell.upperAuditEnvelopeWM2Sr,
    cell.conservativeLinearRelativeEnvelope, cell.scienceLinearDisplay01].every(Number.isFinite);
}

export function parseKerrScienceImagePixelProbeArtifactV346(value: unknown): KerrScienceImagePixelProbeArtifactV346 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrScienceImagePixelProbeArtifactV346>
    : null;
  const cells = source?.cells ?? [];
  const identities = new Set(cells.map((cell) => `${cell.bandId}:${cell.rayIndex}`));
  if (!source || source.version !== KERR_SCIENCE_IMAGE_PIXEL_PROBE_VERSION_V346
    || source.status !== "qualified-index-coordinate-probe"
    || source.source?.rasterPath !== "dist/science/kerr-observation-raster-v342/raster.json"
    || source.source.imageManifestPath !== "dist/science/kerr-observation-images-v343/manifest.json"
    || !SHA.test(source.source.rasterFileSha256) || !SHA.test(source.source.rasterArtifactSha256)
    || !SHA.test(source.source.imageManifestSha256) || !SHA.test(source.source.pngSha256)
    || !SHA.test(source.source.fullShortAuthoritySha256)
    || source.plate?.width !== 1200 || source.plate.height !== 720
    || source.plate.grid.x !== 142 || source.plate.grid.y !== 108
    || source.plate.grid.columnStep !== 266 || source.plate.grid.rowStep !== 174
    || source.plate.grid.cardWidth !== 251 || source.plate.grid.cardHeight !== 159
    || source.indexCoordinates?.arrayShape.join(",") !== "3,4"
    || source.indexCoordinates.bandOrder.join(",") !== BANDS.join(",")
    || source.indexCoordinates.rayOrder.join(",") !== RAYS.join(",")
    || source.indexCoordinates.fitsAxis1 !== "ray" || source.indexCoordinates.fitsAxis2 !== "band"
    || source.indexCoordinates.fitsPixelsOneBased !== true
    || source.indexCoordinates.celestialWcsAvailable !== false
    || source.indexCoordinates.unavailableReason !== "sparse-index-grid-has-no-ra-dec-wcs"
    || cells.length !== 12 || identities.size !== 12
    || cells.some((cell) => !BANDS.includes(cell.bandId) || !RAYS.includes(cell.rayIndex) || !finiteCell(cell)
      || cell.lowerAuditEnvelopeWM2Sr > cell.observedEnergyRadianceWM2Sr
      || cell.observedEnergyRadianceWM2Sr > cell.upperAuditEnvelopeWM2Sr
      || cell.scienceLinearDisplay01 < 0 || cell.scienceLinearDisplay01 > 1)
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null
    || source.browserQualification !== "not-run"
    || source.boundary !== "bounded-twelve-cell-index-probe-not-celestial-wcs-not-dense-transfer-map"
    || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v346-pixel-probe-artifact-identity");
  return value as KerrScienceImagePixelProbeArtifactV346;
}

export function projectClientPointToKerrSciencePlateV346(
  point: Readonly<{ clientX: number; clientY: number }>,
  rect: Readonly<{ left: number; top: number; width: number; height: number }>,
): readonly [number, number] | null {
  if (![point.clientX, point.clientY, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
    || rect.width <= 0 || rect.height <= 0 || point.clientX < rect.left || point.clientY < rect.top
    || point.clientX > rect.left + rect.width || point.clientY > rect.top + rect.height) return null;
  return [((point.clientX - rect.left) / rect.width) * 1200, ((point.clientY - rect.top) / rect.height) * 720];
}

export function probeKerrScienceImagePixelV346(
  artifact: KerrScienceImagePixelProbeArtifactV346,
  plateX: number,
  plateY: number,
): KerrScienceImageProbeHitV346 | null {
  if (!Number.isFinite(plateX) || !Number.isFinite(plateY) || plateX < 0 || plateY < 0
    || plateX > artifact.plate.width || plateY > artifact.plate.height) return null;
  const grid = artifact.plate.grid;
  for (let row = 0; row < BANDS.length; row += 1) {
    const y = grid.y + row * grid.rowStep;
    if (plateY < y || plateY > y + grid.cardHeight - 1) continue;
    for (let column = 0; column < RAYS.length; column += 1) {
      const x = grid.x + column * grid.columnStep;
      if (plateX < x || plateX > x + grid.cardWidth - 1) continue;
      const band = BANDS[row]; const ray = RAYS[column];
      const cell = artifact.cells.find((entry) => entry.bandId === band && entry.rayIndex === ray);
      if (!cell) throw new Error("v346-pixel-probe-cell-missing");
      return Object.freeze({ key: `${band}:${ray}`, platePixel: [plateX, plateY] as const, cardBounds: { x, y, width: 251 as const, height: 159 as const }, arrayIndex: [row, column] as const, fitsPixel: [column + 1, row + 1] as const, cell, celestialWcs: "unavailable" as const });
    }
  }
  return null;
}
