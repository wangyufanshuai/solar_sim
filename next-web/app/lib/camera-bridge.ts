/** Window events used by BottomControlBar → R3F OrbitControls bridge. */

export const CAMERA_ZOOM_EVENT = "solar-sim-camera-zoom";
export const CAMERA_FOCUS_ORIGIN_EVENT = "solar-sim-camera-focus-origin";
export const CAMERA_FOCUS_BODY_EVENT = "solar-sim-camera-focus-body";
/** 相机对准地–月质心附近并拉近（与 `earthMoonView` 视觉放大配合）。 */
export const CAMERA_FOCUS_EARTH_MOON_EVENT = "solar-sim-camera-focus-earth-moon";

export type CameraZoomDetail = { delta: number };
/** `inspect` = legacy close-up; `orbit` = one-shot framing; `lock` = follow target every frame after transition. */
export type CameraFocusBodyDetail = {
  bodyIndex: number;
  mode?: "orbit" | "inspect" | "lock";
};

export function dispatchCameraZoom(delta: number) {
  window.dispatchEvent(
    new CustomEvent<CameraZoomDetail>(CAMERA_ZOOM_EVENT, {
      detail: { delta },
      cancelable: true,
    })
  );
}

export function dispatchCameraFocusOrigin() {
  window.dispatchEvent(new CustomEvent(CAMERA_FOCUS_ORIGIN_EVENT));
}

export function dispatchCameraFocusBody(
  bodyIndex: number,
  opts?: { mode?: "orbit" | "inspect" | "lock" }
) {
  window.dispatchEvent(
    new CustomEvent<CameraFocusBodyDetail>(CAMERA_FOCUS_BODY_EVENT, {
      detail: { bodyIndex, mode: opts?.mode ?? "orbit" },
    })
  );
}

export function dispatchCameraFocusEarthMoon() {
  window.dispatchEvent(new CustomEvent(CAMERA_FOCUS_EARTH_MOON_EVENT));
}

/** Camera looks toward a sky direction (for nearby stars with no physics body). */
export const CAMERA_FOCUS_DIRECTION_EVENT = "solar-sim-camera-focus-direction";
export type CameraFocusDirectionDetail = {
  direction: [number, number, number];
};

export function dispatchCameraFocusDirection(
  direction: [number, number, number]
) {
  window.dispatchEvent(
    new CustomEvent<CameraFocusDirectionDetail>(CAMERA_FOCUS_DIRECTION_EVENT, {
      detail: { direction },
    })
  );
}
