import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v379 measured authority readiness route", () => {
  it("is local-shadow only and distinguishes contract readiness from data readiness", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (await GET(new Request("http://localhost/v379-lite"))).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });

    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v379", {
        headers: { "x-forwarded-for": "127.0.0.379" },
      }),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-measured-authority-readiness")).toBe(
      "v379",
    );
    const body = await response.text();
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        schemaContractQualifiedCount: 7,
        boundedReadQualifiedCount: 7,
        presentInputCount: 0,
        missingInputCount: 7,
        downstream: {
          v375EnvelopeAvailable: false,
          v376ScienceImageAvailable: false,
          observedCountsAvailable: false,
        },
      },
    });
  });
});
