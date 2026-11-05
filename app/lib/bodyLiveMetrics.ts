import type { MutableRefObject } from "react";

/** Updated every frame inside R3F while a body is selected. */
export type BodyLiveMetrics = {
  /** |v| in km/s */
  speedKms: number;
  /** Center-to-center distance Sun–body in AU (index 0 = Sun). */
  distSunAu: number;
  /** Camera to body in AU (scene length / AU_TO_SCENE). */
  distCameraAu: number;
};

export type BodyLiveMetricsRef = MutableRefObject<BodyLiveMetrics | null>;
