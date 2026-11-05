import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v378 measurement authority topology route", () => {
  it("is local-shadow only and exposes the bounded fail-closed DAG", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(
      await (await GET(new Request("http://localhost/v378-lite"))).json(),
    ).toMatchObject({ available: false, reason: "lite-boundary" });

    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(
      new Request("http://localhost/v378", {
        headers: { "x-forwarded-for": "127.0.0.378" },
      }),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-measurement-authority-topology")).toBe(
      "v378",
    );
    const body = await response.text();
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(64 * 1024);
    expect(JSON.parse(body)).toMatchObject({
      available: true,
      artifact: {
        presentInputCount: 1,
        missingInputCount: 7,
        nodeCount: 10,
        edgeCount: 9,
        acyclic: true,
        boundaries: {
          observedCountsNodeExists: false,
          syntheticFallbackAllowed: false,
          sciencePayloadMutationAllowed: false,
        },
      },
    });
  });
});
