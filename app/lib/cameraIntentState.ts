export type CameraIntentKind =
  | "free"
  | "bodyFocus"
  | "bodyLock"
  | "skyDirectionFocus"
  | "missionPreview"
  | "launchFollow";

export type CameraIntentState = {
  kind: CameraIntentKind;
  targetLabel?: string;
  bodyIndex?: number;
  progress?: number;
  distance?: number;
  updatedAt: number;
};

export function createCameraIntentState(): CameraIntentState {
  return { kind: "free", updatedAt: 0 };
}
