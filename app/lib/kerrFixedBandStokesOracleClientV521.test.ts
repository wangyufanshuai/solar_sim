import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrFixedBandStokesOracleSnapshotV521,
  loadKerrFixedBandStokesOracleSummaryV521,
  resetKerrFixedBandStokesOracleClientForTestsV521,
  subscribeKerrFixedBandStokesOracleV521,
} from "./kerrFixedBandStokesOracleClientV521";
import { createKerrFixedBandStokesOracleSummaryV521 } from "./kerrFixedBandStokesOracleV521";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json", "utf8"),
);

beforeEach(() => resetKerrFixedBandStokesOracleClientForTestsV521());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrFixedBandStokesOracleClientForTestsV521();
  vi.restoreAllMocks();
});

describe("v521 direct Stokes oracle client", () => {
  it("single-flights two consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrFixedBandStokesOracleSummaryV521(artifact);
    const body = JSON.stringify({
      version: "v521-kerr-fixed-band-stokes-direct-integration-oracle-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrFixedBandStokesOracleV521(() => undefined),
      subscribeKerrFixedBandStokesOracleV521(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrFixedBandStokesOracleSummaryV521(),
        loadKerrFixedBandStokesOracleSummaryV521(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrFixedBandStokesOracleSnapshotV521()).toMatchObject({
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
    await expect(loadKerrFixedBandStokesOracleSummaryV521()).rejects.toThrow(
      "response-too-large",
    );
  });
});
