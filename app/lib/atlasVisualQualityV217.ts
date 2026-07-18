export const ATLAS_VISUAL_QUALITY_V217_VERSION =
  "v217-projected-subject-and-safe-scene-metrics" as const;

export type AtlasVisualSafeSceneRectV217 = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type AtlasProjectedSubjectMetricsV217 = {
  version: typeof ATLAS_VISUAL_QUALITY_V217_VERSION;
  subjectId: string | null;
  kind: "planet" | "ringed-planet" | "stellar" | "other";
  centerPx: { x: number; y: number } | null;
  bodyDiscDiameterPx: number | null;
  totalSilhouetteDiameterPx: number | null;
  safeSceneRect: AtlasVisualSafeSceneRectV217;
  bodyDiscCoverage: number | null;
  totalSilhouetteCoverage: number | null;
  centerInsideSafeScene: boolean | null;
};

export type AtlasVisualQualityBudgetV220 = {
  recommendedCanvasReadyJsBytes: 614_400;
  hardCanvasReadyJsBytes: 624_640;
  stablePerceptualSimilarity: 0.97;
  planetBodyDiscCoverage: readonly [0.4, 0.52];
  saturnBodyDiscCoverage: readonly [0.38, 0.48];
  saturnTotalSilhouetteCoverageMax: 0.65;
  stellarCoverage: readonly [0.34, 0.48];
};

export const ATLAS_VISUAL_QUALITY_BUDGET_V220: AtlasVisualQualityBudgetV220 = {
  recommendedCanvasReadyJsBytes: 614_400,
  hardCanvasReadyJsBytes: 624_640,
  stablePerceptualSimilarity: 0.97,
  planetBodyDiscCoverage: [0.4, 0.52],
  saturnBodyDiscCoverage: [0.38, 0.48],
  saturnTotalSilhouetteCoverageMax: 0.65,
  stellarCoverage: [0.34, 0.48],
};

export function createAtlasSafeSceneRectV217(input: {
  viewportWidth: number;
  viewportHeight: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}): AtlasVisualSafeSceneRectV217 {
  const viewportWidth = Math.max(1, input.viewportWidth);
  const viewportHeight = Math.max(1, input.viewportHeight);
  const left = Math.min(viewportWidth, Math.max(0, input.left ?? 0));
  const top = Math.min(viewportHeight, Math.max(0, input.top ?? 0));
  const right = Math.max(left, Math.min(viewportWidth, input.right ?? viewportWidth));
  const bottom = Math.max(top, Math.min(viewportHeight, input.bottom ?? viewportHeight));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

export function coverageInAtlasSafeSceneV217(
  diameterPx: number | null,
  rect: AtlasVisualSafeSceneRectV217,
): number | null {
  if (diameterPx == null || !Number.isFinite(diameterPx) || diameterPx <= 0) return null;
  const shortEdge = Math.min(rect.width, rect.height);
  return shortEdge > 0 ? diameterPx / shortEdge : null;
}

