import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrAllocationRegretSnapshotV530,
  loadKerrAllocationRegretSummaryV530,
  resetKerrAllocationRegretClientForTestsV530,
  subscribeKerrAllocationRegretV530,
} from "./kerrAllocationRegretClientV530";
import { createKerrAllocationRegretSummaryV530 } from "./kerrAllocationRegretV530";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-allocation-regret-v530/atlas.json", "utf8"),
);
beforeEach(() => resetKerrAllocationRegretClientForTestsV530());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrAllocationRegretClientForTestsV530();
  vi.restoreAllMocks();
});
describe("v530 allocation regret client", () => {
  it("single-flights and returns subscriptions to baseline", async () => {
    const summary = createKerrAllocationRegretSummaryV530(artifact);
    const body = JSON.stringify({
      version: "v530-kerr-allocation-regret-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrAllocationRegretV530(() => undefined),
      subscribeKerrAllocationRegretV530(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrAllocationRegretSummaryV530(),
        loadKerrAllocationRegretSummaryV530(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrAllocationRegretSnapshotV530()).toMatchObject({
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
    await expect(loadKerrAllocationRegretSummaryV530()).rejects.toThrow("response-too-large");
  });
});
