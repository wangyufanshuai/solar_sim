import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v383 measured visible throughput surface", () => {
  it("renders bounded dual-path metrics without Canvas or authority promotion", () => {
    const source = readFileSync(
      "app/components/MeasuredVisibleThroughputSurfaceV383.tsx",
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
      "/api/atlas/relativity-evidence/v383/visible-throughput",
    );
    expect(source).toContain("Same photons. Independent arithmetic.");
    expect(source).toContain('data-atlas-v383-normalized-candidate="true"');
    expect(source).toContain('data-atlas-v383-authority="false"');
    expect(source).toContain('data-atlas-v383-observed-counts="false"');
    expect(source).toContain('data-atlas-v383-runtime-packaging="false"');
    expect(source).toContain('data-atlas-v383-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasuredVisibleThroughputSurfaceV383 />");
  });
});
