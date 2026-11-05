import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isAtlasShadowCapabilityPointerV420 } from "./atlasShadowCapabilityPointerV420";

describe("v420 local-shadow pointer", () => {
  it("qualifies coordinate WCS while refusing raster and interpolation promotion", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v420.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV420(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v420LinearWcs: "qualified-384x384-FITS-continuous", v420SparseSourceCatalog: "qualified-four-coordinate-records-no-values", v420Interpolation: "prohibited", v420RasterValues: "unavailable", v420FitsImage: "unavailable-no-raster-science-values", v420PolarimetricRaster: "unavailable-dense-campaign-incomplete-0-of-49", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
