import { describe, expect, it } from "vitest";
import { loadKerrScienceBandObservationV350, resetKerrScienceBandObservationServerV350CacheForTests } from "./kerrScienceBandObservationServerV350";

describe("v350 observation artifact server", () => {
  it("verifies the source chain before exposing the read-only layer", async () => {
    resetKerrScienceBandObservationServerV350CacheForTests();
    const artifact = await loadKerrScienceBandObservationV350();
    expect(artifact).toMatchObject({ status: "qualified-read-only-band-observation-provenance", source: { bandContrastArtifactSha256: expect.stringMatching(/^[a-f0-9]{64}$/), instrumentArtifactSha256: expect.stringMatching(/^[a-f0-9]{64}$/) }, counts: { rowCount: 12 }, denseCampaignStatus: "incomplete-0-of-49" });
  });
});
