import { describe, expect, it } from "vitest";
import { loadDetectorResponseAuthoritySnapshotV368, resetDetectorResponseAuthorityServerV368CacheForTests } from "./detectorResponseAuthorityServerV368";

describe("v368 measured response server", () => {
  it("caches the current unavailable snapshot without reading synthetic v332 as measured", async () => {
    resetDetectorResponseAuthorityServerV368CacheForTests();
    const first = await loadDetectorResponseAuthoritySnapshotV368();
    const second = await loadDetectorResponseAuthoritySnapshotV368();
    expect(first).toBe(second);
    expect(first).toMatchObject({ status: "unavailable-v367-authority-artifacts-missing", reason: "authority-chain-artifacts-missing", admissionArtifactPresent: false, authorityPointerPresent: false, manifestPresent: false, authorityGranted: false, measuredResponseAvailable: false, bandResponseCount: 0, syntheticFallbackUsed: false, syntheticV332Status: "separate-qualified-fixture-never-measured-fallback" });
  });
});
