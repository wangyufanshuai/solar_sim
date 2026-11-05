import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v376 expected electron image route", () => {
  it("is local-shadow only and reports no image without the v375 envelope", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v376-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v376", {
        headers: { "x-forwarded-for": "127.0.0.376" },
      }),
    );
    expect(response.headers.get("x-atlas-expected-electron-image")).toBe("v376");
    expect(await response.json()).toMatchObject({
      available: true,
      artifact: {
        status: "blocked-envelope-unavailable",
        presentInputCount: 0,
        imageAvailable: false,
        jsonPublished: false,
        csvPublished: false,
        zeroImageFallbackUsed: false,
        observedCountsAvailable: false,
        attemptConsumed: false,
      },
    });
  });
});
