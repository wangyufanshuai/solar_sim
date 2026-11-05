import { describe, expect, it } from "vitest";
import {
  createAtlasRuntimeSceneFocusSummary,
  selectAtlasSceneMode,
  shouldWriteRuntimeMarker,
  type AtlasRuntimeSceneFocusAudit,
} from "./atlasRuntimeSceneFocusPerformance";

describe("v115 runtime scene focus performance", () => {
  it("selects scene modes with launch isolation precedence", () => {
    expect(selectAtlasSceneMode({ launchActive: true, kerrActive: true, inspectActive: true })).toBe("launch");
    expect(selectAtlasSceneMode({ launchActive: false, kerrActive: true, inspectActive: true })).toBe("kerr");
    expect(selectAtlasSceneMode({ launchActive: false, kerrActive: false, inspectActive: true })).toBe("inspect");
    expect(selectAtlasSceneMode({ launchActive: false, kerrActive: false, inspectActive: false })).toBe("atlas");
  });

  it("throttles changed runtime marker values", () => {
    expect(shouldWriteRuntimeMarker({ nowMs: 100, lastWriteMs: 0, intervalMs: 120, previousValue: "1", nextValue: "2" })).toBe(false);
    expect(shouldWriteRuntimeMarker({ nowMs: 120, lastWriteMs: 0, intervalMs: 120, previousValue: "1", nextValue: "2" })).toBe(true);
    expect(shouldWriteRuntimeMarker({ nowMs: 500, lastWriteMs: 0, intervalMs: 120, previousValue: "2", nextValue: "2" })).toBe(false);
  });

  it("reports deterministic lock metadata", () => {
    const ids: AtlasRuntimeSceneFocusAudit["id"][] = [
      "scene-mode-isolation-lock",
      "launch-telemetry-subscriber-lock",
      "camera-focus-latency-lock",
      "hidden-dom-unmount-lock",
      "r3f-prop-stability-lock",
      "evidence-browser-qa-lock",
      "protected-mutation-lock",
    ];
    const summary = createAtlasRuntimeSceneFocusSummary({
      sceneMode: "launch",
      audits: ids.map((id) => ({ id, status: "ready", measured: "ready", expected: "ready" })),
    });
    expect(summary.status).toBe("ready-runtime-scene-focus-locked");
    expect(summary.sceneMode).toBe("launch");
    expect(summary.protectedMutation).toBe("not-applied");
  });
});
