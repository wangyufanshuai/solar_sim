import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { resetKerrWcsProjectionServerCacheForTestsV441 } from "../../../../../lib/kerrWcsProjectionAvailabilityServerV441";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  resetKerrWcsProjectionServerCacheForTestsV441();
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v441 WCS projection route", () => {
  it("enforces Lite and ordinary standalone boundaries", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v441-lite"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v441-full"))).json()).toMatchObject({
      available: false,
      reason: "local-shadow-only",
    });
  });

  it("returns bounded WCS authority and rejects raster exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v441", { headers: { "x-forwarded-for": "127.0.0.111" } }),
    );
    const body = await response.text();
    expect(response.headers.get("x-atlas-kerr-wcs-projection")).toBe("v441-summary");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body).summary).toMatchObject({
      counts: {
        wcsSourceCount: 4,
        joinedSourceCoordinateRowCount: 24,
        detectorProjectionCount: 0,
        psfModelCount: 0,
        rasterProductCount: 0,
      },
      boundary: { wcsCoordinateAuthority: true, detectorProjectionBlocked: true },
    });
    expect(
      (
        await GET(
          new Request("http://localhost/v441?download=png", {
            headers: { "x-forwarded-for": "127.0.0.112" },
          }),
        )
      ).status,
    ).toBe(400);
  });
});
