import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrCostLawRobustnessSnapshotV529,
  loadKerrCostLawRobustnessSummaryV529,
  resetKerrCostLawRobustnessClientForTestsV529,
  subscribeKerrCostLawRobustnessV529,
} from "./kerrCostLawRobustnessClientV529";
import { createKerrCostLawRobustnessSummaryV529 } from "./kerrCostLawRobustnessV529";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-cost-law-robustness-v529/envelope.json", "utf8"),
);
beforeEach(() => resetKerrCostLawRobustnessClientForTestsV529());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrCostLawRobustnessClientForTestsV529();
  vi.restoreAllMocks();
});
describe("v529 cost-law robustness client", () => {
  it("single-flights and returns subscriptions to baseline", async () => {
    const summary = createKerrCostLawRobustnessSummaryV529(artifact);
    const body = JSON.stringify({
      version: "v529-kerr-cost-law-robustness-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrCostLawRobustnessV529(() => undefined),
      subscribeKerrCostLawRobustnessV529(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrCostLawRobustnessSummaryV529(),
        loadKerrCostLawRobustnessSummaryV529(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrCostLawRobustnessSnapshotV529()).toMatchObject({
        status: "ready",
        requestCount: 1,
      });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe(
      "baseline",
    );
  });
  it("fails closed on oversized response", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("{}", { status: 200, headers: { "Content-Length": String(129 * 1024) } }),
    ) as typeof fetch;
    await expect(loadKerrCostLawRobustnessSummaryV529()).rejects.toThrow("response-too-large");
  });
});
