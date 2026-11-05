import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrUncertaintyReplayWitnessSnapshotV516,
  loadKerrUncertaintyReplayWitnessSummaryV516,
  resetKerrUncertaintyReplayWitnessClientForTestsV516,
  subscribeKerrUncertaintyReplayWitnessV516,
} from "./kerrUncertaintyReplayWitnessClientV516";
import { createKerrUncertaintyReplayWitnessSummaryV516 } from "./kerrUncertaintyReplayWitnessV516";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
    "utf8",
  ),
);

beforeEach(() => resetKerrUncertaintyReplayWitnessClientForTestsV516());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrUncertaintyReplayWitnessClientForTestsV516();
  vi.restoreAllMocks();
});

describe("v516 uncertainty witness client", () => {
  it("single-flights two consumers and returns both subscriptions to baseline", async () => {
    const summary = createKerrUncertaintyReplayWitnessSummaryV516(artifact);
    const body = JSON.stringify({
      version: "v516-kerr-uncertainty-replay-witness-chain-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrUncertaintyReplayWitnessV516(() => undefined),
      subscribeKerrUncertaintyReplayWitnessV516(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrUncertaintyReplayWitnessSummaryV516(),
        loadKerrUncertaintyReplayWitnessSummaryV516(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrUncertaintyReplayWitnessSnapshotV516()).toMatchObject({
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

  it("fails closed on a declared oversized response", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(129 * 1024) },
      }),
    ) as typeof fetch;
    await expect(loadKerrUncertaintyReplayWitnessSummaryV516()).rejects.toThrow(
      "response-too-large",
    );
    expect(getKerrUncertaintyReplayWitnessSnapshotV516()).toMatchObject({
      status: "unavailable",
      reason: "response-too-large",
      requestCount: 1,
    });
  });
});
