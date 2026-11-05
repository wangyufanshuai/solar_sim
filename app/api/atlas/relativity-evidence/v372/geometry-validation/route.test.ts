import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v372 geometry validation route", () => {
  it("is local-shadow only and reports zero of six inputs", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v372-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });

    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v372", {
        headers: { "x-forwarded-for": "127.0.0.372" },
      }),
    );
    expect(response.headers.get("x-atlas-observation-geometry-validation")).toBe(
      "v372",
    );
    expect(await response.json()).toMatchObject({
      available: true,
      artifact: {
        status: "blocked-validation-inputs-unavailable",
        presentInputCount: 0,
        validationExecuted: false,
        measuredValidationQualified: false,
        runtimeGeometryPublished: false,
        measuredAuthorityGranted: false,
        attemptConsumed: false,
      },
    });
  });
});
