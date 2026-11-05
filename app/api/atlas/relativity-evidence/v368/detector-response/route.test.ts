import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
afterEach(() => { if (original == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE; else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = original; });

describe("v368 detector response route", () => {
  it("keeps Lite and ordinary standalone isolated and returns only the bounded authority snapshot", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v368"))).json()).toMatchObject({ available: false, reason: "lite-boundary" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v368"))).json()).toMatchObject({ available: false, reason: "local-shadow-only" });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v368", { headers: { "x-forwarded-for": "127.0.0.368" } }));
    expect(response.headers.get("x-atlas-detector-response-authority")).toBe("v368");
    expect(Buffer.byteLength(await response.clone().text(), "utf8")).toBeLessThanOrEqual(128 * 1024);
    expect(await response.json()).toMatchObject({ available: true, snapshot: { status: "unavailable-v367-authority-artifacts-missing", authorityGranted: false, measuredResponseAvailable: false, bandResponseCount: 0, syntheticFallbackUsed: false } });
  });
});
