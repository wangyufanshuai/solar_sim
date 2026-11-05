import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrFixedBandStokesSnapshotV520,
  loadKerrFixedBandStokesSummaryV520,
  resetKerrFixedBandStokesClientForTestsV520,
  subscribeKerrFixedBandStokesV520,
} from "./kerrFixedBandStokesClientV520";
import { createKerrFixedBandStokesSummaryV520 } from "./kerrFixedBandStokesV520";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json", "utf8"),
);

beforeEach(() => resetKerrFixedBandStokesClientForTestsV520());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrFixedBandStokesClientForTestsV520();
  vi.restoreAllMocks();
});

describe("v520 fixed-band Stokes client", () => {
  it("single-flights two consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrFixedBandStokesSummaryV520(artifact);
    const body = JSON.stringify({
      version: "v520-kerr-fixed-band-stokes-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrFixedBandStokesV520(() => undefined),
      subscribeKerrFixedBandStokesV520(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrFixedBandStokesSummaryV520(),
        loadKerrFixedBandStokesSummaryV520(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrFixedBandStokesSnapshotV520()).toMatchObject({
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

  it("fails closed on oversized response declarations", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(129 * 1024) },
      }),
    ) as typeof fetch;
    await expect(loadKerrFixedBandStokesSummaryV520()).rejects.toThrow(
      "response-too-large",
    );
  });
});
