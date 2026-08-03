import { afterEach, describe, expect, it } from "vitest";
import { resetOrbitRelativityEngineServerCacheForTestsV561 } from "../../../../../lib/orbitRelativityEngineServerV561";
import { GET } from "./route";

describe("Orbit Relativity Engine V561 API", () => {
  afterEach(() => {
    resetOrbitRelativityEngineServerCacheForTestsV561();
    delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  });

  it("serves bounded CPU reference evidence to local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v561/engine", { headers: { "x-forwarded-for": "127.0.0.910" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.summary.qualification).toMatchObject({ cpuAuthority: true, measuredAuthority: false, grmhd: false });
  });

  it("fails closed outside local-shadow", async () => {
    const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    try {
      const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v561/engine"));
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.available).toBe(false);
      expect(body.reason).toBe("lite-boundary");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
      else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
    }
  });

  it("serves only the bounded transport summary/FITS exports", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summary = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v561/engine?download=transportSummary", { headers: { "x-forwarded-for": "127.0.0.912" } }));
    expect(summary.status).toBe(200);
    expect(summary.headers.get("content-type")).toContain("application/json");
    expect((await summary.json()).measuredAuthority).toBe(false);
    const fits = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v561/engine?download=transportFits", { headers: { "x-forwarded-for": "127.0.0.913" } }));
    expect(fits.status).toBe(200);
    expect(fits.headers.get("content-type")).toBe("application/fits");
  });
});
