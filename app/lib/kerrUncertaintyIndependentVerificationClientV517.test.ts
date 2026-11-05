import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "./atlasResourceLifecycle";
import {
  getKerrUncertaintyIndependentVerificationSnapshotV517,
  loadKerrUncertaintyIndependentVerificationSummaryV517,
  resetKerrUncertaintyIndependentVerificationClientForTestsV517,
  subscribeKerrUncertaintyIndependentVerificationV517,
} from "./kerrUncertaintyIndependentVerificationClientV517";
import { createKerrUncertaintyIndependentVerificationSummaryV517 } from "./kerrUncertaintyIndependentVerificationV517";

const originalFetch = globalThis.fetch;
const receipt = JSON.parse(
  readFileSync(
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
    "utf8",
  ),
);

beforeEach(() => resetKerrUncertaintyIndependentVerificationClientForTestsV517());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrUncertaintyIndependentVerificationClientForTestsV517();
  vi.restoreAllMocks();
});

describe("v517 independent verification client", () => {
  it("single-flights two consumers and releases both subscriptions", async () => {
    const summary = createKerrUncertaintyIndependentVerificationSummaryV517(receipt);
    const body = JSON.stringify({
      version: "v517-kerr-uncertainty-independent-verification-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrUncertaintyIndependentVerificationV517(() => undefined),
      subscribeKerrUncertaintyIndependentVerificationV517(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrUncertaintyIndependentVerificationSummaryV517(),
        loadKerrUncertaintyIndependentVerificationSummaryV517(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrUncertaintyIndependentVerificationSnapshotV517()).toMatchObject({
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
    await expect(loadKerrUncertaintyIndependentVerificationSummaryV517()).rejects.toThrow(
      "response-too-large",
    );
  });
});
