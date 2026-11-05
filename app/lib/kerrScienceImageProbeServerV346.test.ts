import { describe, expect, it } from "vitest";
import { loadKerrScienceImageProbeV346, resetKerrScienceImageProbeServerV346CacheForTests } from "./kerrScienceImageProbeServerV346";

describe("v346 science image probe server", () => {
  it("loads a SHA-locked bounded twelve-cell artifact", async () => {
    resetKerrScienceImageProbeServerV346CacheForTests();
    const artifact = await loadKerrScienceImageProbeV346();
    expect(artifact).toMatchObject({ status: "qualified-index-coordinate-probe", denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", indexCoordinates: { celestialWcsAvailable: false } });
    expect(artifact.cells).toHaveLength(12);
    expect(JSON.stringify(artifact)).not.toMatch(/(?:absolutePath|host|pid|peakRssGiB)/);
  });
});
