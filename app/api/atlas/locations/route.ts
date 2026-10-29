import { NextResponse } from "next/server";
import {
  atlasJsonResponseV275,
  atlasTimeoutSignalV275,
  consumeAtlasApiPolicyV275,
} from "../../../lib/atlasApiPolicyV275";
import { atlasBoundedTextV270, readAtlasResponseJsonV270 } from "../../../lib/atlasApiSecurityV270";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM_MAX_BYTES = 256 * 1024;

function finiteCoordinate(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
}

export async function GET(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "locations");
  if (limited) return limited;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80 || /[\u0000-\u001f\u007f]/.test(query)) {
    return NextResponse.json({ error: "Location query must contain 2-80 characters" }, { status: 400 });
  }
  const params = new URLSearchParams({ name: query, count: "10", language: "zh", format: "json" });
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      cache: "no-store",
      signal: atlasTimeoutSignalV275("locations"),
    });
    if (!response.ok) throw new Error("Open-Meteo geocoding request failed");
    const upstreamValue = await readAtlasResponseJsonV270(response, UPSTREAM_MAX_BYTES);
    const upstream = upstreamValue && typeof upstreamValue === "object"
      ? upstreamValue as { results?: unknown }
      : {};
    const results = (Array.isArray(upstream.results) ? upstream.results : []).slice(0, 10).flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const result = candidate as Record<string, unknown>;
      const latitudeDeg = finiteCoordinate(result.latitude, -90, 90);
      const longitudeDeg = finiteCoordinate(result.longitude, -180, 180);
      const name = atlasBoundedTextV270(result.name, 120);
      if (latitudeDeg == null || longitudeDeg == null || !name) return [];
      return [{
        id: atlasBoundedTextV270(result.id == null ? "" : String(result.id), 64),
        name,
        admin1: atlasBoundedTextV270(result.admin1, 120),
        country: atlasBoundedTextV270(result.country, 120),
        latitudeDeg,
        longitudeDeg,
        elevationM: finiteCoordinate(result.elevation, -500, 10_000) ?? 0,
        timeZone: atlasBoundedTextV270(result.timezone, 80) || "UTC",
      }];
    });
    return atlasJsonResponseV275("locations", {
      canonical: false,
      source: "Open-Meteo Geocoding",
      fetchedAt: new Date().toISOString(),
      results,
      boundary: "transient-location-search-not-canonical-evidence-or-history",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return atlasJsonResponseV275("locations", { error: "Location search is temporarily unavailable" }, { status: 502 });
  }
}
