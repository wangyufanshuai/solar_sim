import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrWcsProjectionSummaryV441 } from "./kerrWcsProjectionAvailabilityV441";
import {
  getKerrWcsProjectionSnapshotV441,
  loadKerrWcsProjectionSummaryV441,
  resetKerrWcsProjectionClientForTestsV441,
} from "./kerrWcsProjectionAvailabilityClientV441";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrWcsProjectionClientForTestsV441();
});

describe("v441 WCS projection client", () => {
  it("single-flights bounded projection metadata", async () => {
    const summary = createKerrWcsProjectionSummaryV441(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-oracle.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v441-kerr-wcs-projection-availability-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrWcsProjectionSummaryV441();
    expect(loadKerrWcsProjectionSummaryV441()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrWcsProjectionSnapshotV441()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: { boundary: { wcsCoordinateAuthority: true, detectorProjectionBlocked: true } },
    });
  });
});
