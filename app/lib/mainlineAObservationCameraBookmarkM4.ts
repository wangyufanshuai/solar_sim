import type { AtlasScaleBand } from "./atlasRuntimeStateV256";

export const MAINLINE_A_OBSERVATION_CAMERA_BOOKMARK_M4 = "mainline-a-observation-camera-bookmark-m4-v1" as const;

type Vector3Tuple = readonly [number, number, number];
export type MainlineAObservationCameraBookmarkPayloadM4 = {
  catalogId: string;
  sceneMode: "atlas" | "inspect";
  sceneRevision: number;
  scaleBand: AtlasScaleBand;
  scaleRequestId: number;
  focusRequestId: number;
  pose: {
    position: Vector3Tuple;
    target: Vector3Tuple;
    up: Vector3Tuple;
    fov: number;
    zoom: number;
  };
};

/** A session capability issued by the mounted camera bridge, never imported data. */
export type MainlineAObservationCameraBookmarkM4 = MainlineAObservationCameraBookmarkPayloadM4 & {
  version: typeof MAINLINE_A_OBSERVATION_CAMERA_BOOKMARK_M4;
  bridgeToken: number;
};

type CameraBridge = {
  capture: () => MainlineAObservationCameraBookmarkPayloadM4 | null;
  restore: (bookmark: MainlineAObservationCameraBookmarkM4, expectedFocusRequestId: number) => boolean;
};

let nextToken = 0;
let current: { token: number; bridge: CameraBridge } | null = null;
const issued = new WeakSet<MainlineAObservationCameraBookmarkM4>();

/** Only the existing camera bridge registers; late effect cleanup cannot remove its successor. */
export function registerMainlineAObservationCameraBridgeM4(bridge: CameraBridge): () => void {
  const registration = { token: ++nextToken, bridge };
  current = registration;
  return () => { if (current === registration) current = null; };
}

export function captureMainlineAObservationBookmarkM4(): MainlineAObservationCameraBookmarkM4 | null {
  const registration = current;
  if (!registration) return null;
  const payload = registration.bridge.capture();
  if (!payload || current !== registration) return null;
  const tuple = (value: Vector3Tuple): Vector3Tuple => Object.freeze([value[0], value[1], value[2]]);
  const bookmark: MainlineAObservationCameraBookmarkM4 = Object.freeze({
    ...payload,
    version: MAINLINE_A_OBSERVATION_CAMERA_BOOKMARK_M4,
    bridgeToken: registration.token,
    pose: Object.freeze({
      ...payload.pose,
      position: tuple(payload.pose.position),
      target: tuple(payload.pose.target),
      up: tuple(payload.pose.up),
    }),
  });
  issued.add(bookmark);
  return bookmark;
}

/** The caller must first focus the saved catalogue object and wait for that exact request to lock. */
export function restoreMainlineAObservationBookmarkM4(
  bookmark: MainlineAObservationCameraBookmarkM4,
  expectedFocusRequestId: number,
): boolean {
  if (!current || !issued.has(bookmark) || bookmark.bridgeToken !== current.token ||
      !Number.isSafeInteger(expectedFocusRequestId) || expectedFocusRequestId <= bookmark.focusRequestId) return false;
  return current.bridge.restore(bookmark, expectedFocusRequestId);
}
