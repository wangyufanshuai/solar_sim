import { describe, expect, it } from "vitest";
import { publishAtlasScienceImageRoiTelemetryV347, resetAtlasScienceImageRoiTelemetryV347ForTests } from "./atlasScienceImageRoiTelemetryV347";
describe("v347 ROI telemetry", () => {
  it("publishes method and unavailable boundaries without AppShell state", () => {
    resetAtlasScienceImageRoiTelemetryV347ForTests(); const node = { dataset: {} as DOMStringMap }; const summary = { roiId: "visible:r12-r15", sampleCount: 4 } as never; const snapshot = publishAtlasScienceImageRoiTelemetryV347(summary, { node, resources: { objectUrls: 0, typedArrayCaches: 1 } as never });
    expect(snapshot).toMatchObject({ roiId: "visible:r12-r15", sampleCount: 4, uncertaintyCombination: "componentwise-linear-interval-no-independence-assumed", celestialWcs: "unavailable", apertureFlux: "unavailable-no-solid-angle-or-celestial-wcs", sceneRevisionDelta: 0, canvasCount: 1 }); expect(node.dataset.atlasScienceRoiSelectionV347).toBe("visible:r12-r15");
  });
});
