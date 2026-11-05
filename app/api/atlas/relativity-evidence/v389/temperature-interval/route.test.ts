import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrConditionalTemperatureIntervalServerV389CacheForTests } from "../../../../../lib/kerrConditionalTemperatureIntervalServerV389";
import { GET } from "./route";

describe("v389 conditional temperature interval route", () => {
  beforeEach(() => {
    resetKerrConditionalTemperatureIntervalServerV389CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v389-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      artifact: null,
    });
  });

  it("serves only the local-shadow interval with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v389", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(
      response.headers.get("x-atlas-conditional-temperature-interval"),
    ).toBe("v389");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const body = JSON.parse(text);
    expect(body.artifact.counts.intervalCount).toBe(12);
    expect(body.artifact.intervalSemantics).toMatchObject({
      confidenceInterval: false,
      probabilityContentAssigned: false,
      absoluteScientificIntervalQualified: false,
    });
  });
});
