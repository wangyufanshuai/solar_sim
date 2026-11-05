import { NextResponse } from "next/server";
import {
  ATLAS_ONLINE_CATALOG_MAX_RESPONSE_BYTES,
  ATLAS_ONLINE_CATALOG_QUERY_VERSION,
  buildAtlasOnlineCatalogAdqlV259,
  parseAtlasOnlineCatalogQueryV259,
  parseSimpleCsvV259,
} from "../../../../lib/atlasOnlineCatalogQueryV259";
import {
  atlasJsonResponseV275,
  atlasTimeoutSignalV275,
  consumeAtlasApiPolicyV275,
} from "../../../../lib/atlasApiPolicyV275";
import {
  AtlasApiPayloadTooLargeV270,
  atlasUtf8ByteLengthV270,
  readAtlasRequestTextV270,
  readAtlasResponseTextV270,
} from "../../../../lib/atlasApiSecurityV270";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_MAX_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "catalog");
  if (limited) return limited;
  let query;
  try {
    const body = await readAtlasRequestTextV270(request, REQUEST_MAX_BYTES);
    query = parseAtlasOnlineCatalogQueryV259(JSON.parse(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AtlasApiPayloadTooLargeV270 ? "Catalog query body exceeds 16 KiB" : error instanceof Error ? error.message : "Invalid catalog query" },
      { status: error instanceof AtlasApiPayloadTooLargeV270 ? 413 : 400 },
    );
  }
  const adql = buildAtlasOnlineCatalogAdqlV259(query);
  const form = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "csv",
    MAXREC: query.kind === "source-id" ? "1" : String(query.limit),
    QUERY: adql,
  });
  try {
    const response = await fetch("https://gea.esac.esa.int/tap-server/tap/sync", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "OrbitAtlasV259/1.0" },
      body: form,
      cache: "no-store",
      signal: atlasTimeoutSignalV275("catalog"),
    });
    if (!response.ok) throw new Error("ESA Gaia TAP request failed");
    const csv = await readAtlasResponseTextV270(response, ATLAS_ONLINE_CATALOG_MAX_RESPONSE_BYTES);
    const payload = {
      version: ATLAS_ONLINE_CATALOG_QUERY_VERSION,
      canonical: false,
      source: "ESA Gaia DR3 live TAP",
      query,
      fetchedAt: new Date().toISOString(),
      records: parseSimpleCsvV259(csv),
      provenance: {
        endpoint: "https://gea.esac.esa.int/tap-server/tap/sync",
        adql,
        timeoutMs: 12_000,
        boundary: "transient-online-result-not-physics-or-canonical-evidence",
      },
    };
    const serialized = JSON.stringify(payload);
    if (atlasUtf8ByteLengthV270(serialized) > ATLAS_ONLINE_CATALOG_MAX_RESPONSE_BYTES) {
      return NextResponse.json({ error: "Structured catalog response exceeds 5 MiB" }, { status: 413 });
    }
    return new Response(serialized, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1" } });
  } catch (error) {
    if (error instanceof AtlasApiPayloadTooLargeV270) {
      return NextResponse.json({ error: "Catalog response exceeds 5 MiB" }, { status: 413 });
    }
    return atlasJsonResponseV275("catalog", {
      canonical: false,
      error: "Live Gaia query is temporarily unavailable",
      boundary: "live-query-failed-no-automatic-retry-offline-catalog-remains-available",
    }, { status: 502 });
  }
}
