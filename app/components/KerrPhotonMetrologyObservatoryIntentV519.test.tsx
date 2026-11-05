import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV519.tsx",
  "utf8",
);

describe("v519 twenty-one-detail radiometry observatory", () => {
  it("adds the radiometry oracle as the twenty-first exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(22);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV519>("none")');
    expect(source).toContain('"radiometry-oracle": lazy(() => import("./KerrFixedBandRadiometryOracleV519"))');
  });

  it("keeps the oracle behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v519-static-network-budget="0"');
    expect(source).toContain('data-atlas-v519-oracle-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene and physics boundaries closed", () => {
    expect(source).toContain('data-atlas-v519-canvas-created="false"');
    expect(source).toContain('data-atlas-v519-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v519-physics-mutation="false"');
  });
});
