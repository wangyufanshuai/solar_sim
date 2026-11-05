import { afterEach, describe, expect, it } from "vitest";
import { resetKerrLicenseConfirmationPacketServerCacheForTestsV552 } from "../../../../../lib/kerrLicenseConfirmationPacketServerV552";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { resetKerrLicenseConfirmationPacketServerCacheForTestsV552(); if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });

describe("v552 license confirmation packet route", () => {
  it("serves the bounded missing-packet summary and exports in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v552/license-confirmation-packet", { headers: { "x-forwarded-for": "127.0.0.590" } }));
    expect(response.status).toBe(200);
    expect(Buffer.byteLength(await response.clone().text(), "utf8")).toBeLessThanOrEqual(128 * 1024);
    expect((await response.json()).summary.validator).toMatchObject({ packetPresent: false, missingEntryCount: 7, measuredAuthorityGranted: false });
    for (const download of ["receipt", "atlas"]) {
      const item = await GET(new Request(`http://localhost/api/atlas/relativity-evidence/v552/license-confirmation-packet?download=${download}`, { headers: { "x-forwarded-for": `127.0.0.${591 + download.length}` } }));
      expect(item.status).toBe(200);
      expect(item.headers.get("x-atlas-kerr-product")).toContain("not-production");
    }
  });
  it("fails closed for arbitrary exports and non-local-shadow delivery", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    expect((await GET(new Request("http://localhost/v552?download=license-text", { headers: { "x-forwarded-for": "127.0.0.594" } }))).status).toBe(400);
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect((await (await GET(new Request("http://localhost/v552-full"))).json()).reason).toBe("local-shadow-only");
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect((await (await GET(new Request("http://localhost/v552-lite"))).json()).reason).toBe("lite-boundary");
  });
});
