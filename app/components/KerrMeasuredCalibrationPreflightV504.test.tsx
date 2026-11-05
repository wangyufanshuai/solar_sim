import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "utf8",
);

describe("v504 measured calibration preflight surface", () => {
  it("loads only the latest artifact after explicit detail intent", () => {
    expect(source).not.toContain("useEffect");
    expect(source).toContain("Load latest preflight");
    expect(source).toContain("subscribeAtlasCalibrationPreflightV508");
    expect(source).toContain("loadAtlasCalibrationPreflightV508()");
    expect(source).toContain('data-atlas-v508-evidence-store="external-single-flight"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useRef");
  });

  it("states the read-only and scientific boundaries in UTF-8", () => {
    expect(source).toContain("先验收文件，再讨论探测器响应");
    expect(source).toContain('data-atlas-v504-authority-granted="false"');
    expect(source).toContain('data-atlas-v504-runtime-projection="false"');
    expect(source).toContain('data-atlas-v504-science-raster="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("uses the v505 profile as presentation-only binding", () => {
    expect(source).toContain("bindAtlasCalibrationHudV505(mode, state.summary)");
    expect(source).toContain("const summary = binding.sciencePayload");
    expect(source).toContain('data-atlas-v505-science-payload-reference-preserved="true"');
    expect(source).toContain('data-atlas-v505-scientific-field-mutation="false"');
    expect(source).toContain("profile.tokens.gridOpacity");
    expect(source).toContain("profile.tokens.panelRaised");
    expect(source).toContain("useSyncExternalStore(");
    expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(source).toContain("setAtlasCalibrationHudModeV506(entry)");
    expect(source).toContain('data-atlas-v506-hud-mode-store="external"');
    expect(source).not.toContain('useState<AtlasCalibrationHudModeV505>');
  });
});
