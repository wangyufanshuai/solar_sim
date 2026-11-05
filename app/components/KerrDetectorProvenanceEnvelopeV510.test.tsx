import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrDetectorProvenanceEnvelopeV510.tsx",
  "utf8",
);

describe("v510 detector provenance surface", () => {
  it("subscribes to the three cached stages and shared HUD mode without loading evidence", () => {
    expect(source).toContain("subscribeKerrTopologyDetectorAdmissionV501");
    expect(source).toContain("subscribeAtlasCalibrationReadinessV508");
    expect(source).toContain("subscribeAtlasCalibrationPreflightV508");
    expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(source).not.toContain("loadKerrTopologyDetectorAdmissionSummaryV501");
    expect(source).not.toContain("loadAtlasCalibrationReadinessV508");
    expect(source).not.toContain("loadAtlasCalibrationPreflightV508");
    expect(source).toContain('data-atlas-v510-automatic-request-count="0"');
  });

  it("exports two formats through bounded object URLs and preserves scientific boundaries", () => {
    expect(source).toContain("acquireKerrDetectorProvenanceExportV510");
    expect(source).toContain("queueMicrotask(acquired.release)");
    expect(source).toContain('data-atlas-v510-export-format-count="2"');
    expect(source).toContain('data-atlas-v510-object-url-persistence="0"');
    expect(source).toContain('data-atlas-v510-detector-authority="false"');
    expect(source).toContain('data-atlas-v510-science-raster="false"');
    expect(source).toContain('data-atlas-v510-scientific-field-mutation="false"');
    expect(source).toContain('data-atlas-v510-scene-revision-delta="0"');
  });

  it("uses the frozen V505 Science/Cinematic token profile", () => {
    expect(source).toContain("resolveAtlasCalibrationHudProfileV505(mode.mode)");
    expect(source).toContain('"--v510-panel": profile.tokens.panel');
    expect(source).toContain('"--v510-accent": profile.tokens.accent');
    expect(source).toContain('"--v510-blocked": profile.tokens.blocked');
  });
});
