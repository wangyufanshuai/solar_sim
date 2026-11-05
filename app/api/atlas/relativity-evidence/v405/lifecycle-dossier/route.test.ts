import { beforeEach, describe, expect, it } from "vitest";
import { resetAtlasLifecycleProvenanceDossierServerV405CacheForTests } from "../../../../../lib/atlasLifecycleProvenanceDossierServerV405";
import { GET } from "./route";

describe("v405 lifecycle dossier route", () => {
  beforeEach(() => resetAtlasLifecycleProvenanceDossierServerV405CacheForTests());
  it("keeps Lite and ordinary standalone outside the V13 boundary", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    expect(await (await GET(new Request("http://localhost/v405-lite"))).json()).toMatchObject({ available: false, reason: "lite-boundary", dossier: null });
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "standalone-full";
    expect(await (await GET(new Request("http://localhost/v405-standalone"))).json()).toMatchObject({ available: false, reason: "local-shadow-only", dossier: null });
  });
  it("exports a bounded local-shadow dossier with no cycle array", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v405", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-lifecycle-dossier")).toBe("v405");
    expect(response.headers.get("content-disposition")).toContain("orbit-atlas-v405-lifecycle-dossier.json");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    expect(text).not.toContain('"cycles"');
    expect(JSON.parse(text)).toMatchObject({ available: true, reason: "ready", dossier: { lineage: { nodeCount: 4, edgeCount: 3 }, release: { formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49" } } });
  });
});
