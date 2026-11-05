import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV522.tsx",
  "utf8",
);

describe("v522 twenty-four-detail sensitivity observatory", () => {
  it("adds frequency sensitivity as the twenty-fourth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(25);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV522>("none")');
    expect(source).toContain(
      '"frequency-sensitivity": lazy(() => import("./KerrPolarizationFrequencySensitivityV522"))',
    );
  });

  it("keeps requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v522-static-network-budget="0"');
    expect(source).toContain('data-atlas-v522-sensitivity-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v522-canvas-created="false"');
    expect(source).toContain('data-atlas-v522-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v522-physics-mutation="false"');
    expect(source).not.toContain("�");
  });
});
