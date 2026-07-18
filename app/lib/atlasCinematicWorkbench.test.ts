import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_WORKBENCH_VERSION,
  createAtlasCinematicWorkbenchSummary,
} from "./atlasCinematicWorkbench";

describe("Atlas Cinematic Scientific Workbench v42", () => {
  it("creates deterministic local art-direction metadata", () => {
    const first = createAtlasCinematicWorkbenchSummary();
    const second = createAtlasCinematicWorkbenchSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_CINEMATIC_WORKBENCH_VERSION);
    expect(first.status).toBe("informational");
    expect(first.visualTarget).toBe("scientific-instrument-cinematic");
    expect(first.qualityTarget).toBe("aaa-inspired-local-art-direction");
    expect(first.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(first.scenePolicy).toBe("existing-assets-only");
  });

  it("keeps visual metadata away from certification, online, and physics claims", () => {
    const summary = createAtlasCinematicWorkbenchSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("preserves the v41 AA workbench boundary");
    expect(summary.trustedBoundary).toContain("does not claim runtime certification");
    expect(summary.trustedBoundary).toContain("scientific certification");
    expect(summary.trustedBoundary).toContain("WCAG certification");
    expect(summary.trustedBoundary).toContain("online validation");
    expect(summary.trustedBoundary).toContain("physics mutation");
    expect(serialized).not.toContain("certified");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
  });
});
