import {
  gaiaOverlaySelectionScore,
  gaiaStarToGalacticPc,
  type GaiaStarRecord,
} from "../data/gaiaStarCatalog";

export const GAIA_SKY_SECTOR_COLUMNS = 48;
export const GAIA_SKY_SECTOR_ROWS = 24;
export const GAIA_SKY_SECTOR_COUNT = GAIA_SKY_SECTOR_COLUMNS * GAIA_SKY_SECTOR_ROWS;

export type GaiaStarfieldSectorIndex = {
  stars: readonly GaiaStarRecord[];
  bins: readonly (readonly number[])[];
  centroids: readonly (readonly [number, number, number])[];
  rankedIndices: readonly number[];
  sourceIdToIndex: ReadonlyMap<string, number>;
};

function sectorForStar(star: GaiaStarRecord): number {
  const ra = ((star.raDeg % 360) + 360) % 360;
  const dec = Math.max(-90, Math.min(90, star.decDeg));
  return Math.min(GAIA_SKY_SECTOR_COLUMNS - 1, Math.floor(ra / (360 / GAIA_SKY_SECTOR_COLUMNS))) +
    Math.min(GAIA_SKY_SECTOR_ROWS - 1, Math.floor((dec + 90) / (180 / GAIA_SKY_SECTOR_ROWS))) *
      GAIA_SKY_SECTOR_COLUMNS;
}

function starDirection(star: GaiaStarRecord): [number, number, number] {
  const [x, y, z] = gaiaStarToGalacticPc(star);
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

export function buildGaiaStarfieldSectorIndex(
  stars: readonly GaiaStarRecord[],
): GaiaStarfieldSectorIndex {
  const bins = Array.from({ length: GAIA_SKY_SECTOR_COUNT }, () => [] as number[]);
  const centroidSums = Array.from({ length: GAIA_SKY_SECTOR_COUNT }, () => [0, 0, 0]);
  const sourceIdToIndex = new Map<string, number>();

  stars.forEach((star, index) => {
    sourceIdToIndex.set(star.sourceId, index);
    const sector = sectorForStar(star);
    bins[sector]!.push(index);
    const [x, y, z] = starDirection(star);
    centroidSums[sector]![0] += x;
    centroidSums[sector]![1] += y;
    centroidSums[sector]![2] += z;
  });

  const scores = stars.map((star, index) => gaiaOverlaySelectionScore(star, index));
  const rankedIndices = stars
    .map((_, index) => ({ index, score: scores[index]! }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ index }) => index);

  const centroids = centroidSums.map(([x, y, z]) => {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length] as [number, number, number];
  });
  bins.forEach((bin) => {
    bin.sort((a, b) => {
      const scoreDelta = scores[b]! - scores[a]!;
      return scoreDelta || a - b;
    });
  });

  return { stars, bins, centroids, rankedIndices, sourceIdToIndex };
}

export function selectGaiaStarfieldSectorIndices(
  index: GaiaStarfieldSectorIndex,
  cameraDirection: readonly [number, number, number],
  maxInstances: number,
  selectedSourceId = "",
): number[] {
  if (maxInstances <= 0 || index.stars.length === 0) return [];
  const [cx, cy, cz] = cameraDirection;
  const sectors = index.centroids
    .map((centroid, sector) => ({
      sector,
      dot: centroid[0] * cx + centroid[1] * cy + centroid[2] * cz,
    }))
    .sort((a, b) => b.dot - a.dot || a.sector - b.sector);
  const selected = new Set<number>();
  const selectedIndex = selectedSourceId ? index.sourceIdToIndex.get(selectedSourceId) : undefined;
  if (selectedIndex != null) selected.add(selectedIndex);

  for (const { sector } of sectors) {
    for (const starIndex of index.bins[sector] ?? []) {
      selected.add(starIndex);
      if (selected.size >= maxInstances) return [...selected];
    }
  }
  for (const starIndex of index.rankedIndices) {
    selected.add(starIndex);
    if (selected.size >= maxInstances) break;
  }
  return [...selected];
}
