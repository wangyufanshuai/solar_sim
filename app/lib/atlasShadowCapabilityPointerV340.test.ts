import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV340 } from "./atlasShadowCapabilityPointerV340";

describe("v340 local-shadow capability pointer", () => {
  it("records V7 as a manual visual candidate without product or Science promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v340.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV340(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v340RuntimeMatrix: "v5-v6-v7-eight-groups-twenty-four-consumption-rows", v340ScienceBoundary: "linear-exposure-one-bloom-zero-noise-zero-profile-invariant", v340DefaultBoundary: "manual-local-shadow-only-default-legacy-v9", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
  });
});
