import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV427 } from "./atlasShadowCapabilityPointerV427";

describe("v427 local-shadow pointer", () => {
  it("qualifies only the empty acquisition pack and validator", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v427.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV427(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v426ResponseContract: "qualified-preserved", v427AcquisitionPack: "qualified-nine-files", v427MeasurementTemplates: "qualified-seven-empty-zero-rows", v427InvalidFixtureMutations: "rejected-12-of-12", v427MeasuredResponseAuthority: "unavailable", v427ScienceResponseApplications: "zero", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
