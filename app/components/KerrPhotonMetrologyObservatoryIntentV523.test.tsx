import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV523.tsx",
  "utf8",
);

describe("v523 twenty-five-detail ideal analyzer observatory", () => {
  it("adds ideal analyzer sensitivity as the twenty-fifth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(26);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV523>("none")');
    expect(source).toContain(
      '"ideal-analyzer-sensitivity": lazy(() => import("./KerrIdealAnalyzerSensitivityV523"))',
    );
  });

  it("keeps requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v523-static-network-budget="0"');
    expect(source).toContain('data-atlas-v523-analyzer-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v523-canvas-created="false"');
    expect(source).toContain('data-atlas-v523-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v523-physics-mutation="false"');
    expect(source).not.toContain("�");
  });
});
