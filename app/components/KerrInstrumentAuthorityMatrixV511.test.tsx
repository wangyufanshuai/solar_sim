import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrInstrumentAuthorityMatrixV511.tsx",
  "utf8",
);

describe("v511 instrument authority matrix surface", () => {
  it("loads once only after the explicit lazy detail is mounted", () => {
    expect(source).toContain("loadKerrInstrumentAuthorityMatrixSummaryV511");
    expect(source).toContain('data-atlas-v511-request-budget-after-explicit-detail="1"');
    expect(source).toContain('data-atlas-v511-solar-first-screen-request-count="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("renders six authority stages and the null-not-zero boundary", () => {
    expect(source).toContain('data-atlas-v511-stage-count="6"');
    expect(source).toContain("summary.stages.map");
    expect(source).toContain("summary.transitions.map");
    expect(source).toContain("null，而不是用零或电影效果填补");
    expect(source).toContain("response exactly once");
    expect(source).toContain("gain after electrons");
  });

  it("forbids detector authority, observed counts, raster, and scene mutations", () => {
    expect(source).toContain('data-atlas-v511-detector-authority="false"');
    expect(source).toContain('data-atlas-v511-observed-counts="false"');
    expect(source).toContain('data-atlas-v511-science-raster="false"');
    expect(source).toContain('data-atlas-v511-scientific-field-mutation="false"');
    expect(source).toContain('data-atlas-v511-canvas-created="false"');
    expect(source).toContain('data-atlas-v511-scene-revision-delta="0"');
  });
});
