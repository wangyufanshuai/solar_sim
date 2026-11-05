import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrPolarizationFrequencySensitivitySnapshotV522,
  loadKerrPolarizationFrequencySensitivitySummaryV522,
  resetKerrPolarizationFrequencySensitivityClientForTestsV522,
  subscribeKerrPolarizationFrequencySensitivityV522,
} from "./kerrPolarizationFrequencySensitivityClientV522";
import { createKerrPolarizationFrequencySensitivitySummaryV522 } from "./kerrPolarizationFrequencySensitivityV522";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json",
    "utf8",
  ),
);

beforeEach(() => resetKerrPolarizationFrequencySensitivityClientForTestsV522());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrPolarizationFrequencySensitivityClientForTestsV522();
  vi.restoreAllMocks();
});

describe("v522 polarization sensitivity client", () => {
  it("single-flights two consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrPolarizationFrequencySensitivitySummaryV522(artifact);
    const body = JSON.stringify({
      version: "v522-kerr-polarization-frequency-sensitivity-envelope-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrPolarizationFrequencySensitivityV522(() => undefined),
      subscribeKerrPolarizationFrequencySensitivityV522(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrPolarizationFrequencySensitivitySummaryV522(),
        loadKerrPolarizationFrequencySensitivitySummaryV522(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrPolarizationFrequencySensitivitySnapshotV522()).toMatchObject({
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
    await expect(loadKerrPolarizationFrequencySensitivitySummaryV522()).rejects.toThrow(
      "response-too-large",
    );
  });
});
