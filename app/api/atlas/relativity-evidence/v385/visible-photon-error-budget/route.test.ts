import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v385 visible photon error budget route", () => {
  it("is local-shadow only and exposes unavailable systematics explicitly", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v385-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v385", {
        headers: { "x-forwarded-for": "127.0.0.385" },
      }),
    );
    const body = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-visible-photon-error-budget")).toBe(
      "v385",
    );
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        combination: {
          rule: "linear-sum-no-independence-proof",
          rssApplied: false,
          unknownSystematicsTreatedAsZero: false,
        },
        qualification: {
          computationalBudgetQualified: true,
          absoluteScientificBudgetQualified: false,
        },
      },
    });
  });
});
