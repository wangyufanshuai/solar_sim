import { describe, expect, it } from "vitest";
import {
  loadKerrSpectralCorrelationResponseV354,
  resetKerrSpectralCorrelationResponseServerV354CacheForTests,
} from "./kerrSpectralCorrelationResponseServerV354";

describe("v354 spectral-correlation server", () => {
  it("serves a bounded positive-definite synthetic covariance artifact", async () => {
    resetKerrSpectralCorrelationResponseServerV354CacheForTests();
    expect(await loadKerrSpectralCorrelationResponseV354()).toMatchObject({
      status: "qualified-synthetic-correlated-spectral-response-audit",
      counts: { rayCount: 4, coefficientCount: 9, perturbationExecutions: 72 },
      fullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance",
    });
  });
});
