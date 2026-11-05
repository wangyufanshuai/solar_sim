import { beforeEach, describe, expect, it } from "vitest";
import { resetRelativityLifecycleEvidenceServerV404CacheForTests } from "../../../../../lib/relativityLifecycleEvidenceServerV404";
import { GET } from "./route";

describe("v404 lifecycle summary route", () => {
  beforeEach(() => resetRelativityLifecycleEvidenceServerV404CacheForTests());

  it("keeps Lite explicitly unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const response = await GET(new Request("http://localhost/v404-lite"));
    expect(await response.json()).toMatchObject({ available: false, reason: "lite-boundary", summary: null });
  });

  it("serves only the bounded replay summary with no cycle array", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/v404", { headers: { "x-forwarded-for": "127.0.0.1" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-atlas-lifecycle-evidence")).toBe("v404");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(128 * 1024);
    expect(text).not.toContain('"cycles"');
    expect(JSON.parse(text)).toMatchObject({
      available: true,
      reason: "ready",
      summary: {
        replay: { cycleCount: 30, totalRequestCount: 114, successCount: 108, failureCount: 4, releasedPendingRequestCount: 2 },
        qualification: { browserSoakQualified: false, productionLifecycleQualified: false, cycleDetailsExposed: false },
      },
    });
  });
});
