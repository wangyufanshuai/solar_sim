import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrUncertaintyReplaySnapshotV515,
  getKerrUncertaintyReplayTelemetryV515,
  loadKerrUncertaintyReplaySummaryV515,
  resetKerrUncertaintyReplayClientForTestsV515,
  subscribeKerrUncertaintyReplayV515,
} from "./kerrUncertaintyReplayClientV515";
import { createKerrUncertaintyReplaySummaryV515 } from "./kerrUncertaintyReplayV515";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-uncertainty-replay-v515/replay.json", "utf8"),
);

beforeEach(() => resetKerrUncertaintyReplayClientForTestsV515());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrUncertaintyReplayClientForTestsV515();
  vi.restoreAllMocks();
});

describe("v515 uncertainty replay client", () => {
  it("single-flights two consumers and releases both subscriptions to baseline", async () => {
    const summary = createKerrUncertaintyReplaySummaryV515(artifact);
    const body = JSON.stringify({
      version: "v515-kerr-uncertainty-visual-replay-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const baseline = getAtlasResourceSnapshot();
    const releaseFirst = subscribeKerrUncertaintyReplayV515(() => undefined);
    const releaseSecond = subscribeKerrUncertaintyReplayV515(() => undefined);
    try {
      expect(getKerrUncertaintyReplayTelemetryV515().listenerCount).toBe(2);
      const [first, second] = await Promise.all([
        loadKerrUncertaintyReplaySummaryV515(),
        loadKerrUncertaintyReplaySummaryV515(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/atlas/relativity-evidence/v515/uncertainty-replay",
        { cache: "no-store" },
      );
      expect(getKerrUncertaintyReplaySnapshotV515()).toMatchObject({
        status: "ready",
        requestCount: 1,
        summary: first,
      });
    } finally {
      releaseFirst();
      releaseFirst();
      releaseSecond();
      releaseSecond();
    }

    expect(getKerrUncertaintyReplayTelemetryV515().listenerCount).toBe(0);
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe(
      "baseline",
    );
  });

  it("fails closed before parsing a declared oversized response", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(129 * 1024) },
      }),
    ) as typeof fetch;

    await expect(loadKerrUncertaintyReplaySummaryV515()).rejects.toThrow(
      "response-too-large",
    );
    expect(getKerrUncertaintyReplaySnapshotV515()).toMatchObject({
      status: "unavailable",
      reason: "response-too-large",
      requestCount: 1,
      summary: null,
    });
  });
});
