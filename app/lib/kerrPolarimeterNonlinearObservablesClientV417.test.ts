import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrPolarimeterNonlinearObservablesSummaryV417 } from "./kerrPolarimeterNonlinearObservablesV417";
import {
  getKerrPolarimeterNonlinearObservablesSnapshotV417,
  loadKerrPolarimeterNonlinearObservablesSummaryV417,
  resetKerrPolarimeterNonlinearObservablesClientForTestsV417,
} from "./kerrPolarimeterNonlinearObservablesClientV417";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrPolarimeterNonlinearObservablesClientForTestsV417();
});

describe("v417 nonlinear observables client", () => {
  it("single-flights a bounded polarization summary", async () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/kerr-polarimeter-nonlinear-observables-v417/nonlinear-observables.json", "utf8"),
    );
    const summary = createKerrPolarimeterNonlinearObservablesSummaryV417(artifact);
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v417-kerr-polarimeter-nonlinear-observables-response-v1",
          available: true,
          reason: "ready",
          summary,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrPolarimeterNonlinearObservablesSummaryV417();
    const second = loadKerrPolarimeterNonlinearObservablesSummaryV417();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrPolarimeterNonlinearObservablesSnapshotV417()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: {
        totalTrialCount: 32768,
        retainedTrialCount: 4,
        measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      },
    });
  });
});
