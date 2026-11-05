import { NextResponse } from "next/server";
import {
  atlasJsonResponseV275,
  atlasTimeoutSignalV275,
  consumeAtlasApiPolicyV275,
} from "../../../lib/atlasApiPolicyV275";
import {
  AtlasApiPayloadTooLargeV270,
  readAtlasRequestTextV270,
  readAtlasResponseJsonV270,
} from "../../../lib/atlasApiSecurityV270";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedWeather = { expiresAt: number; payload: unknown };
const weatherCache = new Map<string, CachedWeather>();
const CACHE_MS = 30 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 128;
const REQUEST_MAX_BYTES = 4 * 1024;
const UPSTREAM_MAX_BYTES = 1024 * 1024;
const WEATHER_MAX_SAMPLES = 72;

const WEATHER_FIELDS = {
  cloud_cover_low: [0, 100],
  cloud_cover_mid: [0, 100],
  cloud_cover_high: [0, 100],
  relative_humidity_2m: [0, 100],
  visibility: [0, 100_000],
  precipitation_probability: [0, 100],
  wind_speed_10m: [0, 500],
} as const;

function pruneWeatherCache(now: number): void {
  for (const [key, entry] of weatherCache) {
    if (entry.expiresAt <= now) weatherCache.delete(key);
  }
  while (weatherCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = weatherCache.keys().next().value as string | undefined;
    if (!oldest) break;
    weatherCache.delete(oldest);
  }
}

function roundedCoordinate(value: unknown, minimum: number, maximum: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) return null;
  return Math.round(value * 100) / 100;
}

function normalizeWeatherUpstream(value: unknown): { hourly: Record<string, readonly (string | number | null)[]> } {
  if (!value || typeof value !== "object") throw new Error("Open-Meteo weather schema is invalid");
  const root = value as Record<string, unknown>;
  if (!root.hourly || typeof root.hourly !== "object") throw new Error("Open-Meteo hourly weather is unavailable");
  const hourly = root.hourly as Record<string, unknown>;
  const rawTimes = Array.isArray(hourly.time) ? hourly.time : [];
  const times = rawTimes.slice(0, WEATHER_MAX_SAMPLES).map((entry) => typeof entry === "string" ? entry.slice(0, 32) : "");
  if (!times.length || times.some((entry) => !entry || !Number.isFinite(Date.parse(/Z$/.test(entry) ? entry : `${entry}Z`)))) {
    throw new Error("Open-Meteo hourly timeline is invalid");
  }
  const normalized: Record<string, readonly (string | number | null)[]> = { time: times };
  for (const [field, [minimum, maximum]] of Object.entries(WEATHER_FIELDS)) {
    const source = Array.isArray(hourly[field]) ? hourly[field] as unknown[] : [];
    normalized[field] = times.map((_, index) => {
      const candidate = source[index];
      return typeof candidate === "number" && Number.isFinite(candidate) && candidate >= minimum && candidate <= maximum
        ? candidate
        : null;
    });
  }
  return { hourly: normalized };
}

export async function POST(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "weather");
  if (limited) return limited;
  let body: unknown;
  try {
    body = JSON.parse(await readAtlasRequestTextV270(request, REQUEST_MAX_BYTES));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AtlasApiPayloadTooLargeV270 ? "Weather request exceeds 4 KiB" : "Invalid JSON body" },
      { status: error instanceof AtlasApiPayloadTooLargeV270 ? 413 : 400 },
    );
  }
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const latitude = roundedCoordinate(value.latitudeDeg, -90, 90);
  const longitude = roundedCoordinate(value.longitudeDeg, -180, 180);
  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Latitude or longitude is invalid" }, { status: 400 });
  }
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  pruneWeatherCache(Date.now());
  const cached = weatherCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return atlasJsonResponseV275("weather", cached.payload, { headers: { "Cache-Control": "private, no-store", "X-Atlas-Weather-Cache": "hit" } });
  }
  const params = new URLSearchParams({
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
    hourly: [
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "relative_humidity_2m",
      "visibility",
      "precipitation_probability",
      "wind_speed_10m",
    ].join(","),
    forecast_days: "3",
    timezone: "UTC",
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      cache: "no-store",
      signal: atlasTimeoutSignalV275("weather"),
    });
    if (!response.ok) throw new Error("Open-Meteo request failed");
    const upstream = normalizeWeatherUpstream(await readAtlasResponseJsonV270(response, UPSTREAM_MAX_BYTES));
    const payload = {
      canonical: false,
      source: "Open-Meteo",
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_MS).toISOString(),
      location: { latitudeDeg: latitude, longitudeDeg: longitude, precisionDeg: 0.01 },
      weather: upstream,
      boundary: "optional-transient-weather-not-science-evidence",
    };
    weatherCache.set(key, { expiresAt: Date.now() + CACHE_MS, payload });
    return atlasJsonResponseV275("weather", payload, { headers: { "Cache-Control": "private, no-store", "X-Atlas-Weather-Cache": "miss" } });
  } catch {
    return atlasJsonResponseV275("weather",
      {
        canonical: false,
        source: "Open-Meteo",
        error: "Weather data is temporarily unavailable",
        boundary: "offline-astronomy-remains-available-no-automatic-retry",
      },
      { status: 502 },
    );
  }
}
