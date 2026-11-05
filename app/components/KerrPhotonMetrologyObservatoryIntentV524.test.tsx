import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV524.tsx",
  "utf8",
);

describe("v524 twenty-six-detail identifiability observatory", () => {
  it("adds rank and nullspace as the twenty-sixth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(27);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV524>("none")');
    expect(source).toContain(
      '"analyzer-identifiability": lazy(() => import("./KerrAnalyzerIdentifiabilityV524"))',
    );
  });

  it("keeps requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v524-static-network-budget="0"');
    expect(source).toContain('data-atlas-v524-identifiability-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v524-canvas-created="false"');
    expect(source).toContain('data-atlas-v524-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v524-physics-mutation="false"');
    expect(source).not.toContain("锟");
  });
});
