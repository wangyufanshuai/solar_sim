import { describe, expect, it } from "vitest";
import { loadKerrObserverFrameUncertaintyV351, resetKerrObserverFrameUncertaintyServerV351CacheForTests } from "./kerrObserverFrameUncertaintyServerV351";

describe("v351 observer-frame uncertainty server", () => {
  it("serves only a canonical compensated ledger", async () => {
    resetKerrObserverFrameUncertaintyServerV351CacheForTests(); const artifact = await loadKerrObserverFrameUncertaintyV351();
    expect(artifact).toMatchObject({ status: "qualified-componentwise-observer-frame-ledger", counts: { rowCount: 12, includedRelativeComponentCount: 4, excludedDiagnosticCount: 4 }, maxima: { envelopeReconstructionRelativeDifference: expect.any(Number) }, syntheticExpectationEnvelope: "unavailable-no-componentwise-photon-response-uncertainty-propagation" });
  });
});
