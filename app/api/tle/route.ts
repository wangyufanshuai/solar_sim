import { NextResponse } from "next/server";
import { parseTleText } from "../../lib/satelliteTle";
import {
  ATLAS_TLE_CACHE_SECONDS,
  ATLAS_TLE_FETCH_TIMEOUT_MS,
  ATLAS_TLE_RESPONSE_HEADERS,
  atlasTleSourceUrl,
  readAtlasTleResponseLimited,
  type AtlasTleGroup,
} from "../../lib/atlasTleFetchPolicy";

type CacheValue = {
  ts: number;
  records: ReturnType<typeof parseTleText>;
};

const TTL_MS = ATLAS_TLE_CACHE_SECONDS * 1000;
let cache: CacheValue | null = null;

async function fetchGroup(name: AtlasTleGroup): Promise<string> {
  const res = await fetch(atlasTleSourceUrl(name), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(ATLAS_TLE_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TLE fetch failed for ${name}: ${res.status}`);
  return await readAtlasTleResponseLimited(res);
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({ at: new Date(now).toISOString(), records: cache.records }, { headers: ATLAS_TLE_RESPONSE_HEADERS });
  }
  try {
    const [stationsRaw, qzssRaw, starlinkRaw] = await Promise.all([
      fetchGroup("stations"),
      fetchGroup("qzss"),
      fetchGroup("starlink"),
    ]);
    const stations = parseTleText(stationsRaw, "stations");
    const qzss = parseTleText(qzssRaw, "qzss");
    const starlink = parseTleText(starlinkRaw, "starlink").slice(0, 500);
    const records = [...stations, ...qzss, ...starlink];
    cache = { ts: now, records };
    return NextResponse.json({ at: new Date(now).toISOString(), records }, { headers: ATLAS_TLE_RESPONSE_HEADERS });
  } catch {
    if (cache) {
      return NextResponse.json({
        at: new Date(cache.ts).toISOString(),
        stale: true,
        records: cache.records,
      }, { headers: ATLAS_TLE_RESPONSE_HEADERS });
    }
    return NextResponse.json({ error: "tle-source-unavailable" }, { status: 503, headers: ATLAS_TLE_RESPONSE_HEADERS });
  }
}

