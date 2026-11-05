import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v504 measured calibration preflight route", () => {
  it("is unavailable outside local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(
      new Request(
        "http://localhost/api/atlas/relativity-evidence/v504/detector-calibration-preflight",
      ),
    );
    expect(await response.json()).toMatchObject({
      available: false,
      reason: "local-shadow-only",
      summary: null,
    });
  });

  it("serves the bounded read-only report", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request(
        "http://localhost/api/atlas/relativity-evidence/v504/detector-calibration-preflight",
        { headers: { "x-forwarded-for": "127.0.0.161" } },
      ),
    );
    const body = await response.text();
    expect(new TextEncoder().encode(body).byteLength).toBeLessThanOrEqual(128 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      reason: "ready",
      summary: {
        status: "blocked-inputs-missing",
        observation: { readyFileCount: 0, bytesRead: 0 },
        decision: { measuredDetectorAuthorityGranted: false },
      },
    });
  });
});
