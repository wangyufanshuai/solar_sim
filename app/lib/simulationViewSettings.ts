/**
 * View toggles aligned with a Universe Sandbox–style “Graphics / View” panel.
 */
export type SimulationViewSettings = {
  showBodyLabels: boolean;
  showOrbitTrails: boolean;
  showOsculatingOrbits: boolean;
  showReferenceOrbits: boolean;
  showKerrBlackHole: boolean;
  /** CR3BP L1–L5、有效势能等高线；地月视角为地月系，否则为日心系。 */
  showLagrangePoints: boolean;
  /** 高时间缩放 / 相对论速度下的多普勒、探照灯、星光行差（视觉近似）。 */
  showRelativisticOptics: boolean;
};

export const DEFAULT_SIMULATION_VIEW_SETTINGS: SimulationViewSettings = {
  showBodyLabels: true,
  /** Energy-tail trails: short fading tails behind each body. */
  showOrbitTrails: true,
  /** Closed Kepler ellipses OFF — eliminates ring clutter. */
  showOsculatingOrbits: true,
  /** Static reference orbit rings OFF by default — only comet-tail trails shown. */
  showReferenceOrbits: true,
  showKerrBlackHole: false,
  showLagrangePoints: false,
  showRelativisticOptics: true,
};
