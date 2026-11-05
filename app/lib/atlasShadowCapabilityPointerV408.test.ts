import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV408 } from "./atlasShadowCapabilityPointerV408";

describe("v408 local-shadow pointer", () => {
  it("advances only the independent scattering envelope while exact tables, endpoints, dense and heavy gates remain closed", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v408.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV408(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({
      v408NumericalOracle: "qualified-independent-discrete-ordinates-reference-envelope",
      v408FourRayErrorEnvelope: "qualified-v407-underestimates-6.77-to-9.02-percent",
      v408FullCurveSign: "mixed-146-underestimate-35-overestimate",
      v408ExactHFunctionTable: "not-qualified",
      v408Endpoints: "not-qualified-mu-0-and-1",
      v408BrowserQualification: "not-run",
      v314CorrectedDense: "incomplete-0-of-49",
      denseAggregate: "unavailable",
    });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
