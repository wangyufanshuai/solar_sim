import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseAtlasShadowCapabilityPointerV417 } from "./atlasShadowCapabilityPointerV417";

describe("v417 local-shadow pointer", () => {
  it("qualifies nonlinear fixture coverage while measured polarization remains unavailable", () => {
    const pointer = JSON.parse(
      readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v417.json", "utf8"),
    );
    expect(parseAtlasShadowCapabilityPointerV417(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({
      v416StokesEnsemble: "qualified-streaming-fixture-only",
      v417LinearPolarizationFraction: "qualified-nonlinear-coverage-fixture-only",
      v417CircularPolarizationFraction: "qualified-signed-coverage-fixture-only",
      v417Evpa: "qualified-axial-pi-period-coverage-fixture-only",
      v417PhysicalStokesCone: "qualified-zero-violations",
      v417ObservedPolarization: "unavailable",
      v417MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      v417BrowserQualification: "not-run",
      v314CorrectedDense: "incomplete-0-of-49",
    });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
