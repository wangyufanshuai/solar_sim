import { describe, expect, it } from "vitest";
import { createAtlasScientificDataProgramV153Summary } from "./atlasScientificDataProgramV153";

describe("v147-v153 scientific data release train", () => {
  it("keeps runtime offline and V2 fail-closed", () => {
    const summary = createAtlasScientificDataProgramV153Summary();
    expect(summary.catalogVersion).toContain("v148");
    expect(summary.evidenceVersion).toContain("v150");
    expect(summary.visualFidelityVersion).toContain("v152");
    expect(summary.defaultScientificKernel).toBe("legacy-eih-1pn");
    expect(summary.promotionPolicy).toContain("fail-closed");
    expect(summary.boundary).toContain("v75");
  });
});
