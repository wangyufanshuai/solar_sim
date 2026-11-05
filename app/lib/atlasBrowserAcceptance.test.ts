import { describe, expect, it } from "vitest";
import {
  ATLAS_BROWSER_ACCEPTANCE_VERSION,
  createAtlasBrowserAcceptanceSummary,
} from "./atlasBrowserAcceptance";

describe("Atlas Browser Acceptance Harness v38", () => {
  it("creates deterministic local harness metadata without runtime result claims", () => {
    const first = createAtlasBrowserAcceptanceSummary();
    const second = createAtlasBrowserAcceptanceSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_BROWSER_ACCEPTANCE_VERSION);
    expect(first.status).toBe("informational");
    expect(first.command).toBe("npm run test:atlas:browser");
    expect(first.fullGateCommand).toBe("npm run verify:atlas:full");
    expect(first.browser).toBe("system-chrome");
    expect(first.runtimeCommandStatus).toBe("not-claimed-in-app");
    expect(first.viewports.map((viewport) => viewport.id)).toEqual([
      "desktop-chrome-1440x900",
      "mobile-chrome-390x844",
    ]);
    expect(first.checkedContracts).toEqual(
      expect.arrayContaining([
        expect.stringContaining("v36 release-gate"),
        expect.stringContaining("v37 Relativity Observable Atlas"),
        expect.stringContaining("v39 Relativity Observable Explainer"),
        expect.stringContaining("v40 Relativity Guided Tour"),
        expect.stringContaining("v41 Accessible Atlas Workbench"),
        expect.stringContaining("v42 Cinematic Scientific Workbench"),
        expect.stringContaining("v43 Planetary Visual Fidelity"),
        expect.stringContaining("v44 Cinematic Lighting Composition"),
        expect.stringContaining("v35 Kerr Relativity Studio"),
      ]),
    );
  });

  it("keeps the runtime boundary away from CI, online validation and physics mutation claims", () => {
    const summary = createAtlasBrowserAcceptanceSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.trustedBoundary).toContain("does not claim the latest command result");
    expect(summary.trustedBoundary).toContain("CI certification");
    expect(summary.trustedBoundary).toContain("online validation");
    expect(summary.trustedBoundary).toContain("physics mutation");
    expect(serialized).not.toContain("passed");
    expect(serialized).not.toContain("failed command");
    expect(serialized).not.toContain("ci certified");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
  });
});
