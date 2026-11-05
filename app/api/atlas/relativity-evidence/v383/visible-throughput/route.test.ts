import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v383 visible throughput route", () => {
  it("is local-shadow only and returns metrics rather than the full profile", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (
        await GET(new Request("http://localhost/v383-lite"))
      ).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v383", {
        headers: { "x-forwarded-for": "127.0.0.383" },
      }),
    );
    const body = await response.text();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-visible-throughput")).toBe("v383");
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(128 * 1024);
    expect(body).not.toContain("wavelength_m,throughput");
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        candidate: { rowCount: 3301 },
        dualImplementation: { qualified: true },
        authorityBoundary: {
          normalizedCandidateQualified: true,
          visibleMeasuredAuthorityGranted: false,
        },
      },
    });
  });
});
