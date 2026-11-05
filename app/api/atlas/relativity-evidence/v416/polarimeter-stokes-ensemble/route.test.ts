import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrPolarimeterStokesEnsembleServerV416CacheForTests } from "../../../../../lib/kerrPolarimeterStokesEnsembleServerV416";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrPolarimeterStokesEnsembleServerV416CacheForTests());
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v416 Stokes ensemble route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v416-lite"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v416-full"))).json()).toMatchObject({
      available: false,
      reason: "local-shadow-only",
    });
  });

  it("serves a bounded summary and a separate full ensemble artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v416", { headers: { "x-forwarded-for": "127.0.0.121" } }),
    );
    const text = await response.text();
    expect(response.headers.get("x-atlas-kerr-stokes-ensemble")).toBe("v416-summary");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(text);
    expect(payload.summary).toMatchObject({ totalTrialCount: 16384, retainedTrialCount: 4 });
    expect(payload.summary).not.toHaveProperty("rays");
    const download = await GET(
      new Request("http://localhost/v416?download=1", {
        headers: { "x-forwarded-for": "127.0.0.122" },
      }),
    );
    expect(download.headers.get("x-atlas-kerr-stokes-ensemble")).toBe("v416-full-artifact");
    expect((await download.json()).view.rays).toHaveLength(4);
  });
});
