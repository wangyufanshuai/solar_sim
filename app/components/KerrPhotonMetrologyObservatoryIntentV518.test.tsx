import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV518.tsx",
  "utf8",
);

describe("v518 twenty-detail V7.2 observatory", () => {
  it("adds the proof constellation as the twentieth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(21);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV518>("none")');
    expect(source).toContain('"provenance-constellation": lazy(() => import("./KerrProvenanceConstellationV518"))');
  });

  it("keeps V7.2 behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v518-static-network-budget="0"');
    expect(source).toContain('data-atlas-v518-constellation-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps scene and physics boundaries closed", () => {
    expect(source).toContain('data-atlas-v518-canvas-created="false"');
    expect(source).toContain('data-atlas-v518-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v518-physics-mutation="false"');
  });
});
