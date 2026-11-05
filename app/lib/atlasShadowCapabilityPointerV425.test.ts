import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV425 } from "./atlasShadowCapabilityPointerV425";

describe("v425 local-shadow pointer", () => {
  it("qualifies the spectral firewall without granting an extrapolated instrument response", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v425.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV425(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v425SpectralApplicabilityAudit: "qualified", v425V413DomainOverlap: "none", v425ResponseEligibleSources: "zero-of-24", v425BlockedOutOfDomainSources: "24-of-24", v425ResponseMatrixApplications: "zero", v425Extrapolation: "forbidden", v425NonidealInstrumentResponseAuthority: "unavailable", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
