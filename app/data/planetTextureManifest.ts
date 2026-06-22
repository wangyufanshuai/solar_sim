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
  night?: string;
  ringColorMap?: string;
  ringAlphaMap?: string;
};

const FETCHED_2K_ALBEDO_FILE: Record<string, string> = {
  mercury: "mercury.jpg",
  venus: "venus.jpg",
  earth: "earth.jpg",
  moon: "moon.jpg",
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
