export type CameraFocusMode = "orbit" | "inspect" | "lock";

export type CameraFocusCommand =
  | {
      kind: "body";
      bodyIndex: number;
      mode: CameraFocusMode;
      nonce: number;
    }
  | {
      kind: "direction";
      direction: readonly [number, number, number];
      targetId: string;
      nonce: number;
    }
  | {
      kind: "origin";
      nonce: number;
    };

export type CameraFocusViewport = "desktop" | "mobile" | "unknown";

export const CAMERA_FOCUS_DURATION_MIN_MS = 700;
export const CAMERA_FOCUS_DURATION_MAX_MS = 1200;
export const CAMERA_FOCUS_DEFAULT_MS = 900;
export const CAMERA_FOCUS_REDUCED_MOTION_MS = 80;

export function smootherstep01(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function adaptiveCameraFocusDurationMs(
  angularDistanceRad: number,
  distanceRatio: number,
  viewport: CameraFocusViewport = "unknown",
): number {
  if (viewport === "unknown") return CAMERA_FOCUS_DEFAULT_MS;
  const angleWeight = Math.max(0, Math.min(1, angularDistanceRad / Math.PI));
  const distanceWeight = Math.max(
    0,
    Math.min(1, Math.abs(Math.log2(Math.max(distanceRatio, 1e-4))) / 8),
  );
  const minDuration = viewport === "mobile" ? 900 : CAMERA_FOCUS_DURATION_MIN_MS;
  const maxDuration = viewport === "mobile" ? CAMERA_FOCUS_DURATION_MAX_MS : 1000;
  const duration = minDuration + angleWeight * 180 + distanceWeight * 120;
  return Math.round(
    Math.max(minDuration, Math.min(maxDuration, duration)),
  );
}

export function resolvedCameraFocusDurationMs(
  angularDistanceRad: number,
  distanceRatio: number,
  viewport: CameraFocusViewport,
  reducedMotion: boolean,
): number {
  return reducedMotion
    ? CAMERA_FOCUS_REDUCED_MOTION_MS
    : adaptiveCameraFocusDurationMs(angularDistanceRad, distanceRatio, viewport);
}

export function cameraFocusCommandKey(command: CameraFocusCommand): string {
  if (command.kind === "body") {
    return `${command.kind}:${command.bodyIndex}:${command.mode}:${command.nonce}`;
  }
  if (command.kind === "direction") {
    return `${command.kind}:${command.targetId}:${command.nonce}`;
  }
  return `${command.kind}:${command.nonce}`;
}
