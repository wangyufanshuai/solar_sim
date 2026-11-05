import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrPolarimeterDetectorLikelihoodSummaryV415 } from "./kerrPolarimeterDetectorLikelihoodV415";
import {
  getKerrPolarimeterDetectorLikelihoodSnapshotV415,
  loadKerrPolarimeterDetectorLikelihoodSummaryV415,
  resetKerrPolarimeterDetectorLikelihoodClientForTestsV415,
} from "./kerrPolarimeterDetectorLikelihoodClientV415";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrPolarimeterDetectorLikelihoodClientForTestsV415();
});

describe("v415 detector likelihood client", () => {
  it("single-flights a bounded likelihood summary", async () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/kerr-polarimeter-detector-likelihood-v415/noise-likelihood.json", "utf8"),
    );
    const summary = createKerrPolarimeterDetectorLikelihoodSummaryV415(artifact);
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          version: "v415-kerr-polarimeter-detector-noise-likelihood-response-v1",
          available: true,
          reason: "ready",
          summary,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrPolarimeterDetectorLikelihoodSummaryV415();
    const second = loadKerrPolarimeterDetectorLikelihoodSummaryV415();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrPolarimeterDetectorLikelihoodSnapshotV415()).toMatchObject({
      status: "ready",
      requestCount: 1,
      summary: {
        likelihoodRowCount: 16,
        exactSourcePoissonIntegerAvailable: false,
        measuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      },
    });
  });
});
