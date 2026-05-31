/**
 * Planet diffuse map URL under `public/`.
 *
 * - Default: `/textures/planets/{id}.jpg` (same filenames as `fetch-planet-textures`).
 * - HD / NASA drops: set `NEXT_PUBLIC_PLANET_TEXTURE_BASE=/textures/planets/nasa-hd`
 *   and place `mercury.jpg` … `neptune.jpg`, `moon.jpg` there (any resolution; WebGL will upload full res).
 * - PNG: `NEXT_PUBLIC_PLANET_TEXTURE_EXT=png`
 */

import { solarAssetUrl } from "./runtimeUrls";

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function textureExtension(): string {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PLANET_TEXTURE_EXT?.trim().toLowerCase()
      : undefined;
  if (!raw || raw === "jpg" || raw === "jpeg") return ".jpg";
  return raw.startsWith(".") ? raw : `.${raw}`;
}

export function planetAlbedoBasePath(): string {
  const env =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PLANET_TEXTURE_BASE?.trim()
      : undefined;
  if (env && env !== "") return stripTrailingSlash(env);
  return solarAssetUrl("/textures/planets");
}

/** Public URL for equirectangular albedo (`id` = `sun`, `mercury`, `earth`, …). */
export function planetAlbedoUrl(bodyId: string): string {
  return `${planetAlbedoBasePath()}/${bodyId}${textureExtension()}`;
}

/**
 * IDs that typically have a real file after `npm run fetch-nasa-hd-all` (or SSS 2K pack).
 * Other bodies still render with solid `color` and avoid 404 spam / failed proxy to :8765.
 * Set `NEXT_PUBLIC_PLANET_TEXTURE_TRY_ALL=1` to request a URL for every body (if you added JPGs).
 */
export const KNOWN_PLANET_ALBEDO_IDS: ReadonlySet<string> = new Set([
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
  "pluto",
  "ceres",
  "io",
  "europa",
  "ganymede",
  "callisto",
  "titan",
  "enceladus",
  // Dwarf planets with fictional textures
  "eris",
  "makemake",
  "haumea",
]);

function tryAllPlanetTextures(): boolean {
  const v =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PLANET_TEXTURE_TRY_ALL?.trim().toLowerCase()
      : undefined;
  return v === "1" || v === "true" || v === "yes";
}

/** Same as `planetAlbedoUrl` only when a bundled file is expected; else `undefined` (no network request). */
export function planetAlbedoUrlIfExists(bodyId: string): string | undefined {
  if (tryAllPlanetTextures() || KNOWN_PLANET_ALBEDO_IDS.has(bodyId)) {
    return planetAlbedoUrl(bodyId);
  }
  return undefined;
}
