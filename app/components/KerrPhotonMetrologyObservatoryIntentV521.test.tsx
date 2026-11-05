import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV521.tsx",
  "utf8",
);

describe("v521 twenty-three-detail direct integration observatory", () => {
  it("adds the direct Stokes oracle as the twenty-third exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(24);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV521>("none")');
    expect(source).toContain(
      '"direct-stokes-oracle": lazy(() => import("./KerrFixedBandStokesOracleV521"))',
    );
  });

  it("keeps all requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v521-static-network-budget="0"');
    expect(source).toContain('data-atlas-v521-oracle-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v521-canvas-created="false"');
    expect(source).toContain('data-atlas-v521-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v521-physics-mutation="false"');
    expect(source).not.toContain("�");
  });
});
