import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v501 admission surface", () => {
  const source = readFileSync(
    "app/components/KerrTopologyDetectorAdmissionV501.tsx",
    "utf8",
  );

  it("requires intent and preserves blocked admission", () => {
    expect(source).toContain("Load admission bridge");
    expect(source).not.toContain("useEffect");
    expect(source).toContain('data-atlas-v501-admitted="false"');
    expect(source).toContain('data-atlas-v501-topology-bypass="false"');
    expect(source).toContain('data-atlas-v501-science-writeback="false"');
    expect(source).toContain('data-atlas-v501-science-raster="false"');
    expect(source).toContain('data-atlas-v501-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("uses the shared v505/v506 presentation layer without mutating admission data", () => {
    expect(source).toContain("bindAtlasCalibrationHudV505(modeSnapshot.mode, state.summary)");
    expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(source).toContain("setAtlasCalibrationHudModeV506(entry)");
    expect(source).toContain('data-atlas-v507-hud-mode-store="external"');
    expect(source).toContain('data-atlas-v507-science-payload-reference-preserved="true"');
    expect(source).toContain('data-atlas-v507-scientific-field-mutation="false"');
    expect(source).not.toContain("useState");
  });

  it("keeps page and API local-shadow-only", () => {
    const page = readFileSync("app/local-shadow-v501/page.tsx", "utf8");
    const route = readFileSync(
      "app/api/atlas/relativity-evidence/v501/topology-detector-admission/route.ts",
      "utf8",
    );
    expect(page).toContain('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE==="local-shadow"');
    expect(route).toContain('delivery!=="local-shadow"');
    expect(route).toContain("128*1024");
    expect(route).toContain("Content-Security-Policy");
  });
});
