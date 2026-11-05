/**
 * Local planet texture layout under `public/textures/planets/`.
 *
 * The default fetch script writes `{id}.jpg` for the nine primary bodies:
 * mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune.
 */

import {
  planetAlbedoBasePath,
  planetAlbedoUrlIfExists,
} from "../lib/planetAlbedoUrl";

export type PlanetTextureManifestEntry = {
  albedo?: string;
  normal?: string;
  clouds?: string;
  cloudAlpha?: string;
  night?: string;
  nightMask?: string;
  ringColorMap?: string;
  ringAlphaMap?: string;
  roughness?: string;
  bandMask?: string;
};

const HD_BASE = "/textures/planets/hd";
const V49_BASE = "/textures/planets/v49";
const HD_ALBEDO_IDS = new Set([
  "sun",
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
]);

export function hasHdTextureForBodyId(id: string): boolean {
  return HD_ALBEDO_IDS.has(id);
}

const FETCHED_2K_ALBEDO_FILE: Record<string, string> = {
  mercury: "mercury.jpg",
  venus: "venus.jpg",
  earth: "earth.jpg",
  mars: "mars.jpg",
  jupiter: "jupiter.jpg",
  saturn: "saturn.jpg",
  uranus: "uranus.jpg",
  neptune: "neptune.jpg",
};

function preferredAlbedoUrl(id: string): string | undefined {
  const base = planetAlbedoBasePath();
  const file = FETCHED_2K_ALBEDO_FILE[id];
  if (file) return `${base}/${file}`;
  return planetAlbedoUrlIfExists(id);
}

/** Single source for diffuse URL used in ephemeris body defs. */
export function planetDiffuseUrlForBody(id: string): string | undefined {
  return preferredAlbedoUrl(id);
}

export function textureManifestEntryForBodyId(
  id: string,
): PlanetTextureManifestEntry {
  const out: PlanetTextureManifestEntry = {};
  const albedo = preferredAlbedoUrl(id);
  if (albedo) out.albedo = albedo;
  return out;
}

export function hdTextureManifestEntryForBodyId(
  id: string,
): PlanetTextureManifestEntry {
  if (!HD_ALBEDO_IDS.has(id)) return {};
  const out: PlanetTextureManifestEntry = {
    albedo: `${HD_BASE}/${id}.jpg`,
  };
  if (id === "earth") {
    out.clouds = `${HD_BASE}/earth-clouds.jpg`;
    out.night = `${HD_BASE}/earth-night.jpg`;
  }
  return out;
}

const V49_ALBEDO_IDS = new Set(["earth", "moon", "mars", "jupiter", "saturn", "sun"]);

export function v49TextureManifestEntryForBodyId(
  id: string,
): PlanetTextureManifestEntry {
  if (!V49_ALBEDO_IDS.has(id)) return {};
  const out: PlanetTextureManifestEntry = {
    albedo: `${V49_BASE}/${id}-albedo.jpg`,
    roughness: `${V49_BASE}/${id}-roughness.jpg`,
  };
  if (id === "earth") {
    out.clouds = `${V49_BASE}/earth-clouds.jpg`;
    out.cloudAlpha = `${V49_BASE}/earth-cloud-alpha.jpg`;
    out.night = `${V49_BASE}/earth-night.jpg`;
    out.nightMask = `${V49_BASE}/earth-night-mask.jpg`;
  }
  if (id === "jupiter" || id === "saturn") {
    out.bandMask = `${V49_BASE}/${id}-band-mask.jpg`;
  }
  if (id === "saturn") {
    out.ringColorMap = `${V49_BASE}/saturn-ring-color.jpg`;
    out.ringAlphaMap = `${V49_BASE}/saturn-ring-alpha.jpg`;
  }
  return out;
}
