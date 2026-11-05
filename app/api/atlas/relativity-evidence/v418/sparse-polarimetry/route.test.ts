import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetKerrSparsePolarimetricProductServerV418CacheForTests } from "../../../../../lib/kerrSparsePolarimetricProductServerV418";
import { GET } from "./route";

const previous = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
beforeEach(() => resetKerrSparsePolarimetricProductServerV418CacheForTests());
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = previous;
});

describe("v418 sparse polarimetry route", () => {
  it("keeps Lite and ordinary standalone unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v418-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v418-full"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
  });

  it("serves a bounded summary and only four whitelisted export formats", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v418", { headers: { "x-forwarded-for": "127.0.0.141" } }));
    const text = await response.text();
    expect(response.headers.get("x-atlas-kerr-sparse-polarimetry")).toBe("v418-summary");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    const payload = JSON.parse(text);
    expect(payload.summary.rows).toHaveLength(4);
    expect(payload.summary).not.toHaveProperty("view");
    for (const format of ["json", "csv", "fits", "png"] as const) {
      const download = await GET(new Request(`http://localhost/v418?download=${format}`, { headers: { "x-forwarded-for": `127.0.0.${142 + format.length}` } }));
      expect(download.status).toBe(200);
      expect(download.headers.get("x-atlas-kerr-sparse-polarimetry")).toContain(`v418-${format}-`);
      expect((await download.arrayBuffer()).byteLength).toBeGreaterThan(0);
    }
    const denied = await GET(new Request("http://localhost/v418?download=../../secret", { headers: { "x-forwarded-for": "127.0.0.149" } }));
    expect(denied.status).toBe(400);
  });
});
