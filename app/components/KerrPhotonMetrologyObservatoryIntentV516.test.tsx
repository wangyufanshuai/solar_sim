import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV516.tsx",
  "utf8",
);

describe("v516 eighteen-detail witness observatory", () => {
  it("adds the witness chain as the eighteenth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(19);
    expect(source).toContain(
      'useState<KerrPhotonMetrologyDetailSurfaceV516>("none")',
    );
    expect(source).toContain(
      '"uncertainty-witness": lazy(() => import("./KerrUncertaintyReplayWitnessV516"))',
    );
  });

  it("keeps the witness request behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v516-static-network-budget="0"');
    expect(source).toContain('data-atlas-v516-witness-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps Canvas, scene revision and physics outside the detail surface", () => {
    expect(source).toContain("data-atlas-v516-witness-transition-count");
    expect(source).toContain('data-atlas-v516-canvas-created="false"');
    expect(source).toContain('data-atlas-v516-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v516-physics-mutation="false"');
  });
});
