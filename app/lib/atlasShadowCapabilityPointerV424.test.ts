import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV424 } from "./atlasShadowCapabilityPointerV424";

describe("v424 local-shadow pointer", () => {
  it("qualifies ideal-model modulation without promoting measurement or detector authority", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v424.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV424(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({
      v424IdealHwpWollastonModulation: "qualified-96-rows",
      v424PredictedBeamSpectralRadiances: "qualified-192-values",
      v424FourAngleReconstruction: "qualified-24-reconstructions",
      v424MeasurementAuthority: "unavailable",
      v424PhotonElectronCounts: "unavailable",
      v424DetectorAuthority: "unavailable",
      v314CorrectedDense: "incomplete-0-of-49",
    });
  });
});
