import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ATLAS_LEGACY_ROOT_COMPATIBILITY_V256,
  atlasLegacyRootKeysV256,
} from "./atlasLegacyRootCompatibilityV256";
import {
  createAtlasRuntimeStateV256,
  serializeAtlasRuntimeStateV256,
} from "./atlasRuntimeStateV256";

describe("v256 compact runtime state", () => {
  it("isolates the frozen 603-key legacy root contract", () => {
    const keys = atlasLegacyRootKeysV256();
    expect(keys).toHaveLength(ATLAS_LEGACY_ROOT_COMPATIBILITY_V256.attributeCount);
    expect(createHash("sha256").update(keys.join("\n")).digest("hex")).toBe(
      ATLAS_LEGACY_ROOT_COMPATIBILITY_V256.keySha256,
    );
    expect(ATLAS_LEGACY_ROOT_COMPATIBILITY_V256.growthPolicy).toBe(
      "frozen-no-new-root-attributes",
    );
  });

  it("publishes seven compact domains without promoting science or deployment", () => {
    const state = createAtlasRuntimeStateV256({
      experienceMode: "research",
      sceneMode: "atlas",
      legacyLodTier: "mid",
      selectedObjectId: "gaia-123",
      ready: true,
      gaiaCatalogSource: "gaia-dr3",
      qualityTier: "balanced",
      activeCatalogBudget: 4_000,
    });
    expect(Object.keys(state)).toEqual([
      "version",
      "scene",
      "catalog",
      "observer",
      "analysis",
      "evidence",
      "performance",
      "release",
    ]);
    expect(state.scene.scaleBand).toBe("stellar");
    expect(state.evidence.defaultKernel).toBe("legacy-eih-1pn");
    expect(state.evidence.scienceStatus).toBe("science-failed-shadow-retained");
    expect(state.release.vercelApplied).toBe(false);
    expect(state.analysis.onlineResultsCanonical).toBe(false);
  });

  it("serializes deterministically and escapes script-breaking text", () => {
    const state = createAtlasRuntimeStateV256({
      experienceMode: "explore",
      sceneMode: "atlas",
      legacyLodTier: "solar",
      selectedObjectId: "</script>",
      ready: false,
      gaiaCatalogSource: "pending",
      qualityTier: "mobile-safe",
      activeCatalogBudget: 1_000,
    });
    const first = serializeAtlasRuntimeStateV256(state);
    expect(serializeAtlasRuntimeStateV256(state)).toBe(first);
    expect(first).not.toContain("</script>");
    expect(JSON.parse(first).scene.selectedObjectId).toBe("</script>");
  });
});
