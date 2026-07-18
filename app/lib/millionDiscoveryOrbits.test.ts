import { describe, expect, it } from "vitest";
import { createOrbitDisplayDocumentV3, MILLION_STAR_DISCOVERY_CAPABILITY_V3 } from "./orbitDirectorV3";

describe("v163 million-star discovery and orbit director", () => {
  it("keeps catalog scale independent from the frozen render budget", () => {
    expect(MILLION_STAR_DISCOVERY_CAPABILITY_V3.focusableCatalogObjects).toBe(1_224_219);
    expect(MILLION_STAR_DISCOVERY_CAPABILITY_V3.parameterRichObjects).toBe(218_617);
    expect(MILLION_STAR_DISCOVERY_CAPABILITY_V3.visibleRenderBudget).toEqual([1000, 1800, 3000]);
  });

  it("gives selected and major orbits priority without inventing stellar orbits", () => {
    const selected = createOrbitDisplayDocumentV3({ objectId: "earth", selectedObjectId: "earth", major: true, inspectActive: true, closeupActive: false });
    const context = createOrbitDisplayDocumentV3({ objectId: "asteroid", selectedObjectId: "earth", major: false, inspectActive: true, closeupActive: false });
    expect(selected.priority).toBe("selected");
    expect(selected.opacityScale).toBeGreaterThan(context.opacityScale);
    expect(MILLION_STAR_DISCOVERY_CAPABILITY_V3.stellarOrbitPolicy).toContain("no-fabricated");
  });
});
