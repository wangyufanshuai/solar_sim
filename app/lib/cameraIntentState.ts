export type CameraIntentKind =
  | "free"
  | "bodyFocus"
  | "bodyLock"
  | "skyDirectionFocus"
  | "missionPreview"
  | "cinematic"
  | "launchFollow";

export type CameraIntentState = {
  kind: CameraIntentKind;
  targetLabel?: string;
  bodyIndex?: number;
  progress?: number;
  distance?: number;
  lastAction?: CameraIntentAction["type"];
  transitionReason?: string;
  updatedAt: number;
};

export type CameraIntentAction =
  | { type: "reset"; targetLabel?: string; now?: number; reason?: string }
  | { type: "focusBody"; bodyIndex: number; targetLabel?: string; progress?: number; now?: number; reason?: string }
  | { type: "lockBody"; bodyIndex: number; targetLabel?: string; distance?: number; progress?: number; now?: number; reason?: string }
  | { type: "focusEarthMoon"; now?: number; reason?: string }
  | { type: "focusSkyDirection"; progress?: number; distance?: number; now?: number; reason?: string }
  | { type: "missionPreview"; targetLabel?: string; progress?: number; now?: number; reason?: string }
  | { type: "cinematic"; targetLabel: string; progress?: number; distance?: number; now?: number; reason?: string }
  | { type: "launchFollow"; targetLabel?: string; now?: number; reason?: string }
  | { type: "updateLock"; bodyIndex: number; targetLabel?: string; distance?: number; now?: number; reason?: string };

export function createCameraIntentState(): CameraIntentState {
  return { kind: "free", updatedAt: 0 };
}

function at(action: CameraIntentAction) {
  return action.now ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
}

function withMeta(
  state: Omit<CameraIntentState, "lastAction" | "transitionReason">,
  action: CameraIntentAction,
  fallbackReason: string,
): CameraIntentState {
  return {
    ...state,
    lastAction: action.type,
    transitionReason: action.reason ?? fallbackReason,
  };
}

export function cameraIntentReducer(
  state: CameraIntentState,
  action: CameraIntentAction,
): CameraIntentState {
  if (state.kind === "launchFollow" && action.type !== "reset" && action.type !== "launchFollow") {
    return withMeta({ ...state, updatedAt: at(action) }, action, "launch follow owns camera");
  }

  switch (action.type) {
    case "reset":
      return withMeta(
        { kind: "free", targetLabel: action.targetLabel, updatedAt: at(action) },
        action,
        "reset cleared camera intent",
      );
    case "focusBody":
      return withMeta(
        {
          kind: "bodyFocus",
          bodyIndex: action.bodyIndex,
          targetLabel: action.targetLabel,
          progress: action.progress,
          updatedAt: at(action),
        },
        action,
        "body focus requested",
      );
    case "lockBody":
      return withMeta(
        {
          kind: "bodyLock",
          bodyIndex: action.bodyIndex,
          targetLabel: action.targetLabel,
          progress: action.progress,
          distance: action.distance,
          updatedAt: at(action),
        },
        action,
        state.kind === "skyDirectionFocus" ? "body lock overrides sky focus" : "body lock requested",
      );
    case "focusEarthMoon":
      return withMeta(
        { kind: "bodyFocus", targetLabel: "Earth-Moon", progress: 0, updatedAt: at(action) },
        action,
        "earth moon focus requested",
      );
    case "focusSkyDirection":
      return withMeta(
        {
          kind: "skyDirectionFocus",
          targetLabel: "sky direction",
          progress: action.progress,
          distance: action.distance,
          updatedAt: at(action),
        },
        action,
        state.kind === "bodyFocus" ? "sky search overrides body focus" : "sky direction focus requested",
      );
    case "missionPreview":
      return withMeta(
        {
          kind: "missionPreview",
          targetLabel: action.targetLabel ?? "mission preview",
          progress: action.progress,
          updatedAt: at(action),
        },
        action,
        "mission preview owns camera",
      );
    case "cinematic":
      return withMeta(
        {
          kind: "cinematic",
          targetLabel: action.targetLabel,
          progress: action.progress,
          distance: action.distance,
          updatedAt: at(action),
        },
        action,
        "cinematic preset transition",
      );
    case "launchFollow":
      return withMeta(
        {
          kind: "launchFollow",
          targetLabel: action.targetLabel ?? "launch vehicle",
          updatedAt: at(action),
        },
        action,
        "launch follow overrides all camera intents",
      );
    case "updateLock":
      return withMeta(
        {
          kind: "bodyLock",
          bodyIndex: action.bodyIndex,
          targetLabel: action.targetLabel,
          distance: action.distance,
          updatedAt: at(action),
        },
        action,
        "locked body distance/view updated",
      );
  }
}
