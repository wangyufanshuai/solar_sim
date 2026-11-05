import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => {
  if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original;
});

describe("v362 Instrument Lab route", () => {
  it("is unavailable outside local-shadow and returns only a bounded summary inside it", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v362/instrument-lab"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v362/instrument-lab"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v362/instrument-lab", { headers: { "x-forwarded-for": "127.0.0.362" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-instrument-lab")).toBe("v362");
    expect(body).toMatchObject({ available: true, snapshot: { stageCount: 6, syntheticQualifiedCount: 5, measuredQualifiedCount: 0, scienceBufferMutationAllowed: false } });
    expect(JSON.stringify(body).length).toBeLessThan(32 * 1024);
  });
});
