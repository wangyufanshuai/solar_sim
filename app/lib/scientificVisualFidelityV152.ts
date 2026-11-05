export const SCIENTIFIC_VISUAL_FIDELITY_V152_VERSION =
  "v152-data-driven-scientific-visual-fidelity" as const;

export const SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS = {
  earth: {
    darkSideTextureFillOpacity: 0.12,
    minimumTextureEmissive: 0.12,
  },
  jupiter: {
    keyFillOpacity: 0.118,
    bandMaskOpacity: 0.32,
    normalScale: [1.02, 0.68] as const,
  },
  saturn: {
    frameRadiusScale: 3.05,
    frameCoverage: 0.55,
  },
} as const;

export function createScientificVisualFidelityV152Summary() {
  return {
    version: SCIENTIFIC_VISUAL_FIDELITY_V152_VERSION,
    materialPolicy: "v7-parameters-with-bounded-photometric-fallback" as const,
    planetPolicy: "single-surface-specialized-presentation-layers" as const,
    stellarDrawCallBudget: 6 as const,
    planetDrawCallBudget: 8 as const,
    texturePolicy: "scene-lru-ktx2-with-local-fallback" as const,
    boundary:
      "Presentation-only color, framing and material inputs; no live or worker physics, V9 sky, v75, v97 or v99 historical budget mutation.",
  };
}
