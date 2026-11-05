import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v592 visual-QA module boundary", () => {
  it("requires an explicit opt-in and reuses the read-only release boundary", () => {
    const config = readFileSync("next.config.mjs", "utf8");
    const boundary = readFileSync(
      "app/components/RelativityResearchWorkbenchReleaseBoundaryV564.tsx",
      "utf8",
    );

    expect(config).toContain(
      'const visualQaOnly = process.env.ATLAS_VISUAL_QA_ONLY?.trim() === "1";',
    );
    expect(config).toContain(
      'visualQaOnly || (!dev && deliveryProfile !== "local-shadow"',
    );
    expect(config).toContain("RelativityResearchWorkbenchReleaseBoundaryV564.tsx");
    expect(boundary).toContain('data-atlas-v564-science-payload-writeback="false"');
    expect(boundary).toContain('data-atlas-v564-canvas-created="false"');
  });
});
