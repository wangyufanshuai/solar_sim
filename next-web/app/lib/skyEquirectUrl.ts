/**
 * Equirect sky URLs under `public/textures/sky/` (see README).
 * `NEXT_PUBLIC_SKY_EQUIRECT_URL` forces a single URL; otherwise candidates are tried in order.
 */

import { solarAssetUrl } from "./runtimeUrls";
/** On disk: `public/textures/sky/nasa_milkyway_2020_4k_balanced.jpg` (strict 2:1 NASA SVS sky). */
export const LOCAL_NASA_MILKY_WAY_SKY_PATH =
  "/textures/sky/nasa_milkyway_2020_4k_balanced.jpg" as const;

/** Legacy local file. Kept as a manual fallback only; it is not strict 2:1 in this workspace. */
export const LOCAL_MILKY_WAY_SKY_PATH =
  "/textures/sky/milky-way-equirect.jpg" as const;

/** On disk: `public/textures/sky/eso0932a.png`. Run `npm run fetch-sky-eso` if missing. */
export const LOCAL_ESO_SKY_PATH = "/textures/sky/eso0932a.png" as const;

const DEFAULT_CANDIDATES = [
  LOCAL_NASA_MILKY_WAY_SKY_PATH,
  LOCAL_ESO_SKY_PATH,
] as const;

/** First candidate (documentation / single-URL helpers). */
export function primarySkyEquirectUrl(): string {
  const urls = skyEquirectCandidateUrls();
  return urls[0] ?? DEFAULT_CANDIDATES[0]!;
}

/** Ordered list to try until one loads. */
export function skyEquirectCandidateUrls(): readonly string[] {
  const env =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SKY_EQUIRECT_URL?.trim()
      : undefined;
  if (env) return [env];
  return DEFAULT_CANDIDATES.map((url) => solarAssetUrl(url));
}
