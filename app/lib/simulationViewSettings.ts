/**
 * View toggles aligned with a Universe Sandbox-style Graphics / View panel.
 */
export type SimulationViewSettings = {
  showBodyLabels: boolean;
  showOrbitTrails: boolean;
  showOsculatingOrbits: boolean;
  showReferenceOrbits: boolean;
  showGalaxyBackground: boolean;
  showGaiaStars: boolean;
  showConstellations: boolean;
  showNebulaImages: boolean;
  showDeepSkyMarkers: boolean;
  showMissionTrajectory: boolean;
  highQualityRendering: boolean;
  showKerrBlackHole: boolean;
  /** CR3BP L1-L5 and effective-potential contours. */
  showLagrangePoints: boolean;
  /** Doppler/searchlight/aberration visual teaching layer. */
  showRelativisticOptics: boolean;
};

export const DEFAULT_SIMULATION_VIEW_SETTINGS: SimulationViewSettings = {
  showBodyLabels: true,
  showOrbitTrails: true,
  showOsculatingOrbits: true,
  showReferenceOrbits: true,
  showGalaxyBackground: true,
  showGaiaStars: true,
  showConstellations: true,
  showNebulaImages: true,
  showDeepSkyMarkers: true,
  showMissionTrajectory: true,
  highQualityRendering: false,
  showKerrBlackHole: false,
  showLagrangePoints: false,
  showRelativisticOptics: true,
};
