import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  createKerrInstrumentAuthorityMatrixSummaryV511,
} from "./kerrInstrumentAuthorityMatrixV511";
import {
  getKerrInstrumentAuthorityMatrixSnapshotV511,
  getKerrInstrumentAuthorityMatrixTelemetryV511,
  loadKerrInstrumentAuthorityMatrixSummaryV511,
  resetKerrInstrumentAuthorityMatrixClientForTestsV511,
  subscribeKerrInstrumentAuthorityMatrixV511,
} from "./kerrInstrumentAuthorityMatrixClientV511";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(
  readFileSync("dist/science/kerr-instrument-authority-matrix-v511/matrix.json", "utf8"),
);

beforeEach(() => resetKerrInstrumentAuthorityMatrixClientForTestsV511());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrInstrumentAuthorityMatrixClientForTestsV511();
  vi.restoreAllMocks();
});

describe("v511 instrument authority matrix client", () => {
  it("single-flights one bounded no-store request and tracks its subscription", async () => {
    const summary = createKerrInstrumentAuthorityMatrixSummaryV511(artifact);
    const body = JSON.stringify({
      version: "v511-kerr-instrument-authority-matrix-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const release = subscribeKerrInstrumentAuthorityMatrixV511(() => undefined);
    try {
      expect(getKerrInstrumentAuthorityMatrixTelemetryV511().listenerCount).toBe(1);
      const [first, second] = await Promise.all([
        loadKerrInstrumentAuthorityMatrixSummaryV511(),
        loadKerrInstrumentAuthorityMatrixSummaryV511(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/atlas/relativity-evidence/v511/instrument-authority-matrix",
        { cache: "no-store" },
      );
      expect(getKerrInstrumentAuthorityMatrixSnapshotV511()).toMatchObject({
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

  it("fails closed on oversized responses", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "Content-Length": String(129 * 1024) } }),
    ) as typeof fetch;
    await expect(loadKerrInstrumentAuthorityMatrixSummaryV511()).rejects.toThrow(
      "response-too-large",
    );
    expect(getKerrInstrumentAuthorityMatrixSnapshotV511()).toMatchObject({
      status: "unavailable",
      reason: "response-too-large",
      requestCount: 1,
    });
  });
});
