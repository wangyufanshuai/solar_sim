import { describe, expect, it } from "vitest";
import { validateAtlasShadowCapabilityPointerV296, type AtlasShadowCapabilityPointerV296 } from "./atlasShadowCapabilityPointerV296";

describe("v296 capability pointer", () => {
  it("separates geometry qualification from polarization and promotion", () => {
    const pointer: AtlasShadowCapabilityPointerV296 = {
      version: "orbit-atlas-current-local-shadow-candidate-v296",
      status: "geometry-redshift-qualified-polarization-and-heavy-qualification-pending",
      capabilities: { v282: "identity-cache-partial-1-of-9", v288: "failed-preserved", v291: "diagnostics-failed-preserved", v292: "geometry-redshift-failed-preserved", v293: "blocked-by-v292-preserved", v296: "geometry-redshift-qualified", polarization: "pending-v297", campaign: "incomplete-0-of-49", browserQualification: "not-run" },
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      pointerSha256: "a".repeat(64),
    };
    expect(validateAtlasShadowCapabilityPointerV296(pointer)).toBe(true);
  });
});
