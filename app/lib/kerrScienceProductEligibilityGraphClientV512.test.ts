import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrScienceProductEligibilityGraphSnapshotV512,
  loadKerrScienceProductEligibilityGraphSummaryV512,
  resetKerrScienceProductEligibilityGraphClientForTestsV512,
  subscribeKerrScienceProductEligibilityGraphV512,
} from "./kerrScienceProductEligibilityGraphClientV512";
import { createKerrScienceProductEligibilityGraphSummaryV512 } from "./kerrScienceProductEligibilityGraphV512";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-science-product-eligibility-v512/eligibility-graph.json",
    "utf8",
  ),
);
beforeEach(() => resetKerrScienceProductEligibilityGraphClientForTestsV512());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrScienceProductEligibilityGraphClientForTestsV512();
  vi.restoreAllMocks();
});

describe("v512 science product graph client", () => {
  it("single-flights one bounded no-store request and returns its subscription to baseline", async () => {
    const summary = createKerrScienceProductEligibilityGraphSummaryV512(artifact);
    const body = JSON.stringify({
      version: "v512-kerr-science-product-eligibility-graph-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const release = subscribeKerrScienceProductEligibilityGraphV512(() => undefined);
    try {
      const [first, second] = await Promise.all([
        loadKerrScienceProductEligibilityGraphSummaryV512(),
        loadKerrScienceProductEligibilityGraphSummaryV512(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrScienceProductEligibilityGraphSnapshotV512()).toMatchObject({
        status: "ready",
        requestCount: 1,
        summary: first,
      });
    } finally {
      release();
      release();
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe(
      "baseline",
    );
  });
});
