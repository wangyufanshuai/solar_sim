import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV314 } from "./atlasShadowCapabilityPointerV314";
describe("v314 capability pointer", () => {
  it("keeps the corrected campaign initialized but unauthorized", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v314.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV314(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { fullKerrShortAuthority: "qualified-v312-v313-envelope", v314CorrectedDense: "incomplete-0-of-49", runNext: "implemented-disabled-awaiting-explicit-authorization", denseAggregate: "unavailable", browserQualification: "not-run" } });
  });
});
