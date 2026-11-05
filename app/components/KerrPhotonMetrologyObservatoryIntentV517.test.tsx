import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV517.tsx",
  "utf8",
);

describe("v517 nineteen-detail independently verified observatory", () => {
  it("adds independent proof as the nineteenth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(20);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV517>("none")');
    expect(source).toContain('() => import("./KerrUncertaintyIndependentVerificationV517")');
  });

  it("keeps verification behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v517-static-network-budget="0"');
    expect(source).toContain('data-atlas-v517-verification-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps Canvas, scene revision and physics untouched", () => {
    expect(source).toContain('data-atlas-v517-canvas-created="false"');
    expect(source).toContain('data-atlas-v517-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v517-physics-mutation="false"');
  });
});
