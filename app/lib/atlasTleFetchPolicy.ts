export const ATLAS_TLE_GROUPS = ["stations", "qzss", "starlink"] as const;
export type AtlasTleGroup = (typeof ATLAS_TLE_GROUPS)[number];

export const ATLAS_TLE_FETCH_TIMEOUT_MS = 10_000;
export const ATLAS_TLE_MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
export const ATLAS_TLE_CACHE_SECONDS = 300;

export function atlasTleSourceUrl(group: AtlasTleGroup): URL {
  const url = new URL("https://celestrak.org/NORAD/elements/gp.php");
  url.searchParams.set("GROUP", group);
  url.searchParams.set("FORMAT", "tle");
  return url;
}

export async function readAtlasTleResponseLimited(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > ATLAS_TLE_MAX_RESPONSE_BYTES) {
    throw new Error("TLE response exceeds the declared size limit");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > ATLAS_TLE_MAX_RESPONSE_BYTES) {
      await reader.cancel("atlas-tle-response-too-large");
      throw new Error("TLE response exceeds the streaming size limit");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export const ATLAS_TLE_RESPONSE_HEADERS = {
  "Cache-Control": `public, s-maxage=${ATLAS_TLE_CACHE_SECONDS}, stale-while-revalidate=86400`,
  "X-Content-Type-Options": "nosniff",
} as const;
