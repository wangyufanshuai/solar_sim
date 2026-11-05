import { describe, expect, it } from "vitest";
import {
  ATLAS_WORKBENCH_ACCESSIBILITY_VERSION,
  ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES,
  createAtlasWorkbenchAccessibilitySummary,
} from "./atlasWorkbenchAccessibility";

describe("Atlas Workbench Accessibility v41", () => {
  it("creates deterministic scoped accessibility metadata", () => {
    const first = createAtlasWorkbenchAccessibilitySummary();
    const second = createAtlasWorkbenchAccessibilitySummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_WORKBENCH_ACCESSIBILITY_VERSION);
    expect(first.status).toBe("informational");
    expect(first.scope).toBe("atlas-workbench-and-entry-controls");
    expect(first.standardTarget).toBe("wcag-2.2-aa-target");
    expect(first.minimumTargetSizePx).toBe(24);
    expect(first.surfaceCount).toBe(9);
    expect(first.surfaces).toEqual(ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES);
    expect(first.surfaces).toEqual([
      "navigator",
      "atlas-workflows",
      "relativity-observables",
      "kerr-relativity-studio",
      "evidence-ledger",
      "validation-console",
      "report-studio",
      "mission-hub",
      "observatory-deck",
    ]);
  });

  it("keeps local metadata away from runtime audit, certification, online, and physics claims", () => {
    const summary = createAtlasWorkbenchAccessibilitySummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.runtimeAuditStatus).toBe("not-claimed-in-app");
    expect(summary.trustedBoundary).toContain("does not report runtime scan results");
    expect(summary.trustedBoundary).toContain("CI status");
    expect(summary.trustedBoundary).toContain("external conformance certification");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("scan passed");
  });
});
