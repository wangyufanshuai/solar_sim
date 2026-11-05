import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrPolarimeterDetectorLikelihoodServerV415CacheForTests } from "../../../../../lib/kerrPolarimeterDetectorLikelihoodServerV415";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrPolarimeterDetectorLikelihoodServerV415CacheForTests());
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v415 detector likelihood route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v415-lite"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v415-full"))).json()).toMatchObject({
      available: false,
      reason: "local-shadow-only",
    });
  });

  it("serves a bounded summary and a separate full fixture", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v415", { headers: { "x-forwarded-for": "127.0.0.111" } }),
    );
    const text = await response.text();
    expect(response.headers.get("x-atlas-kerr-detector-likelihood")).toBe("v415-summary");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(text);
    expect(payload.summary).toMatchObject({
      likelihoodRowCount: 16,
      exactSourcePoissonIntegerAvailable: false,
      measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
    });
    expect(payload.summary).not.toHaveProperty("rays");
    const download = await GET(
      new Request("http://localhost/v415?download=1", {
        headers: { "x-forwarded-for": "127.0.0.112" },
      }),
    );
    expect(download.headers.get("x-atlas-kerr-detector-likelihood")).toBe("v415-full-artifact");
    expect((await download.json()).view.rays.flatMap((ray: { rows: unknown[] }) => ray.rows)).toHaveLength(16);
  });
});
