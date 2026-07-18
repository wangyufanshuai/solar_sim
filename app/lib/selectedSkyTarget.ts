import {
  celestialDisplayNameZh,
  celestialEntryToDirection,
  celestialKindLabelZh,
  selectCelestialCatalogEntry,
} from "./celestialCatalog";
import {
  gaiaIndexedStarToDirection,
  type GaiaIndexedStar,
} from "./gaiaCatalogIndex";
import type { SkyTargetFocusDescriptor } from "./skyTargetFocus";

const GAIA_PREFIX = "gaia-dr3:";

export function selectedSkyTargetDescriptor(
  selectedCatalogId: string,
  gaiaIndex: readonly GaiaIndexedStar[],
): SkyTargetFocusDescriptor | null {
  if (!selectedCatalogId) return null;
  const sourceId = selectedCatalogId.startsWith(GAIA_PREFIX)
    ? selectedCatalogId.slice(GAIA_PREFIX.length)
    : null;
  const indexed = gaiaIndex.find((entry) =>
    entry.id === selectedCatalogId || (sourceId !== null && entry.sourceId === sourceId),
  );
  if (indexed) {
    const isGaia = /^\d{10,22}$/.test(indexed.sourceId);
    return {
      id: indexed.id,
      label: indexed.shortLabel,
      kind: "gaia",
      source: isGaia ? "Gaia DR3" : indexed.sourceId.startsWith("hyg:") ? "HYG" : "Offline stellar catalog",
      direction: gaiaIndexedStarToDirection(indexed),
      colorBpRp: indexed.star.colorBpRp,
      mag: indexed.star.magG,
      parallaxMas: indexed.star.parallaxMas,
      teffK: indexed.stellarParameters?.teffK,
      teffLowerK: indexed.stellarParameters?.teffLowerK,
      teffUpperK: indexed.stellarParameters?.teffUpperK,
      logg: indexed.stellarParameters?.logg,
      radiusSolar: indexed.stellarParameters?.radiusSolar,
      metallicityDex: indexed.stellarParameters?.metallicityDex,
      luminositySolar: indexed.stellarParameters?.luminositySolar,
      dataTier: indexed.stellarParameters?.dataTier,
      variable: indexed.stellarParameters?.variable,
      spectralType: indexed.stellarParameters?.spectralType,
    };
  }
  const entry = selectCelestialCatalogEntry(selectedCatalogId);
  if (!entry) return null;
  const direction = celestialEntryToDirection(entry);
  if (!direction) return null;
  return {
    id: entry.id,
    label: celestialDisplayNameZh(entry),
    kind: "catalog",
    source: celestialKindLabelZh(entry.kind),
    direction,
    color: entry.color,
    mag: entry.magV,
    parallaxMas: entry.distancePc ? 1000 / entry.distancePc : null,
  };
}
