import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as catalogPost } from "../api/atlas/catalog/query/route";
import { GET as locationsGet } from "../api/atlas/locations/route";
import { POST as scienceWorkbenchPost } from "../api/atlas/science-workbench/route";
import { POST as weatherPost } from "../api/atlas/weather/route";
import { resetAtlasApiRateLimitsForTestsV270 } from "./atlasApiRateLimitV270";

afterEach(() => {
  resetAtlasApiRateLimitsForTestsV270();
  vi.restoreAllMocks();
});

describe("v270 bounded Atlas API routes", () => {
  it("rejects an oversized catalog body before any outbound request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await catalogPost(new Request("http://atlas.test/api/atlas/catalog/query", {
      method: "POST",
      headers: { "content-length": String(20 * 1024) },
      body: "{}",
    }));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
    const scienceResponse = await scienceWorkbenchPost(new Request("http://atlas.test/api/atlas/science-workbench", {
      method: "POST",
      headers: { "content-length": String(20 * 1024) },
      body: "{}",
    }));
    expect(scienceResponse.status).toBe(413);
  });

  it("rounds weather coordinates and only returns bounded hourly fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      hourly: {
        time: ["2026-07-20T00:00"],
        cloud_cover_low: [20],
        cloud_cover_mid: [null],
        cloud_cover_high: [140],
        relative_humidity_2m: [55],
        visibility: [20_000],
        precipitation_probability: [5],
        wind_speed_10m: [12],
      },
      untrusted_extra: "not-forwarded",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const response = await weatherPost(new Request("http://atlas.test/api/atlas/weather", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ latitudeDeg: 39.9042, longitudeDeg: 116.4074 }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.location).toMatchObject({ latitudeDeg: 39.9, longitudeDeg: 116.41, precisionDeg: 0.01 });
    expect(payload.weather.hourly.cloud_cover_high).toEqual([null]);
    expect(payload.weather.untrusted_extra).toBeUndefined();
  });

  it("filters malformed geocoding rows and sanitizes upstream errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      results: [
        { id: 1, name: "北京", latitude: 39.9, longitude: 116.4, elevation: 44, timezone: "Asia/Shanghai" },
        { id: 2, name: "invalid", latitude: 190, longitude: 0 },
      ],
    }), { status: 200 }));
    const ok = await locationsGet(new Request("http://atlas.test/api/atlas/locations?q=%E5%8C%97%E4%BA%AC"));
    expect((await ok.json()).results).toHaveLength(1);
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("private upstream detail"));
    const failed = await locationsGet(new Request("http://atlas.test/api/atlas/locations?q=Shanghai"));
    expect(failed.status).toBe(502);
    expect(JSON.stringify(await failed.json())).not.toContain("private upstream detail");
  });
});
