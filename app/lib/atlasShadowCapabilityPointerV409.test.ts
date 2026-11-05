import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV409 } from "./atlasShadowCapabilityPointerV409";
describe("v409 local-shadow pointer", () => {
  it("qualifies only the 24-sample correction while interpolation, exact tables, dense and heavy gates stay closed", () => { const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v409.json", "utf8")); expect(parseAtlasShadowCapabilityPointerV409(pointer)).toBe(pointer); expect(pointer.capabilities).toMatchObject({ v409CorrectedStokesPayload: "qualified-24-samples-4-rays-3-bands-2-transports", v409CorrectionMagnitude: "qualified-plus-7.26-to-9.91-percent", v409CurveInterpolation: "not-applied", v409ExactHFunctionTable: "not-qualified", v409DenseImage: "not-qualified", v409BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49" }); expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false }); });
});
