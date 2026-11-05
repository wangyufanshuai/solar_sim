import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isAtlasShadowCapabilityPointerV421 } from "./atlasShadowCapabilityPointerV421";

describe("v421 local-shadow pointer", () => {
  it("qualifies corrected axial vectors while withdrawing only prior PNG display orientation", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v421.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV421(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({
      v419NumericalCoordinates: "qualified-preserved",
      v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
      v420NumericalWcs: "qualified-preserved",
      v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch",
      v421EvpaConvention: "qualified-zero-plus-beta-positive-toward-plus-alpha",
      v421HistoricalFilesOverwritten: false,
      v421Intensity: "unavailable",
      v421StokesAmplitude: "unavailable",
      v314CorrectedDense: "incomplete-0-of-49",
    });
  });
});
