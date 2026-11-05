import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getKerrDimensionlessPhotonAtlasSnapshotV487,
  loadKerrDimensionlessPhotonAtlasSummaryV487,
  resetKerrDimensionlessPhotonAtlasClientForTestsV487,
} from "./kerrDimensionlessPhotonAtlasClientV487";
import {
  KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
  createKerrDimensionlessPhotonAtlasSummaryV487,
} from "./kerrDimensionlessPhotonAtlasV487";

afterEach(() => {
  resetKerrDimensionlessPhotonAtlasClientForTestsV487();
  vi.unstubAllGlobals();
});

describe("v487 dimensionless photon atlas client", () => {
  it("does not request before explicit load and single-flights after intent", async () => {
    const artifact = JSON.parse(
      readFileSync("dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json", "utf8"),
    );
    const summary = createKerrDimensionlessPhotonAtlasSummaryV487(artifact);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      version: KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
      available: true,
      reason: "ready",
      summary,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(getKerrDimensionlessPhotonAtlasSnapshotV487().requestCount).toBe(0);
    const first = loadKerrDimensionlessPhotonAtlasSummaryV487();
    const second = loadKerrDimensionlessPhotonAtlasSummaryV487();
    expect(first).toBe(second);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrDimensionlessPhotonAtlasSnapshotV487()).toMatchObject({
      status: "ready",
      requestCount: 1,
    });
  });
});
