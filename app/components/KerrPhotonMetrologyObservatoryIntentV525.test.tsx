import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV525.tsx",
  "utf8",
);
describe("v525 twenty-seven-detail calibration design observatory", () => {
  it("adds calibration excitation as the twenty-seventh exclusive detail", () => {
    expect((source.match(/lazy\(/g) ?? []).length).toBe(28);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV525>("none")');
    expect(source).toContain(
      '"calibration-excitation-design": lazy(() => import("./KerrCalibrationExcitationDesignV525"))',
    );
  });
  it("keeps requests behind explicit local-shadow detail selection", () => {
    expect(source).toContain('data-atlas-v525-static-network-budget="0"');
    expect(source).toContain('data-atlas-v525-design-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
  it("keeps scene, physics and Unicode boundaries closed", () => {
    expect(source).toContain('data-atlas-v525-canvas-created="false"');
    expect(source).toContain('data-atlas-v525-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v525-physics-mutation="false"');
    expect(source).not.toContain("锟");
  });
});
