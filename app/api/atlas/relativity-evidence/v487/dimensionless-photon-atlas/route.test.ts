import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const originalDelivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (originalDelivery === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalDelivery;
});

describe("v487 dimensionless photon atlas route", () => {
  it("returns an explicit unavailable response outside local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ available: false, reason: "local-shadow-only", summary: null });
  });

  it("serves the bounded sparse summary and deterministic SVG only in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summaryResponse = await GET(new Request(
      "http://localhost/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas",
      { headers: { "x-forwarded-for": "127.0.0.41" } },
    ));
    const summaryBody = await summaryResponse.json();
    expect(summaryResponse.status).toBe(200);
    expect(summaryBody.available).toBe(true);
    expect(summaryBody.summary.rays).toHaveLength(4);
    expect(summaryBody.summary.rays.flatMap((ray: { landmarks: unknown[] }) => ray.landmarks)).toHaveLength(20);
    const svgResponse = await GET(new Request(
      "http://localhost/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas?format=svg",
      { headers: { "x-forwarded-for": "127.0.0.42" } },
    ));
    expect(svgResponse.status).toBe(200);
    expect(svgResponse.headers.get("Content-Type")).toContain("image/svg+xml");
    expect(svgResponse.headers.get("Content-Security-Policy")).toContain("sandbox");
    expect(await svgResponse.text()).toContain("Sparse redshift coordinate atlas");
  });
});
