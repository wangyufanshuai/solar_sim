export type CloseupCameraPreset = {
  bodyId: "sun" | "earth" | "jupiter" | "saturn";
  viewDirection: [number, number, number];
  distanceScale: number;
};

export const CLOSEUP_CAMERA_PRESETS: Record<CloseupCameraPreset["bodyId"], CloseupCameraPreset> = {
  sun: {
    bodyId: "sun",
    viewDirection: [0.42, 0.18, 0.89],
    distanceScale: 0.92,
  },
  earth: {
    bodyId: "earth",
    viewDirection: [0.34, 0.42, 0.84],
    distanceScale: 0.78,
  },
  jupiter: {
    bodyId: "jupiter",
    viewDirection: [0.48, 0.24, 0.84],
    distanceScale: 0.84,
  },
  saturn: {
    bodyId: "saturn",
    viewDirection: [0.58, 0.32, 0.75],
    distanceScale: 0.9,
  },
};

export function closeupCameraPresetForBody(bodyId: string | undefined): CloseupCameraPreset | null {
  if (bodyId === "sun" || bodyId === "earth" || bodyId === "jupiter" || bodyId === "saturn") {
    return CLOSEUP_CAMERA_PRESETS[bodyId];
  }
  return null;
}
