import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });

describe("IXPE metadata route v563", () => {
  it("fails closed outside local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v563/ixpe-metadata"));
    expect(await response.json()).toMatchObject({ available: false, reason: "local-shadow-only", summary: null });
  });
  it("serves metadata-only blocked evidence in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v563/ixpe-metadata", { headers: { "x-forwarded-for": "127.0.0.56" } }));
    expect(await response.json()).toMatchObject({ available: true, summary: { probe: { method: "HEAD-only", payloadRead: false }, qualification: { measuredAuthorityGranted: false } } });
  });
});
