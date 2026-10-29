export const ATLAS_VISUAL_JOURNEY_MANIFEST_V193_VERSION =
  "v193-six-journey-keyframe-matrix" as const;

export type AtlasVisualJourneyId =
  | "overview"
  | "inspect"
  | "stellar-exoplanet"
  | "launch"
  | "relativity"
  | "scene-lab";

export type AtlasVisualJourneyKeyframe = "entry" | "hero" | "exit";
export type AtlasVisualViewportId = "desktop-1440x900" | "mobile-390x844";

export type AtlasVisualJourneyFrame = {
  keyframe: AtlasVisualJourneyKeyframe;
  stateId: string;
  subjectId: string;
  settleMarker: string;
};

export type AtlasVisualJourneyDefinition = {
  id: AtlasVisualJourneyId;
  label: string;
  frames: readonly AtlasVisualJourneyFrame[];
};

export type AtlasVisualJourneyManifestV193 = {
  version: typeof ATLAS_VISUAL_JOURNEY_MANIFEST_V193_VERSION;
  viewports: Readonly<Record<AtlasVisualViewportId, { width: number; height: number }>>;
  journeys: readonly AtlasVisualJourneyDefinition[];
  metrics: {
    perceptualReviewWarningBelow: number;
    desktopOccluderGapPx: number;
    mobileOccluderGapPx: number;
    planetCoverage: readonly [number, number];
    stellarCoverage: readonly [number, number];
    cameraResponseMaxMs: number;
    desktopSettleMs: readonly [number, number];
    mobileSettleMs: readonly [number, number];
    exitSettleMs: readonly [number, number];
    cameraOvershootMaxRatio: number;
    stablePerceptualSimilarity: number;
    saturnBodyDiscCoverage: readonly [number, number];
    saturnTotalSilhouetteCoverageMax: number;
  };
  baselineUpdateEnvironmentVariable: "ATLAS_UPDATE_VISUAL_BASELINES";
  boundary: string;
};

const RETURNED_OVERVIEW: AtlasVisualJourneyFrame = {
  keyframe: "exit",
  stateId: "overview-returned-after-escape",
  subjectId: "solar-system-origin",
  settleMarker: "camera-origin-settled",
};

export const ATLAS_VISUAL_JOURNEY_MANIFEST_V193: AtlasVisualJourneyManifestV193 = {
  version: ATLAS_VISUAL_JOURNEY_MANIFEST_V193_VERSION,
  viewports: {
    "desktop-1440x900": { width: 1440, height: 900 },
    "mobile-390x844": { width: 390, height: 844 },
  },
  journeys: [
    {
      id: "overview",
      label: "Orbit Atlas overview",
      frames: [
        { keyframe: "entry", stateId: "canvas-ready", subjectId: "solar-system-origin", settleMarker: "single-webgl-canvas-ready" },
        { keyframe: "hero", stateId: "overview-settled", subjectId: "solar-system-origin", settleMarker: "overview-camera-and-labels-settled" },
        { keyframe: "exit", stateId: "overview-controls-cleared", subjectId: "solar-system-origin", settleMarker: "overview-interaction-idle" },
      ],
    },
    {
      id: "inspect",
      label: "Planet inspection",
      frames: [
        { keyframe: "entry", stateId: "earth-inspect", subjectId: "earth", settleMarker: "earth-closeup-settled" },
        { keyframe: "hero", stateId: "saturn-inspect", subjectId: "saturn", settleMarker: "saturn-ring-frame-settled" },
        RETURNED_OVERVIEW,
      ],
    },
    {
      id: "stellar-exoplanet",
      label: "Stellar and exoplanet exploration",
      frames: [
        { keyframe: "entry", stateId: "sirius-focus", subjectId: "nearby-star:sirius", settleMarker: "stellar-portrait-settled" },
        { keyframe: "hero", stateId: "trappist-1-system", subjectId: "trappist-1", settleMarker: "exoplanet-system-settled" },
        RETURNED_OVERVIEW,
      ],
    },
    {
      id: "launch",
      label: "LEO launch",
      frames: [
        { keyframe: "entry", stateId: "leo-prelaunch", subjectId: "leo_satellite", settleMarker: "launch-panel-and-pad-ready" },
        { keyframe: "hero", stateId: "leo-max-q", subjectId: "leo_satellite", settleMarker: "launch-max-q-or-liftoff-stable" },
        { ...RETURNED_OVERVIEW, stateId: "launch-aborted-overview", settleMarker: "launch-resources-released" },
      ],
    },
    {
      id: "relativity",
      label: "Weak-field and Kerr relativity",
      frames: [
        { keyframe: "entry", stateId: "mercury-weak-field", subjectId: "mercury", settleMarker: "mercury-relativity-readout-ready" },
        { keyframe: "hero", stateId: "kerr-studio", subjectId: "kerr-black-hole", settleMarker: "kerr-geodesics-settled" },
        RETURNED_OVERVIEW,
      ],
    },
    {
      id: "scene-lab",
      label: "Scene Lab controlled copy",
      frames: [
        { keyframe: "entry", stateId: "scene-lab-current", subjectId: "scene-lab-current", settleMarker: "scene-lab-panel-ready" },
        { keyframe: "hero", stateId: "scene-lab-candidate", subjectId: "scene-lab-current", settleMarker: "scene-lab-candidate-stable" },
        { ...RETURNED_OVERVIEW, stateId: "scene-lab-closed-overview", settleMarker: "scene-lab-session-preserved" },
      ],
    },
  ],
  metrics: {
    perceptualReviewWarningBelow: 0.94,
    desktopOccluderGapPx: 24,
    mobileOccluderGapPx: 16,
    planetCoverage: [0.4, 0.52],
    stellarCoverage: [0.34, 0.48],
    cameraResponseMaxMs: 100,
    desktopSettleMs: [700, 1000],
    mobileSettleMs: [900, 1200],
    exitSettleMs: [650, 950],
    cameraOvershootMaxRatio: 0.02,
    stablePerceptualSimilarity: 0.97,
    saturnBodyDiscCoverage: [0.38, 0.48],
    saturnTotalSilhouetteCoverageMax: 0.65,
  },
  baselineUpdateEnvironmentVariable: "ATLAS_UPDATE_VISUAL_BASELINES",
  boundary:
    "QA-only visual contract. It does not add runtime root attributes, replace V9 assets, alter scientific coordinates, mutate live or worker physics, or authorize automatic baseline replacement.",
};

export function atlasVisualJourneyScreenshotName(
  viewport: AtlasVisualViewportId,
  journey: AtlasVisualJourneyId,
  keyframe: AtlasVisualJourneyKeyframe,
): string {
  return `${viewport}/${journey}-${keyframe}.png`;
}

export function atlasVisualJourneyScreenshotCount(): number {
  return (
    Object.keys(ATLAS_VISUAL_JOURNEY_MANIFEST_V193.viewports).length *
    ATLAS_VISUAL_JOURNEY_MANIFEST_V193.journeys.reduce(
      (sum, journey) => sum + journey.frames.length,
      0,
    )
  );
}
