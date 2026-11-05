import { describe, expect, it } from "vitest";
import {
  ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION,
  createAtlasPlanetaryVisualFidelitySummary,
} from "./atlasPlanetaryVisualFidelity";

describe("Atlas Planetary Visual Fidelity v43", () => {
  it("creates deterministic selected-body close-up metadata", () => {
    const first = createAtlasPlanetaryVisualFidelitySummary();
    const second = createAtlasPlanetaryVisualFidelitySummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION);
    expect(first.status).toBe("informational");
    expect(first.visualTarget).toBe("selected-body-closeup-realism");
    expect(first.styleTarget).toBe("restrained-scientific-instrument");
    expect(first.assetPolicy).toBe("network-prepared-local-runtime");
    expect(first.runtimeAssetSource).toBe("local-public-textures-only");
    expect(first.closeupPriority).toBe("major-selected-bodies");
    expect(first.skyCloseupProfile).toBe("closeup-deep-space-dimmed");
  });

  it("preserves accessibility, visual-system, certification, online, and physics boundaries", () => {
    const summary = createAtlasPlanetaryVisualFidelitySummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("network-prepared local textures at runtime");
    expect(summary.trustedBoundary).toContain("preserve the v41 AA workbench boundary");
    expect(summary.trustedBoundary).toContain("v42 cinematic boundary");
    expect(summary.trustedBoundary).toContain("online validation");
    expect(summary.trustedBoundary).toContain("online asset completeness");
    expect(summary.trustedBoundary).toContain("physics mutation");
    expect(serialized).not.toContain("certified");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("runtime command passed");
  });
});
