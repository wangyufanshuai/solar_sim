import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous; });
describe("v537 sparse FITS route", () => {
  it("serves a bounded summary and exact FITS binary table only in local-shadow", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const summary = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v537/response-aware-sparse-fits", { headers: { "x-forwarded-for": "127.0.0.537" } }));
    expect(summary.status).toBe(200);
    expect(summary.headers.get("cache-control")).toBe("no-store");
    expect((await summary.json()).summary.fits.imageHduCount).toBe(0);
    const binary = await GET(new Request("http://localhost/api/atlas/relativity-evidence/v537/response-aware-sparse-fits?download=fits", { headers: { "x-forwarded-for": "127.0.0.538" } }));
    expect(binary.status).toBe(200);
    expect(binary.headers.get("content-type")).toBe("application/fits");
    expect(binary.headers.get("x-atlas-kerr-product")).toContain("binary-table-not-image-hdu");
    expect(new TextDecoder("ascii").decode((await binary.arrayBuffer()).slice(0, 9))).toBe("SIMPLE  =");
  });
  it("fails closed for standalone and Lite", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v537/response-aware-sparse-fits"))).json()).reason).toBe("local-shadow-only");
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect((await (await GET(new Request("http://localhost/api/atlas/relativity-evidence/v537/response-aware-sparse-fits"))).json()).reason).toBe("lite-boundary");
  });
});
