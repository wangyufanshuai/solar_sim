import { describe, expect, it } from "vitest";
import {
  ATLAS_INTERACTION_CATALOG_COMPLETION_PROFILE,
  ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
  V107_INTERACTION_CATALOG_COMPLETION_ROW,
  createAtlasInteractionCatalogCompletionSummary,
} from "./atlasInteractionCatalogCompletionLock";
import type { AtlasInteractionCatalogCompletionAudit } from "./simulationDiagnosticsTypes";

describe("v107 interaction and catalog completion lock", () => {
  it("returns deterministic pending runtime metadata", () => {
    const summary = createAtlasInteractionCatalogCompletionSummary();
    expect(summary).toMatchObject({
      version: ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
      profile: ATLAS_INTERACTION_CATALOG_COMPLETION_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      cameraPolicy: "single-cancellable-command-adaptive-smootherstep-1200-1800ms",
      starFocusPolicy: "celestial-direction-center-not-physical-flyby",
      focusExitPolicy: "passport-reset-escape",
      gaiaSearchPolicy: "packaged-5000-query-min-2-max-12",
      gaiaLabelPolicy: "desktop-24-mobile-8-selected-always",
      constellationCount: 88,
      nebulaCount: 80,
      livePhysicsMutation: "not-applied",
      fixtureDataMutation: "not-applied",
      gaiaRenderBudgetMutation: "not-applied",
      gaiaOpacityCapMutation: "not-applied",
      releasePackagingMutation: "not-applied",
    });
    expect(summary.rows).toEqual([V107_INTERACTION_CATALOG_COMPLETION_ROW]);
  });

  it("reports ready only when every audit passes", () => {
    const audits = [
      "v106-rc-evidence-closure",
      "camera-transition-lock",
      "launch-entry-lock",
      "gaia-navigation-lock",
      "label-budget-lock",
      "constellation-nebula-lock",
      "docs-surface-lock",
      "protected-mutation-lock",
    ].map((id) => audit(id as AtlasInteractionCatalogCompletionAudit["id"]));
    const summary = createAtlasInteractionCatalogCompletionSummary({ audits });
    expect(summary.status).toBe("ready-interaction-catalog-locked");
    expect(summary.classification).toBe("interaction-catalog-completion-pass");
    expect(summary.readyRowId).toBe("v107-lock-interaction-catalog-completion");
  });
});

function audit(
  id: AtlasInteractionCatalogCompletionAudit["id"],
): AtlasInteractionCatalogCompletionAudit {
  return {
    id,
    label: id,
    status: "ready",
    measured: "ready",
    expected: "ready",
    trustedBoundary: "v107 test",
  };
}
