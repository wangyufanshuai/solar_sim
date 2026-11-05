import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrPolarimeterStokesEnsembleSummaryV416 } from "./kerrPolarimeterStokesEnsembleV416";
import {
  getKerrPolarimeterStokesEnsembleSnapshotV416,
  loadKerrPolarimeterStokesEnsembleSummaryV416,
  resetKerrPolarimeterStokesEnsembleClientForTestsV416,
} from "./kerrPolarimeterStokesEnsembleClientV416";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrPolarimeterStokesEnsembleClientForTestsV416();
});

describe("v416 Stokes ensemble client", () => {
  it("single-flights a bounded coverage summary", async () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/kerr-polarimeter-stokes-ensemble-v416/stokes-ensemble.json", "utf8"),
    );
    const summary = createKerrPolarimeterStokesEnsembleSummaryV416(artifact);
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v416-kerr-polarimeter-stokes-ensemble-response-v1",
          available: true,
          reason: "ready",
          summary,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrPolarimeterStokesEnsembleSummaryV416();
    const second = loadKerrPolarimeterStokesEnsembleSummaryV416();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrPolarimeterStokesEnsembleSnapshotV416()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: {
        totalTrialCount: 16384,
        retainedTrialCount: 4,
        measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      },
    });
  });
});
