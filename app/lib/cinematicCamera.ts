export type CinematicCameraPresetId =
  | "wide-milky-way"
  | "sun-corona"
  | "earth-moon"
  | "jupiter-storm"
  | "saturn-rings"
  | "mission-overview";

export type CinematicCameraPreset = {
  id: CinematicCameraPresetId;
  label: string;
  bodyId?: string;
  positionOffset: [number, number, number];
  targetOffset: [number, number, number];
  fov: number;
  durationMs: number;
};

export const CINEMATIC_CAMERA_EVENT = "solar-sim-cinematic-camera";
export const CINEMATIC_TOUR_EVENT = "solar-sim-cinematic-tour";

export const CINEMATIC_CAMERA_PRESETS: CinematicCameraPreset[] = [
  { id: "wide-milky-way", label: "Wide Milky Way", positionOffset: [-310, 108, 560], targetOffset: [0, 0, 0], fov: 39, durationMs: 1400 },
  { id: "sun-corona", label: "Sun Corona", bodyId: "sun", positionOffset: [0, 15, 48], targetOffset: [0, 0, 0], fov: 32, durationMs: 1150 },
  { id: "earth-moon", label: "Earth / Moon", bodyId: "earth", positionOffset: [0, 3.2, 13], targetOffset: [0, 0, 0], fov: 35, durationMs: 1250 },
  { id: "jupiter-storm", label: "Jupiter Storm", bodyId: "jupiter", positionOffset: [0.8, 2.2, 11], targetOffset: [0, 0, 0], fov: 28, durationMs: 1200 },
  { id: "saturn-rings", label: "Saturn Rings", bodyId: "saturn", positionOffset: [6.8, 4.2, 13.5], targetOffset: [0, 0, 0], fov: 31, durationMs: 1300 },
  { id: "mission-overview", label: "Mission Overview", positionOffset: [0, 420, 1180], targetOffset: [250, 0, 0], fov: 42, durationMs: 1500 },
];

export function dispatchCinematicCameraPreset(id: CinematicCameraPresetId): void {
  window.dispatchEvent(new CustomEvent(CINEMATIC_CAMERA_EVENT, { detail: { id } }));
}

export const CINEMATIC_TOUR_SEQUENCE: Array<{ id: CinematicCameraPresetId; holdMs: number }> = [
  { id: "wide-milky-way", holdMs: 12000 },
  { id: "sun-corona", holdMs: 12000 },
  { id: "earth-moon", holdMs: 15000 },
  { id: "jupiter-storm", holdMs: 12000 },
  { id: "saturn-rings", holdMs: 15000 },
  { id: "mission-overview", holdMs: 14000 },
];

export function dispatchCinematicCameraTour(): void {
  window.dispatchEvent(new CustomEvent(CINEMATIC_TOUR_EVENT, { detail: { sequence: CINEMATIC_TOUR_SEQUENCE } }));
  let delay = 0;
  for (const step of CINEMATIC_TOUR_SEQUENCE) {
    window.setTimeout(() => dispatchCinematicCameraPreset(step.id), delay);
    delay += step.holdMs;
  }
}
