import { describe, expect, it } from "vitest";
import {
  ATLAS_INTERACTION_REPAIR_LAUNCH_UX_PROFILE,
  ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
  V108_INTERACTION_REPAIR_LAUNCH_UX_ROW,
  createAtlasInteractionRepairLaunchUxSummary,
} from "./atlasInteractionRepairLaunchUxLock";
import type { AtlasInteractionRepairLaunchUxAudit } from "./simulationDiagnosticsTypes";

describe("v108 interaction repair and launch UX lock", () => {
  it("returns deterministic pending runtime metadata", () => {
    const summary = createAtlasInteractionRepairLaunchUxSummary();
    expect(summary).toMatchObject({
      version: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
      profile: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      skyTargetPolicy: "zoomable-visual-proxy-no-physics-body",
      skyTargetZoomPolicy: "camera-target-distance-only-clamped",
      bodyZoomPolicy: "native-wheel-distance-preserved-during-body-lock",
      launchUxPolicy: "leo-satellite-default-cards-countdown-timeline-local-physics",
      livePhysicsMutation: "not-applied",
      fixtureDataMutation: "not-applied",
      gaiaRenderBudgetMutation: "not-applied",
      gaiaOpacityCapMutation: "not-applied",
      releasePackagingMutation: "not-applied",
    });
    expect(summary.rows).toEqual([V108_INTERACTION_REPAIR_LAUNCH_UX_ROW]);
  });

  it("reports ready only when every audit passes", () => {
    const audits = [
      "v107-interaction-catalog-completion",
      "sky-target-proxy-lock",
      "sky-target-zoom-lock",
      "body-zoom-lock",
      "launch-ux-lock",
      "docs-surface-lock",
      "protected-mutation-lock",
    ].map((id) => audit(id as AtlasInteractionRepairLaunchUxAudit["id"]));
    const summary = createAtlasInteractionRepairLaunchUxSummary({ audits });
    expect(summary.status).toBe("ready-interaction-repair-launch-ux-locked");
    expect(summary.classification).toBe("interaction-repair-launch-ux-pass");
    expect(summary.readyRowId).toBe("v108-lock-interaction-repair-launch-ux");
  });
});

function audit(
  id: AtlasInteractionRepairLaunchUxAudit["id"],
): AtlasInteractionRepairLaunchUxAudit {
  return {
    id,
    label: id,
    status: "ready",
    measured: "ready",
    expected: "ready",
    trustedBoundary: "v108 test",
  };
}
