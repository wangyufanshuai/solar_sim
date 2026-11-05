import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v381 measured authority identity route", () => {
  it("is local-shadow only and returns the bounded corrected identity model", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v381-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v381", {
        headers: { "x-forwarded-for": "127.0.0.381" },
      }),
    );
    const body = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-measured-authority-identity")).toBe(
      "v381",
    );
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        correctedModel: {
          bandLaneCount: 3,
          qualifiedBandLaneCount: 0,
          crossBandInstrumentIdentityRequired: false,
        },
        authorityPromotionAllowed: false,
      },
    });
  });
});
