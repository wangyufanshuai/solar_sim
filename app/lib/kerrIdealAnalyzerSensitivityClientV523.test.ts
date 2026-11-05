import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrIdealAnalyzerSensitivitySnapshotV523,
  loadKerrIdealAnalyzerSensitivitySummaryV523,
  resetKerrIdealAnalyzerSensitivityClientForTestsV523,
  subscribeKerrIdealAnalyzerSensitivityV523,
} from "./kerrIdealAnalyzerSensitivityClientV523";
import { createKerrIdealAnalyzerSensitivitySummaryV523 } from "./kerrIdealAnalyzerSensitivityV523";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json", "utf8"),
);

beforeEach(() => resetKerrIdealAnalyzerSensitivityClientForTestsV523());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrIdealAnalyzerSensitivityClientForTestsV523();
  vi.restoreAllMocks();
});

describe("v523 ideal analyzer sensitivity client", () => {
  it("single-flights two consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrIdealAnalyzerSensitivitySummaryV523(artifact);
    const body = JSON.stringify({
      version: "v523-kerr-ideal-analyzer-sensitivity-projection-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrIdealAnalyzerSensitivityV523(() => undefined),
      subscribeKerrIdealAnalyzerSensitivityV523(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrIdealAnalyzerSensitivitySummaryV523(),
        loadKerrIdealAnalyzerSensitivitySummaryV523(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrIdealAnalyzerSensitivitySnapshotV523()).toMatchObject({
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
    await expect(loadKerrIdealAnalyzerSensitivitySummaryV523()).rejects.toThrow(
      "response-too-large",
    );
  });
});
