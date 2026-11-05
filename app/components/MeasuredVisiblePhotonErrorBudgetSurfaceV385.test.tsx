import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v385 visible photon error budget surface", () => {
  it("separates quantified numerical bounds from unavailable systematics", () => {
    const source = readFileSync(
      "app/components/MeasuredVisiblePhotonErrorBudgetSurfaceV385.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v385/visible-photon-error-budget",
    );
    expect(source).toContain("Small numerics do not erase unknown physics.");
    expect(source).toContain('data-atlas-v385-computational-budget="true"');
    expect(source).toContain('data-atlas-v385-scientific-budget="false"');
    expect(source).toContain('data-atlas-v385-rss="false"');
    expect(source).toContain('data-atlas-v385-unknown-as-zero="false"');
    expect(source).toContain('data-atlas-v385-measured-authority="false"');
    expect(source).toContain('data-atlas-v385-observed-counts="false"');
    expect(source).toContain('data-atlas-v385-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<MeasuredVisiblePhotonErrorBudgetSurfaceV385 />",
    );
  });
});
