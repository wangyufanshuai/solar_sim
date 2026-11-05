import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV431 } from "./atlasShadowCapabilityPointerV431";

describe("v431 local-shadow pointer", () => {
  it("qualifies stress discrimination without alternative-likelihood or measured authority", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v431.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV431(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v430CountLikelihoodMath: "qualified-preserved", v431SyntheticStressGeneration: "qualified", v431NominalPoissonRecovery: "qualified", v431OverdispersionDiscriminator: "qualified", v431PreregisteredRoutingFirewall: "qualified", v431AlternativeLikelihoodImplementations: "zero-qualified", v431MeasuredObservedCounts: "zero", v431MeasuredValidationRuns: "zero", v431MeasuredInstrumentAuthority: "unavailable", v431ScienceResponseApplications: "zero", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
