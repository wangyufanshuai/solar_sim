import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrPolarimeterNonlinearObservablesServerV417CacheForTests } from "../../../../../lib/kerrPolarimeterNonlinearObservablesServerV417";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrPolarimeterNonlinearObservablesServerV417CacheForTests());
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v417 nonlinear polarization route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v417-lite"))).json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
    });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v417-full"))).json()).toMatchObject({
      available: false,
      reason: "local-shadow-only",
    });
  });

  it("serves a bounded summary and a separate full nonlinear artifact", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v417", { headers: { "x-forwarded-for": "127.0.0.131" } }),
    );
    const text = await response.text();
    expect(response.headers.get("x-atlas-kerr-nonlinear-polarization")).toBe("v417-summary");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(text);
    expect(payload.summary).toMatchObject({ totalTrialCount: 32768, retainedTrialCount: 4 });
    expect(payload.summary).not.toHaveProperty("rays");
    const download = await GET(
      new Request("http://localhost/v417?download=1", {
        headers: { "x-forwarded-for": "127.0.0.132" },
      }),
    );
    expect(download.headers.get("x-atlas-kerr-nonlinear-polarization")).toBe("v417-full-artifact");
    expect((await download.json()).view.rays).toHaveLength(4);
  });
});
