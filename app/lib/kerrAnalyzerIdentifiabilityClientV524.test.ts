import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrAnalyzerIdentifiabilitySnapshotV524,
  loadKerrAnalyzerIdentifiabilitySummaryV524,
  resetKerrAnalyzerIdentifiabilityClientForTestsV524,
  subscribeKerrAnalyzerIdentifiabilityV524,
} from "./kerrAnalyzerIdentifiabilityClientV524";
import { createKerrAnalyzerIdentifiabilitySummaryV524 } from "./kerrAnalyzerIdentifiabilityV524";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-analyzer-identifiability-v524/identifiability.json",
    "utf8",
  ),
);

beforeEach(() => resetKerrAnalyzerIdentifiabilityClientForTestsV524());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrAnalyzerIdentifiabilityClientForTestsV524();
  vi.restoreAllMocks();
});

describe("v524 analyzer identifiability client", () => {
  it("single-flights explicit consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrAnalyzerIdentifiabilitySummaryV524(artifact);
    const body = JSON.stringify({
      version: "v524-kerr-analyzer-identifiability-and-nullspace-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrAnalyzerIdentifiabilityV524(() => undefined),
      subscribeKerrAnalyzerIdentifiabilityV524(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrAnalyzerIdentifiabilitySummaryV524(),
        loadKerrAnalyzerIdentifiabilitySummaryV524(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrAnalyzerIdentifiabilitySnapshotV524()).toMatchObject({
        status: "ready",
        requestCount: 1,
        summary: first,
      });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe(
      "baseline",
    );
  });

  it("fails closed on oversized summary declarations", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(129 * 1024) },
      }),
    ) as typeof fetch;
    await expect(loadKerrAnalyzerIdentifiabilitySummaryV524()).rejects.toThrow(
      "response-too-large",
    );
  });
});
