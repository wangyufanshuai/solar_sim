import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV411 } from "./atlasShadowCapabilityPointerV411";

describe("v411 local-shadow pointer", () => {
  it("qualifies the calibration schema while measured authority and heavy gates remain closed", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v411.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV411(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({ v411CalibrationSchema: "qualified-11-input-contract-4x4-response-16x16-covariance", v411Compiler: "ready-no-input-compiled", v411MeasuredManifest: "unavailable", v411Admission: "blocked-input-unavailable", v411MeasuredPolarimeterAuthority: "not-qualified", v411BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49" });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
