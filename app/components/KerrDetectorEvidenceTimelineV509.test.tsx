import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrDetectorEvidenceTimelineV509.tsx",
  "utf8",
);

describe("v509 detector evidence timeline", () => {
  it("subscribes to three evidence channels and the shared mode store", () => {
    for (const token of [
      "subscribeKerrTopologyDetectorAdmissionV501",
      "subscribeAtlasCalibrationReadinessV508",
      "subscribeAtlasCalibrationPreflightV508",
      "subscribeAtlasCalibrationHudModeV506",
    ]) {
      expect(source).toContain(token);
    }
    expect(source.match(/useSyncExternalStore\(/g)).toHaveLength(4);
    expect(source).toContain('data-atlas-v509-subscription-count="4"');
  });

  it("does not load any stage automatically", () => {
    expect(source).not.toContain("useEffect");
    expect(source).not.toContain("fetch(");
    expect(source).toContain('data-atlas-v509-automatic-request-count="0"');
    expect(source).toContain("Load stage evidence");
    expect(source).toContain("loadKerrTopologyDetectorAdmissionSummaryV501()");
    expect(source).toContain("loadAtlasCalibrationReadinessV508()");
    expect(source).toContain("loadAtlasCalibrationPreflightV508()");
  });

  it("preserves the fail-closed science boundary", () => {
    expect(source).toContain('data-atlas-v509-admitted="false"');
    expect(source).toContain('data-atlas-v509-science-raster="false"');
    expect(source).toContain('data-atlas-v509-scientific-field-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("physicsEngine");
    expect(source).not.toContain("setSceneRevision");
  });
});
