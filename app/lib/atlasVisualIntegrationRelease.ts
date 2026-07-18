import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";

export const ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION =
  "v119-visual-integration-release-gate" as const;
export const ATLAS_VISUAL_INTEGRATION_RELEASE_PROFILE =
  "v119-eight-scenes-runtime-observation-release" as const;

export type AtlasVisualReviewScene =
  | "earth"
  | "jupiter"
  | "saturn"
  | "sirius"
  | "betelgeuse"
  | "gaia-id"
  | "leo-liftoff"
  | "payload-deploy";

export type AtlasRuntimePerformanceSnapshot = {
  qualityTier: AtlasRuntimeQualityTier;
  medianFps: number;
  frameTimeP95Ms: number;
  longestTaskMs: number;
  tasksUnder50MsRatio: number;
  sampleCount: number;
  observedAtMs: number;
};

export const ATLAS_VISUAL_REVIEW_SCENES: readonly AtlasVisualReviewScene[] = [
  "earth", "jupiter", "saturn", "sirius", "betelgeuse", "gaia-id", "leo-liftoff", "payload-deploy",
];

export function createAtlasVisualIntegrationReleaseSummary() {
  return {
    version: ATLAS_VISUAL_INTEGRATION_RELEASE_VERSION,
    profile: ATLAS_VISUAL_INTEGRATION_RELEASE_PROFILE,
    status: "ready-browser-runtime-observation" as const,
    reviewScenes: ATLAS_VISUAL_REVIEW_SCENES,
    desktopOverviewMedianFpsMin: 55,
    desktopCloseupLaunchMedianFpsMin: 45,
    mobileMedianFpsMin: 30,
    mobileFrameTimeP95MaxMs: 50,
    selectionLongTaskMaxMs: 100,
    mainTasksUnder50MsRatioMin: 0.95,
    performancePolicy: "hardware-baseline-gate-ci-observation-only" as const,
    focusedCommand: "npm run test:atlas:visual-integration-release" as const,
    trustedBoundary: "v119 integrates browser-observed visual review and release markers only. Scientific gates, fixtures, realtime/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky and v75/v97/v99 budgets remain unchanged.",
  };
}

export function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))]!;
}
