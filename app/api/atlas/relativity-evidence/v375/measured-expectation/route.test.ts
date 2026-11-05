import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v375 measured expectation route", () => {
  it("is local-shadow only and reports one qualified photon input", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v375-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });

    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v375", {
        headers: { "x-forwarded-for": "127.0.0.375" },
      }),
    );
    expect(response.headers.get("x-atlas-measured-expectation-authority")).toBe(
      "v375",
    );
    expect(await response.json()).toMatchObject({
      available: true,
      artifact: {
        status: "blocked-dual-authority-inputs-unavailable",
        presentInputCount: 1,
        photonInputQualified: true,
        detectorAuthorityQualified: false,
        geometryAuthorityQualified: false,
        measuredExpectationAvailable: false,
        expectationRowCount: 0,
        attemptConsumed: false,
      },
    });
  });
});
