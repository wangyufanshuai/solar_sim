import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV520.tsx",
  "utf8",
);

describe("v520 twenty-two-detail Stokes observatory", () => {
  it("adds fixed-band Stokes as the twenty-second exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(23);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV520>("none")');
    expect(source).toContain(
      '"fixed-band-stokes": lazy(() => import("./KerrFixedBandStokesV520"))',
    );
  });

  it("keeps network access behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v520-static-network-budget="0"');
    expect(source).toContain('data-atlas-v520-stokes-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v520-canvas-created="false"');
    expect(source).toContain('data-atlas-v520-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v520-physics-mutation="false"');
    expect(source).not.toContain("�");
  });
});
