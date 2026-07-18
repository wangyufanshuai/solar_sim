import type {
  AtlasPerformanceBudgetSummary,
  AtlasPerformanceBudgetVersion,
  AtlasPerformanceRecommendation,
  AtlasPerformanceTier,
  AtlasRenderStabilityStatus,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PERFORMANCE_BUDGET_VERSION: AtlasPerformanceBudgetVersion =
  "v34-performance-budget";

export type CreateAtlasPerformanceBudgetSummaryArgs = {
  presentationMode?: string | null;
  scaleMode?: string | null;
  renderBudget?: string | null;
  viewportWidth?: number | null;
  devicePixelRatio?: number | null;
  showDeepSkyObjects?: boolean | null;
  showCatalogLabels?: boolean | null;
  catalogLabelCount?: number | null;
  showKerrBlackHole?: boolean | null;
  workbenchOpen?: boolean | null;
  canvasReady?: boolean | null;
  skyReady?: boolean | null;
  coreBodiesReady?: boolean | null;
  readinessFallback?: boolean | null;
  visualEnhance?: boolean | null;
};

export function createAtlasPerformanceBudgetSummary({
  presentationMode,
  scaleMode,
  renderBudget,
  viewportWidth,
  devicePixelRatio,
  showDeepSkyObjects = false,
  showCatalogLabels = false,
  catalogLabelCount,
  showKerrBlackHole = false,
  workbenchOpen = false,
  canvasReady = false,
  skyReady = false,
  coreBodiesReady = false,
  readinessFallback = false,
  visualEnhance = false,
}: CreateAtlasPerformanceBudgetSummaryArgs = {}): AtlasPerformanceBudgetSummary {
  const normalizedPresentationMode =
    presentationMode === "orbit-atlas" ? "orbit-atlas" : "sandbox";
  const normalizedRenderBudget = renderBudget === "dense" ? "dense" : "balanced";
  const normalizedScaleMode =
    scaleMode === "compressed" || scaleMode === "balanced" ? scaleMode : "balanced";
  const width = finitePositive(viewportWidth) ? Math.round(viewportWidth!) : 0;
  const dpr = clamp(finitePositive(devicePixelRatio) ? devicePixelRatio! : 1, 1, 4);
  const mobile = width > 0 && width < 640;
  const labelCount = Math.max(0, Math.round(finitePositive(catalogLabelCount) ? catalogLabelCount! : 0));
  const deepSkyEnabled = Boolean(showDeepSkyObjects);
  const catalogLabelsEnabled = Boolean(showCatalogLabels);
  const kerrVisible = Boolean(showKerrBlackHole);
  const workbenchIsOpen = Boolean(workbenchOpen);
  const fallback = Boolean(readinessFallback);
  const enhanced = Boolean(visualEnhance);

  const tier = performanceTier({
    presentationMode: normalizedPresentationMode,
    renderBudget: normalizedRenderBudget,
    mobile,
    dpr,
    catalogLabelsEnabled,
    deepSkyEnabled,
    kerrVisible,
    workbenchOpen: workbenchIsOpen,
    visualEnhance: enhanced,
  });
  const renderStability = stabilityStatus({
    tier,
    presentationMode: normalizedPresentationMode,
    renderBudget: normalizedRenderBudget,
    canvasReady: Boolean(canvasReady),
    skyReady: Boolean(skyReady),
    coreBodiesReady: Boolean(coreBodiesReady),
    readinessFallback: fallback,
    mobile,
    kerrVisible,
    visualEnhance: enhanced,
  });
  const deepSkyLabelBudget = labelBudget({
    tier,
    presentationMode: normalizedPresentationMode,
    renderBudget: normalizedRenderBudget,
    workbenchOpen: workbenchIsOpen,
  });
  const recommendations = performanceRecommendations({
    tier,
    renderStability,
    renderBudget: normalizedRenderBudget,
    mobile,
    dpr,
    catalogLabelsEnabled,
    labelCount,
    deepSkyLabelBudget,
    kerrVisible,
    workbenchOpen: workbenchIsOpen,
    readinessFallback: fallback,
    visualEnhance: enhanced,
  });
  const recommendedRenderBudget =
    mobile || renderStability === "constrained" || renderStability === "fallback"
      ? "balanced"
      : normalizedRenderBudget;

  return {
    version: ATLAS_PERFORMANCE_BUDGET_VERSION,
    tier,
    renderStability,
    presentationMode: normalizedPresentationMode,
    scaleMode: normalizedScaleMode,
    renderBudget: normalizedRenderBudget,
    recommendedRenderBudget,
    viewportWidth: width,
    devicePixelRatio: Number(dpr.toFixed(2)),
    mobile,
    deepSkyEnabled,
    catalogLabelsEnabled,
    catalogLabelCount: labelCount,
    deepSkyLabelBudget,
    kerrVisible,
    workbenchOpen: workbenchIsOpen,
    readinessFallback: fallback,
    visualEnhance: enhanced,
    recommendationCount: recommendations.length,
    recommendations,
    primaryMetric: `${tier}; ${renderStability}; label budget ${deepSkyLabelBudget}; recommended ${recommendedRenderBudget}`,
    trustedBoundary:
      "Local render budget and stability guidance only. It is not a scientific accuracy score and does not automatically mutate user-enabled layers.",
  };
}

function performanceTier({
  presentationMode,
  renderBudget,
  mobile,
  dpr,
  catalogLabelsEnabled,
  deepSkyEnabled,
  kerrVisible,
  workbenchOpen,
  visualEnhance,
}: {
  presentationMode: string;
  renderBudget: string;
  mobile: boolean;
  dpr: number;
  catalogLabelsEnabled: boolean;
  deepSkyEnabled: boolean;
  kerrVisible: boolean;
  workbenchOpen: boolean;
  visualEnhance: boolean;
}): AtlasPerformanceTier {
  if (mobile) return "mobile-safe";
  const heavyOverlays =
    (catalogLabelsEnabled && deepSkyEnabled && kerrVisible) ||
    (visualEnhance && dpr > 1.5 && renderBudget === "dense") ||
    (workbenchOpen && catalogLabelsEnabled && kerrVisible);
  if (heavyOverlays) return "diagnostic";
  if (presentationMode === "orbit-atlas" && renderBudget === "dense") return "dense";
  return "balanced";
}

function stabilityStatus({
  tier,
  presentationMode,
  renderBudget,
  canvasReady,
  skyReady,
  coreBodiesReady,
  readinessFallback,
  mobile,
  kerrVisible,
  visualEnhance,
}: {
  tier: AtlasPerformanceTier;
  presentationMode: string;
  renderBudget: string;
  canvasReady: boolean;
  skyReady: boolean;
  coreBodiesReady: boolean;
  readinessFallback: boolean;
  mobile: boolean;
  kerrVisible: boolean;
  visualEnhance: boolean;
}): AtlasRenderStabilityStatus {
  if (readinessFallback) return "fallback";
  if (!canvasReady) return "warming";
  if (presentationMode === "orbit-atlas" && (!skyReady || !coreBodiesReady)) return "warming";
  if (mobile && (renderBudget === "dense" || kerrVisible || visualEnhance)) return "constrained";
  if (tier === "diagnostic") return "constrained";
  return "ready";
}

function labelBudget({
  tier,
  presentationMode,
  renderBudget,
  workbenchOpen,
}: {
  tier: AtlasPerformanceTier;
  presentationMode: string;
  renderBudget: string;
  workbenchOpen: boolean;
}): number {
  let base: number;
  if (tier === "mobile-safe") base = presentationMode === "orbit-atlas" ? 6 : 8;
  else if (tier === "diagnostic") base = 14;
  else if (presentationMode === "orbit-atlas") base = renderBudget === "dense" ? 12 : 10;
  else base = 18;
  return workbenchOpen ? Math.max(6, base - 2) : base;
}

function performanceRecommendations({
  tier,
  renderStability,
  renderBudget,
  mobile,
  dpr,
  catalogLabelsEnabled,
  labelCount,
  deepSkyLabelBudget,
  kerrVisible,
  workbenchOpen,
  readinessFallback,
  visualEnhance,
}: {
  tier: AtlasPerformanceTier;
  renderStability: AtlasRenderStabilityStatus;
  renderBudget: string;
  mobile: boolean;
  dpr: number;
  catalogLabelsEnabled: boolean;
  labelCount: number;
  deepSkyLabelBudget: number;
  kerrVisible: boolean;
  workbenchOpen: boolean;
  readinessFallback: boolean;
  visualEnhance: boolean;
}): readonly AtlasPerformanceRecommendation[] {
  const recommendations: AtlasPerformanceRecommendation[] = [];
  if (mobile && renderBudget === "dense") {
    recommendations.push({
      id: "mobile-balanced-budget",
      severity: "warning",
      title: "Use balanced render budget on mobile",
      detail: "390px-class viewports stay in mobile-safe mode; dense mode remains visible but is flagged as constrained.",
    });
  }
  if (readinessFallback || renderStability === "fallback") {
    recommendations.push({
      id: "readiness-fallback",
      severity: "warning",
      title: "Readiness fallback active",
      detail: "Canvas readiness is using the local fallback path; this is render stability state, not science validation failure.",
    });
  }
  if (catalogLabelsEnabled && labelCount > deepSkyLabelBudget) {
    recommendations.push({
      id: "deep-sky-label-budget",
      severity: "info",
      title: "Deep-sky label density capped",
      detail: `Visible labels are capped at ${deepSkyLabelBudget}; the selected catalog target remains eligible even when density is capped.`,
    });
  }
  if (kerrVisible) {
    recommendations.push({
      id: "kerr-visual-cost",
      severity: "info",
      title: "Kerr Lab visual layer visible",
      detail: "Strong-field geodesic tracks are tracked as render cost only; solar-system dynamics are unchanged.",
    });
  }
  if (workbenchOpen && tier !== "mobile-safe") {
    recommendations.push({
      id: "workbench-overlay-budget",
      severity: "info",
      title: "Workbench overlay open",
      detail: "Mission, report, validation or observatory panels reduce recommended label density for readability.",
    });
  }
  if (visualEnhance && dpr > 1.5) {
    recommendations.push({
      id: "high-dpr-visual-enhance",
      severity: "info",
      title: "High-DPR visual enhancement",
      detail: "Enhanced visuals on high-DPR screens are marked as diagnostic render cost.",
    });
  }
  return recommendations;
}

function finitePositive(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
