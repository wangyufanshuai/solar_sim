import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrScienceProductEligibilityGraphV512.tsx",
  "utf8",
);

describe("v512 science product eligibility surface", () => {
  it("loads only after explicit lazy detail intent and creates no Canvas", () => {
    expect(source).toContain("loadKerrScienceProductEligibilityGraphSummaryV512");
    expect(source).toContain('data-atlas-v512-request-budget-after-explicit-detail="1"');
    expect(source).toContain('data-atlas-v512-solar-first-screen-request-count="0"');
    expect(source).toContain('data-atlas-v512-canvas-created="false"');
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
  });

  it("renders ten nodes and six product dispositions", () => {
    expect(source).toContain('data-atlas-v512-node-count="10"');
    expect(source).toContain('data-atlas-v512-product-count="6"');
    expect(source).toContain("summary.nodes.map");
    expect(source).toContain("summary.products.map");
    expect(source).toContain("坐标可以成为证据，缺失的像素不能成为图像");
  });

  it("preserves V7 Science/Cinematic and product boundaries", () => {
    expect(source).toContain("resolveAtlasScienceCinematicV7V457(mode.mode)");
    expect(source).toContain('data-atlas-v512-detector-image-authority="false"');
    expect(source).toContain('data-atlas-v512-fits-write="false"');
    expect(source).toContain('data-atlas-v512-png-write="false"');
    expect(source).toContain('data-atlas-v512-scientific-field-mutation="false"');
    expect(source).toContain('data-atlas-v512-scene-revision-delta="0"');
  });
});
