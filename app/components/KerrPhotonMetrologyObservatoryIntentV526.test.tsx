import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV526.tsx", "utf8");
describe("v526 twenty-eight-detail uncertainty observatory", () => {
  it("adds uncertainty transfer as the twenty-eighth exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(29);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV526>("none")');
    expect(source).toContain('"calibration-uncertainty-transfer": lazy(() => import("./KerrCalibrationUncertaintyTransferV526"))');
  });
  it("keeps requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v526-static-network-budget="0"');
    expect(source).toContain('data-atlas-v526-transfer-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v526-canvas-created="false"');
    expect(source).toContain('data-atlas-v526-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v526-physics-mutation="false"');
    expect(source).not.toContain("锟");
  });
});
