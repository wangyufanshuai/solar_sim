import type { SkyAtlasPlaybackState, SkyAtlasRoute } from "./skyAtlas";

export const INITIAL_SKY_ATLAS_PLAYBACK: SkyAtlasPlaybackState = {
  status: "idle",
  route: null,
  stopIndex: 0,
  speed: 1,
  progress: 0,
};

export type SkyAtlasPlaybackAction =
  | { type: "play"; route: SkyAtlasRoute; startIndex?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "jump"; stopIndex: number }
  | { type: "speed"; speed: SkyAtlasPlaybackState["speed"] }
  | { type: "progress"; progress: number };

function wrappedIndex(route: SkyAtlasRoute | null, index: number) {
  const length = route?.stops.length ?? 0;
  return length ? (index + length) % length : 0;
}

export function skyAtlasPlaybackReducer(
  state: SkyAtlasPlaybackState,
  action: SkyAtlasPlaybackAction,
): SkyAtlasPlaybackState {
  if (action.type === "play") {
    return {
      status: action.route.stops.length ? "playing" : "idle",
      route: action.route,
      stopIndex: wrappedIndex(action.route, action.startIndex ?? 0),
      speed: state.speed,
      progress: 0,
    };
  }
  if (action.type === "stop") return { ...INITIAL_SKY_ATLAS_PLAYBACK, speed: state.speed };
  if (action.type === "pause") return state.route ? { ...state, status: "paused" } : state;
  if (action.type === "resume") return state.route ? { ...state, status: "playing" } : state;
  if (action.type === "speed") return { ...state, speed: action.speed };
  if (action.type === "progress") return { ...state, progress: Math.max(0, Math.min(1, action.progress)) };
  if (action.type === "next") {
    return { ...state, stopIndex: wrappedIndex(state.route, state.stopIndex + 1), progress: 0 };
  }
  if (action.type === "previous") {
    return { ...state, stopIndex: wrappedIndex(state.route, state.stopIndex - 1), progress: 0 };
  }
  if (action.type === "jump") {
    return { ...state, stopIndex: wrappedIndex(state.route, action.stopIndex), progress: 0 };
  }
  return state;
}

export function skyAtlasPlaybackHoldMs(
  route: SkyAtlasRoute | null,
  stopIndex: number,
  speed: SkyAtlasPlaybackState["speed"],
) {
  const stop = route?.stops[stopIndex];
  return Math.max(800, (stop?.holdMs ?? 7500) / speed);
}
