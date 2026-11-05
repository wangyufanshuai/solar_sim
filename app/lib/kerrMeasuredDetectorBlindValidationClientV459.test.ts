import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrMeasuredDetectorBlindValidationSummaryV459 } from "./kerrMeasuredDetectorBlindValidationV459";
import {
  getKerrMeasuredDetectorBlindValidationSnapshotV459,
  loadKerrMeasuredDetectorBlindValidationSummaryV459,
  resetKerrMeasuredDetectorBlindValidationClientForTestsV459,
} from "./kerrMeasuredDetectorBlindValidationClientV459";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrMeasuredDetectorBlindValidationClientForTestsV459();
});

describe("v459 blind validation client", () => {
  it("single-flights a no-store summary", async () => {
    const summary = createKerrMeasuredDetectorBlindValidationSummaryV459(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v459-kerr-measured-detector-blind-validation-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrMeasuredDetectorBlindValidationSummaryV459();
    expect(loadKerrMeasuredDetectorBlindValidationSummaryV459()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrMeasuredDetectorBlindValidationSnapshotV459()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: { inspect: { authorityGranted: false } },
    });
  });
});
