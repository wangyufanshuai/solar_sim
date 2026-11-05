import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrDetectorInputAdmissionSummaryV451 } from "./kerrDetectorInputAdmissionV451";
import {
  getKerrDetectorInputAdmissionSnapshotV451,
  loadKerrDetectorInputAdmissionSummaryV451,
  resetKerrDetectorInputAdmissionClientForTestsV451,
} from "./kerrDetectorInputAdmissionClientV451";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrDetectorInputAdmissionClientForTestsV451();
});

describe("v451 detector admission client", () => {
  it("single-flights the local-shadow summary request", async () => {
    const summary = createKerrDetectorInputAdmissionSummaryV451(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
          "utf8",
        ),
      ),
    );
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v451-kerr-detector-input-admission-api-v1",
          available: true,
          reason: "ready",
          summary,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrDetectorInputAdmissionSummaryV451();
    expect(loadKerrDetectorInputAdmissionSummaryV451()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrDetectorInputAdmissionSnapshotV451()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: { status: "blocked-v443-detector-inputs-missing" },
    });
  });
});
