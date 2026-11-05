import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrBandpassRedshiftCommutatorSnapshotV534,
  loadKerrBandpassRedshiftCommutatorSummaryV534,
  resetKerrBandpassRedshiftCommutatorClientForTestsV534,
  subscribeKerrBandpassRedshiftCommutatorV534,
} from "./kerrBandpassRedshiftCommutatorClientV534";
import { createKerrBandpassRedshiftCommutatorSummaryV534 } from "./kerrBandpassRedshiftCommutatorV534";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(readFileSync("dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json", "utf8"));
beforeEach(() => resetKerrBandpassRedshiftCommutatorClientForTestsV534());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrBandpassRedshiftCommutatorClientForTestsV534();
  vi.restoreAllMocks();
});

describe("v534 bandpass-redshift client", () => {
  it("single-flights and returns subscriptions to lifecycle baseline", async () => {
    const summary = createKerrBandpassRedshiftCommutatorSummaryV534(artifact);
    const body = JSON.stringify({
      version: "v534-kerr-bandpass-redshift-commutator-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrBandpassRedshiftCommutatorV534(() => undefined),
      subscribeKerrBandpassRedshiftCommutatorV534(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrBandpassRedshiftCommutatorSummaryV534(),
        loadKerrBandpassRedshiftCommutatorSummaryV534(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrBandpassRedshiftCommutatorSnapshotV534()).toMatchObject({ status: "ready", requestCount: 1 });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("fails closed on an oversized response", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", {
      status: 200,
      headers: { "Content-Length": String(129 * 1024) },
    })) as typeof fetch;
    await expect(loadKerrBandpassRedshiftCommutatorSummaryV534()).rejects.toThrow("response-too-large");
  });
});
