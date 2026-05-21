/**
 * Local planet / sun texture layout under `public/textures/planets/`
 * (matches on-disk SSS-style names: `8k_earth_daymap.jpg`, `8k_earth_clouds.jpg`, etc.).
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

/**
 * Filenames under `planetAlbedoBasePath()` verified against repo `public/textures/planets/`.
 * Keys not listed fall back to `planetAlbedoUrlIfExists(id)` (`{id}.jpg`).
 */
const PREFERRED_ALBEDO_FILE: Record<string, string> = {
  sun: "sun.jpg",
  mercury: "8k_mercury.jpg",
  venus: "8k_venus_surface.jpg",
  earth: "8k_earth_daymap.jpg",
  moon: "8k_moon.jpg",
  mars: "8k_mars.jpg",
  jupiter: "8k_jupiter.jpg",
  saturn: "8k_saturn.jpg",
  uranus: "2k_uranus.jpg",
  neptune: "2k_neptune.jpg",
  pluto: "nasa-hd/pluto.jpg",
  ceres: "nasa-hd/ceres.jpg",
  io: "nasa-hd/io.jpg",
  europa: "nasa-hd/europa.jpg",
  ganymede: "nasa-hd/ganymede.jpg",
  callisto: "nasa-hd/callisto.jpg",
  titan: "nasa-hd/titan.jpg",
  enceladus: "nasa-hd/enceladus.jpg",
  eris: "4k_eris_fictional.jpg",
  makemake: "4k_makemake_fictional.jpg",
  haumea: "4k_haumea_fictional.jpg",
};

function preferredAlbedoUrl(id: string): string | undefined {
  const base = planetAlbedoBasePath();
  const file = PREFERRED_ALBEDO_FILE[id];
  if (file) return `${base}/${file}`;
  return planetAlbedoUrlIfExists(id);
}

/** Single source for diffuse URL used in ephemeris body defs. */
export function planetDiffuseUrlForBody(id: string): string | undefined {
  return preferredAlbedoUrl(id);
}

export function textureManifestEntryForBodyId(id: string): PlanetTextureManifestEntry {
  const base = planetAlbedoBasePath();
  const out: PlanetTextureManifestEntry = {};
  const albedo = preferredAlbedoUrl(id);
  if (albedo) out.albedo = albedo;

  if (id === "earth") {
    out.clouds = `${base}/8k_earth_clouds.jpg`;
    out.night = `${base}/8k_earth_nightmap.jpg`;
  }
  /* Ring texture filenames not present in current pack — omit to avoid failed loads. */
  return out;
}
