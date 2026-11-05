import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createKerrDetectorExpectedImageSummaryV450,
} from "./kerrDetectorExpectedImageFormationV450";
import {
  getKerrDetectorExpectedImageSnapshotV450,
  loadKerrDetectorExpectedImageSummaryV450,
  resetKerrDetectorExpectedImageClientForTestsV450,
} from "./kerrDetectorExpectedImageFormationClientV450";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrDetectorExpectedImageClientForTestsV450();
});

describe("v450 expected image client", () => {
  it("single-flights one bounded local-shadow summary request", async () => {
    const summary = createKerrDetectorExpectedImageSummaryV450(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v450-kerr-detector-expected-image-formation-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrDetectorExpectedImageSummaryV450();
    expect(loadKerrDetectorExpectedImageSummaryV450()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrDetectorExpectedImageSnapshotV450()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: {
        counts: { sourceRowCount: 4, sparseDepositRowCount: 16 },
      },
    });
  });
});
