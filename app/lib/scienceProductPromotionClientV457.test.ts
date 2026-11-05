import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createScienceProductPromotionSummaryV457 } from "./scienceProductPromotionGateV457";
import {
  getScienceProductPromotionSnapshotV457,
  loadScienceProductPromotionSummaryV457,
  resetScienceProductPromotionClientForTestsV457,
} from "./scienceProductPromotionClientV457";

afterEach(() => {
  vi.unstubAllGlobals();
  resetScienceProductPromotionClientForTestsV457();
});

describe("v457 science product promotion client", () => {
  it("single-flights a bounded no-store summary", async () => {
    const summary = createScienceProductPromotionSummaryV457(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v457-science-product-promotion-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadScienceProductPromotionSummaryV457();
    expect(loadScienceProductPromotionSummaryV457()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/atlas/relativity-evidence/v457/science-product-gate",
      { cache: "no-store" },
    );
    expect(getScienceProductPromotionSnapshotV457()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: { decisions: { promotionAllowed: false } },
    });
  });
});
