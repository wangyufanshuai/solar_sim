import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "utf8",
);

describe("v503 measured calibration readiness surface", () => {
  it("loads only after explicit intent and keeps a bounded response", () => {
    expect(source).not.toContain("useEffect");
    expect(source).toContain("Load readiness checklist");
    expect(source).toContain("subscribeAtlasCalibrationReadinessV508");
    expect(source).toContain("loadAtlasCalibrationReadinessV508()");
    expect(source).toContain('data-atlas-v508-evidence-store="external-single-flight"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useRef");
  });

  it("states the fail-closed scientific boundary in UTF-8", () => {
    expect(source).toContain("六个真实文件，才是探测器权威的起点");
    expect(source).toContain('data-atlas-v503-authority-admitted="false"');
    expect(source).toContain('data-atlas-v503-science-writeback="false"');
    expect(source).toContain("response unavailable");
    expect(source).toContain("science raster unavailable");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("consumes the v505 stable HUD profile without replacing the science payload", () => {
    expect(source).toContain("bindAtlasCalibrationHudV505(mode, state.summary)");
    expect(source).toContain("const summary = binding.sciencePayload");
    expect(source).toContain('data-atlas-v505-science-payload-reference-preserved="true"');
    expect(source).toContain('data-atlas-v505-scientific-field-mutation="false"');
    expect(source).toContain("useSyncExternalStore(");
    expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(source).toContain("setAtlasCalibrationHudModeV506(entry)");
    expect(source).toContain('data-atlas-v506-hud-mode-store="external"');
    expect(source).not.toContain('useState<AtlasCalibrationHudModeV505>');
  });
});
