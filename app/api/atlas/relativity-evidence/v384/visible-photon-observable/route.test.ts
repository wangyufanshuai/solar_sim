import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v384 visible photon observable route", () => {
  it("is local-shadow only and exports photons without electrons", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v384-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v384", {
        headers: { "x-forwarded-for": "127.0.0.384" },
      }),
    );
    const body = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-visible-photon-observable")).toBe(
      "v384",
    );
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        counts: { observableRowCount: 4 },
        algorithms: { integrationDomainIndependent: true },
        authorityBoundary: {
          photonObservableQualified: true,
          detectorElectronExpectationAvailable: false,
          observedCountsAvailable: false,
        },
      },
    });
  });
});
