import { describe, expect, it } from "vitest";
import {
  ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
  createAtlasCameraStellarCloseupSummary,
} from "./atlasCameraStellarCloseupLock";
import type { AtlasCameraStellarCloseupAudit } from "./simulationDiagnosticsTypes";

const audit = (
  id: AtlasCameraStellarCloseupAudit["id"],
  status: AtlasCameraStellarCloseupAudit["status"] = "ready",
): AtlasCameraStellarCloseupAudit => ({
  id,
  label: id,
  status,
  measured: status,
  expected: "ready",
  trustedBoundary: "test",
});

describe("v111 camera and stellar close-up lock summary", () => {
  it("exposes deterministic pending metadata by default", () => {
    const summary = createAtlasCameraStellarCloseupSummary();
    expect(summary.version).toBe(ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION);
    expect(summary.profile).toBe("v111-camera-rig-stellar-portrait-closeup");
    expect(summary.cameraRigPolicy).toBe("target-anchor-user-orbit-distance-state");
    expect(summary.stellarPortraitPolicy).toBe("gaia-derived-offline-curated-presentation-portrait");
    expect(summary.closeupPerformancePolicy).toBe("selected-closeup-nonessential-layer-suppression");
    expect(summary.gaiaBudgetPolicy).toBe("v97-1000-1800-3000-preserved");
  });

  it("classifies focused audit results", () => {
    const ready = createAtlasCameraStellarCloseupSummary({
      audits: [
        audit("v110-critical-ui-relativity-visibility"),
        audit("camera-rig-lock"),
        audit("stellar-portrait-lock"),
        audit("closeup-performance-lock"),
        audit("protected-mutation-lock"),
      ],
    });
    expect(ready.status).toBe("ready-camera-stellar-closeup-locked");
    expect(ready.classification).toBe("camera-stellar-closeup-pass");

    const regressed = createAtlasCameraStellarCloseupSummary({
      audits: [audit("camera-rig-lock", "regressed")],
    });
    expect(regressed.classification).toBe("camera-rig-regression");
  });
});
