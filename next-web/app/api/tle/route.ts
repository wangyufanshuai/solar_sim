import { NextResponse } from "next/server";
import { parseTleText } from "../../lib/satelliteTle";

type CacheValue = {
  ts: number;
  records: ReturnType<typeof parseTleText>;
};

const TTL_MS = 60_000;
let cache: CacheValue | null = null;

async function fetchGroup(name: string): Promise<string> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${name}&FORMAT=tle`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TLE fetch failed for ${name}: ${res.status}`);
  return await res.text();
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({ at: new Date(now).toISOString(), records: cache.records });
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
    return NextResponse.json({ at: new Date(now).toISOString(), records });
  } catch (e) {
    if (cache) {
      return NextResponse.json({
        at: new Date(cache.ts).toISOString(),
        stale: true,
        records: cache.records,
      });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

