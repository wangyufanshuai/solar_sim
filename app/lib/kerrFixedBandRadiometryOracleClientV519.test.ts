import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrFixedBandRadiometryOracleSnapshotV519,
  loadKerrFixedBandRadiometryOracleSummaryV519,
  resetKerrFixedBandRadiometryOracleClientForTestsV519,
  subscribeKerrFixedBandRadiometryOracleV519,
} from "./kerrFixedBandRadiometryOracleClientV519";
import { createKerrFixedBandRadiometryOracleSummaryV519 } from "./kerrFixedBandRadiometryOracleV519";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json", "utf8"),
);

beforeEach(() => resetKerrFixedBandRadiometryOracleClientForTestsV519());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrFixedBandRadiometryOracleClientForTestsV519();
  vi.restoreAllMocks();
});

describe("v519 radiometry oracle client", () => {
  it("single-flights two consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrFixedBandRadiometryOracleSummaryV519(artifact);
    const body = JSON.stringify({
      version: "v519-kerr-fixed-band-radiometry-multiprecision-oracle-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrFixedBandRadiometryOracleV519(() => undefined),
      subscribeKerrFixedBandRadiometryOracleV519(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrFixedBandRadiometryOracleSummaryV519(),
        loadKerrFixedBandRadiometryOracleSummaryV519(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrFixedBandRadiometryOracleSnapshotV519()).toMatchObject({
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
    await expect(loadKerrFixedBandRadiometryOracleSummaryV519()).rejects.toThrow(
      "response-too-large",
    );
  });
});
