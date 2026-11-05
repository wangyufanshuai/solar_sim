import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isAtlasShadowCapabilityPointerV418 } from "./atlasShadowCapabilityPointerV418";

describe("v418 local-shadow pointer", () => {
  it("keeps a four-row diagnostic table separate from unavailable image authority", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v418.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV418(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({
      v418SparseDiagnosticProduct: "qualified-four-ray-authority-table",
      v418FitsBinaryTable: "available-not-image-HDU",
      v418FitsImage: "unavailable-dense-and-screen-coordinate-boundary",
      v418ScienceImageMap: "unavailable-dense-and-screen-coordinate-boundary",
      v418MeasuredPolarization: "unavailable",
      v314CorrectedDense: "incomplete-0-of-49",
    });
  });
});
