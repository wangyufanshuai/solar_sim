import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrRegretRankingSnapshotV531,
  loadKerrRegretRankingSummaryV531,
  resetKerrRegretRankingClientForTestsV531,
  subscribeKerrRegretRankingV531,
} from "./kerrRegretRankingClientV531";
import { createKerrRegretRankingSummaryV531 } from "./kerrRegretRankingV531";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-regret-ranking-v531/atlas.json", "utf8"),
);
beforeEach(() => resetKerrRegretRankingClientForTestsV531());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrRegretRankingClientForTestsV531();
  vi.restoreAllMocks();
});
describe("v531 regret ranking client", () => {
  it("single-flights and returns subscriptions to baseline", async () => {
    const summary = createKerrRegretRankingSummaryV531(artifact);
    const body = JSON.stringify({
      version: "v531-kerr-regret-ranking-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrRegretRankingV531(() => undefined),
      subscribeKerrRegretRankingV531(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrRegretRankingSummaryV531(),
        loadKerrRegretRankingSummaryV531(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrRegretRankingSnapshotV531()).toMatchObject({ status: "ready", requestCount: 1 });
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
    await expect(loadKerrRegretRankingSummaryV531()).rejects.toThrow("response-too-large");
  });
});
