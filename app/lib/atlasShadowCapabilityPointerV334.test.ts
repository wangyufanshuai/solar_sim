import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV334 } from "./atlasShadowCapabilityPointerV334";

describe("v334 local-shadow capability pointer", () => {
  it("records actual V5/V6 runtime consumption without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v334.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV334(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v334RuntimeMatrix: "v5-v6-eight-groups-sixteen-consumption-rows", v334ScienceEquivalence: "fields-equivalent-linear-no-grade-no-science-mutation", v314CorrectedDense: "incomplete-0-of-49" } });
  });
});
