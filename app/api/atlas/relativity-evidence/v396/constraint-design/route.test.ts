import { beforeEach, describe, expect, it } from "vitest";
import { resetKerrAuxiliaryConstraintDesignServerV396CacheForTests } from "../../../../../lib/kerrAuxiliaryConstraintDesignServerV396";
import { GET } from "./route";

describe("v396 auxiliary constraint route", () => {
  beforeEach(() => {
    resetKerrAuxiliaryConstraintDesignServerV396CacheForTests();
  });

  it("keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v396-lite"));
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "lite-boundary",
      artifact: null,
    });
  });

  it("serves only the bounded local-shadow artifact with no-store", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v396", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-auxiliary-constraint-design")).toBe(
      "v396",
    );
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const body = JSON.parse(text);
    expect(body.artifact.design).toMatchObject({
      baselineRank: 24,
      fullRank: 36,
      minimumConstraintsForFullRank: 12,
    });
    expect(body.artifact.productionAdmission.instrumentResponseAvailable).toBe(
      false,
    );
  });
});
