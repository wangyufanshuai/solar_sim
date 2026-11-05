import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV407 } from "./atlasShadowCapabilityPointerV407";

describe("v407 local-shadow pointer", () => {
  it("advances only the sparse scattering approximation while exact tables, dense and heavy gates remain closed", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v407.json", "utf8"));
    expect(parseAtlasShadowCapabilityPointerV407(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({ v407LocalEmissionAngle: "qualified-4-disk-rays-no-observer-or-screen-substitution", v407ScatteringAtmosphere: "qualified-closed-form-approximation-boundary-only", v407ExactHFunctionAccuracy: "not-qualified", v407StokesTransfer: "qualified-24-angle-dependent-samples", v407BrowserQualification: "not-run", v407VisualMatrix: "not-run", v407Soak: "not-run", v407RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
