import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrGridAxisInfluenceSnapshotV533,
  loadKerrGridAxisInfluenceSummaryV533,
  resetKerrGridAxisInfluenceClientForTestsV533,
  subscribeKerrGridAxisInfluenceV533,
} from "./kerrGridAxisInfluenceClientV533";
import { createKerrGridAxisInfluenceSummaryV533 } from "./kerrGridAxisInfluenceV533";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(readFileSync("dist/science/kerr-grid-axis-influence-v533/atlas.json", "utf8"));

beforeEach(() => resetKerrGridAxisInfluenceClientForTestsV533());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrGridAxisInfluenceClientForTestsV533();
  vi.restoreAllMocks();
});

describe("v533 grid-axis influence client", () => {
  it("single-flights and returns subscriptions to lifecycle baseline", async () => {
    const summary = createKerrGridAxisInfluenceSummaryV533(artifact);
    const body = JSON.stringify({
      version: "v533-kerr-grid-axis-influence-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrGridAxisInfluenceV533(() => undefined),
      subscribeKerrGridAxisInfluenceV533(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrGridAxisInfluenceSummaryV533(),
        loadKerrGridAxisInfluenceSummaryV533(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrGridAxisInfluenceSnapshotV533()).toMatchObject({ status: "ready", requestCount: 1 });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("fails closed on an oversized declared response", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", {
      status: 200,
      headers: { "Content-Length": String(129 * 1024) },
    })) as typeof fetch;
    await expect(loadKerrGridAxisInfluenceSummaryV533()).rejects.toThrow("response-too-large");
  });
});
