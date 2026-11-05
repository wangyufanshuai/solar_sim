import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrMeasuredDetectorIntakeSummaryV458 } from "./kerrMeasuredDetectorIntakeEnvelopeV458";
import {
  getKerrMeasuredDetectorIntakeSnapshotV458,
  loadKerrMeasuredDetectorIntakeSummaryV458,
  resetKerrMeasuredDetectorIntakeClientForTestsV458,
} from "./kerrMeasuredDetectorIntakeClientV458";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrMeasuredDetectorIntakeClientForTestsV458();
});

describe("v458 measured detector intake client", () => {
  it("single-flights one bounded no-store summary", async () => {
    const summary = createKerrMeasuredDetectorIntakeSummaryV458(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v458-kerr-measured-detector-intake-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrMeasuredDetectorIntakeSummaryV458();
    expect(loadKerrMeasuredDetectorIntakeSummaryV458()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrMeasuredDetectorIntakeSnapshotV458()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: { inspect: { readyFileCount: 0 } },
    });
  });
});
