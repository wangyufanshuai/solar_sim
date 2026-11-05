import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isAtlasShadowCapabilityPointerV419 } from "./atlasShadowCapabilityPointerV419";

describe("v419 local-shadow pointer", () => {
  it("qualifies sparse screen coordinates without promoting a pixel or dense image", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v419.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV419(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({
      v419ScreenCoordinates: "qualified-four-canonical-rays",
      v419ProjectionReplay: "qualified-local-tetrad-BL-KS",
      v419PixelWcs: "unavailable",
      v419FitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS",
      v419DensePolarimetricImage: "unavailable-campaign-incomplete-0-of-49",
      v314CorrectedDense: "incomplete-0-of-49",
    });
  });
});
