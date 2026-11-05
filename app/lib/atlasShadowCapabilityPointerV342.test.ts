import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV342 } from "./atlasShadowCapabilityPointerV342";
describe("v342 pointer", () => {
  it("keeps the raster sparse and formal product unchanged", () => {
    const pointer = parseAtlasShadowCapabilityPointerV342(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v342.json"), "utf8")));
    expect(pointer.formalProductPointer).toBe("v263");
    expect(pointer.localShadowDefaultApplied).toBe(false);
    expect(pointer.capabilities.v342ObservationRaster).toBe("four-by-three-fixed-linear-sparse-raster");
    expect(pointer.capabilities.v314CorrectedDense).toBe("incomplete-0-of-49");
  });
});
