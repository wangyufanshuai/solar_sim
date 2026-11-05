import { describe, expect, it } from "vitest";
import {
  ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
  createAtlasInteractionVisualQualitySummary,
} from "./atlasInteractionVisualQualityLock";
import type { AtlasInteractionVisualQualityAudit } from "./simulationDiagnosticsTypes";

const audit = (
  id: AtlasInteractionVisualQualityAudit["id"],
  status: AtlasInteractionVisualQualityAudit["status"] = "ready",
): AtlasInteractionVisualQualityAudit => ({
  id,
  label: id,
  status,
  measured: status,
  expected: "ready",
  trustedBoundary: "test",
});

describe("v109 interaction visual quality lock summary", () => {
  it("exposes deterministic pending metadata by default", () => {
    const summary = createAtlasInteractionVisualQualitySummary();
    expect(summary.version).toBe(ATLAS_INTERACTION_VISUAL_QUALITY_VERSION);
    expect(summary.profile).toBe("v109-launch-camera-gaia-material-quality");
    expect(summary.status).toBe("pending-runtime-run");
    expect(summary.cameraFreedomPolicy).toBe("target-follow-user-orbit-override");
    expect(summary.launchCameraPolicy).toBe("auto-follow-manual-orbit-restore-follow");
    expect(summary.launchVisualPolicy).toBe("procedural-budget-rocket-satellite-no-physics-mutation");
    expect(summary.stellarMaterialPolicy).toBe("gaia-bp-rp-gmag-parallax-presentation-material");
    expect(summary.gaiaBudgetPolicy).toBe("v97-1000-1800-3000-preserved");
    expect(summary.gaiaRenderBudgetMutation).toBe("not-applied");
    expect(summary.gaiaOpacityCapMutation).toBe("not-applied");
  });

  it("classifies focused audit results", () => {
    const ready = createAtlasInteractionVisualQualitySummary({
      audits: [
        audit("v108-interaction-repair-launch-ux"),
        audit("camera-freedom-lock"),
        audit("launch-camera-lock"),
        audit("launch-visual-lock"),
        audit("stellar-material-lock"),
        audit("docs-surface-lock"),
        audit("protected-mutation-lock"),
      ],
    });
    expect(ready.status).toBe("ready-interaction-visual-quality-locked");
    expect(ready.classification).toBe("interaction-visual-quality-pass");

    const regressed = createAtlasInteractionVisualQualitySummary({
      audits: [audit("stellar-material-lock", "regressed")],
    });
    expect(regressed.classification).toBe("stellar-material-regression");
  });
});
