import { MAINLINE_A1_CONSTELLATIONS, MAINLINE_A1_STARS, MAINLINE_A3_NEBULAE, MAINLINE_A_CURRENT_CONSTELLATIONS, MAINLINE_A_CURRENT_STARS } from "./mainlineAMetadataV607";
import type { CelestialObjectContractV607 } from "../lib/celestialObjectContractV607";

/** Stable read-only handoff for A2-A6 consumers. */
export const MAINLINE_A1_OBJECTS: readonly CelestialObjectContractV607[] = Object.freeze([
  ...MAINLINE_A1_CONSTELLATIONS,
  ...MAINLINE_A3_NEBULAE,
  ...MAINLINE_A1_STARS,
]);

/** Additive current roster (A1 first-set remains frozen at 22 objects). */
export const MAINLINE_A_CURRENT_OBJECTS: readonly CelestialObjectContractV607[] = Object.freeze([
  ...MAINLINE_A_CURRENT_CONSTELLATIONS,
  ...MAINLINE_A3_NEBULAE,
  ...MAINLINE_A_CURRENT_STARS,
]);

export function getMainlineA1Object(id: string): CelestialObjectContractV607 | undefined {
  return MAINLINE_A_CURRENT_OBJECTS.find((object) => object.id === id);
}

/** Use the existing navigation identity, including system/component aliases. */
export function getMainlineA1CatalogId(id: string): string | undefined {
  const object = getMainlineA1Object(id);
  if (!object) return undefined;
  if (id === "sirius-a") return "nearby-star:sirius";
  if (id === "alpha-centauri-a") return "nearby-star:alpha-centauri";
  if (id === "capella-a") return "nearby-star:capella";
  if (id === "procyon-a") return "nearby-star:procyon";
  return `${object.kind === "star" ? "nearby-star" : object.kind}:${object.id}`;
}

const MAINLINE_A_NEARBY_STAR_ALIASES: Readonly<Record<string, string>> = {
  sirius: "sirius-a",
  "alpha-centauri": "alpha-centauri-a",
  capella: "capella-a",
  procyon: "procyon-a",
};

/** Resolves presentation-only roster identities to their catalog passport identity. */
export function resolveMainlineAPassportCatalogId(id: string): string {
  if (!id.startsWith("stellar-hero:")) return id;
  const heroId = id.slice("stellar-hero:".length);
  return getMainlineA1CatalogId(heroId) ?? id;
}

/** Bridges the existing catalog selection IDs (kind:id) to the A1 contract. */
export function getMainlineA1ObjectByCatalogId(catalogId: string): CelestialObjectContractV607 | undefined {
  const separator = catalogId.indexOf(":");
  if (separator < 0) return getMainlineA1Object(catalogId);
  const kind = catalogId.slice(0, separator);
  if (!["constellation", "nebula", "star", "bright-star", "nearby-star"].includes(kind)) return undefined;
  const catalogObjectId = catalogId.slice(separator + 1);
  const id = kind === "nearby-star" ? (MAINLINE_A_NEARBY_STAR_ALIASES[catalogObjectId] ?? catalogObjectId) : catalogObjectId;
  const object = getMainlineA1Object(id);
  if (!object) return undefined;
  if (kind === "constellation" && object.kind !== "constellation") return undefined;
  if (kind === "nebula" && object.kind !== "nebula") return undefined;
  if ((kind === "star" || kind === "bright-star" || kind === "nearby-star") && object.kind !== "star") return undefined;
  return object;
}
