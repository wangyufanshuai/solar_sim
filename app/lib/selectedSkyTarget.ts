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
import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "./stellarHeroesV592";
import { getStellarProvenanceHeroV1 } from "./stellarProvenanceCandidate";

const GAIA_PREFIX = "gaia-dr3:";
const STELLAR_HERO_PREFIX = "stellar-hero:";

function stellarHeroDirection(hero: { raDeg: number; decDeg: number }): [number, number, number] {
  const ra = (hero.raDeg * Math.PI) / 180;
  const dec = (hero.decDeg * Math.PI) / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)];
}

export function selectedSkyTargetDescriptor(
  selectedCatalogId: string,
  gaiaIndex: readonly GaiaIndexedStar[],
): SkyTargetFocusDescriptor | null {
  if (!selectedCatalogId) return null;
  const heroId = selectedCatalogId.startsWith(STELLAR_HERO_PREFIX)
    ? selectedCatalogId.slice(STELLAR_HERO_PREFIX.length) as StellarHeroIdV592
    : selectedCatalogId as StellarHeroIdV592;
  const hero = STELLAR_HERO_BY_ID_V592[heroId];
  if (hero && (selectedCatalogId === heroId || selectedCatalogId === `${STELLAR_HERO_PREFIX}${heroId}`)) {
    const provenance = getStellarProvenanceHeroV1(heroId);
    return {
      targetType: "stellar-hero",
      heroId,
      id: `${STELLAR_HERO_PREFIX}${heroId}`,
      label: hero.name,
      kind: "catalog",
      source: "v592 named-star presentation catalog",
      direction: stellarHeroDirection(hero),
      colorBpRp: hero.colorBpRp,
      mag: hero.apparentMagnitudeV,
      parallaxMas: hero.parallaxMas,
      teffK: hero.temperatureK,
      radiusSolar: hero.radiusSolar,
      luminositySolar: hero.luminositySolar,
      dataTier: "catalog-basic",
      spectralType: hero.spectralType,
      variability: {
        knownState: "unknown",
        value: null,
        authority: provenance.fields.variability.authority,
      },
    };
  }
  const sourceId = selectedCatalogId.startsWith(GAIA_PREFIX)
    ? selectedCatalogId.slice(GAIA_PREFIX.length)
    : null;
  const indexed = gaiaIndex.find((entry) =>
    entry.id === selectedCatalogId || (sourceId !== null && entry.sourceId === sourceId),
  );
  if (indexed) {
    const isGaia = /^\d{10,22}$/.test(indexed.sourceId);
    return {
      targetType: "gaia-stellar",
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
      variability: typeof indexed.stellarParameters?.variable === "boolean"
        ? {
            knownState: "known",
            value: indexed.stellarParameters.variable,
            authority: "offline-stellar-parameter",
          }
        : {
            knownState: "unknown",
            value: null,
            authority: "unknown",
          },
      spectralType: indexed.stellarParameters?.spectralType,
    };
  }
  const entry = selectCelestialCatalogEntry(selectedCatalogId);
  if (!entry) return null;
  const direction = celestialEntryToDirection(entry);
  if (!direction) return null;
  if (entry.kind === "nearby-star" || entry.kind === "bright-star") {
    return {
      targetType: "catalog-stellar",
      catalogObjectKind: entry.kind,
      id: entry.id,
      label: celestialDisplayNameZh(entry),
      kind: "catalog",
      source: celestialKindLabelZh(entry.kind),
      direction,
      color: entry.color,
      mag: entry.magV,
      parallaxMas: entry.distancePc ? 1000 / entry.distancePc : null,
      dataTier: "catalog-basic",
      spectralType: entry.kind === "nearby-star" ? entry.catalogName : null,
      variability: {
        knownState: "unknown",
        value: null,
        authority: "unknown",
      },
    };
  }
  return {
    targetType: "non-stellar-catalog",
    catalogObjectKind: entry.kind,
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
