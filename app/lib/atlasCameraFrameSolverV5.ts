import {
  atlasSafeRectFromOccluder,
  normalizeAtlasSafeViewportRect,
  solveAtlasCameraFrameV4,
  type AtlasCameraFrameRequest,
  type AtlasSafeViewportRect,
} from "./atlasCameraFrameSolverV4";

export { atlasSafeRectFromOccluder };

export const ATLAS_CAMERA_FRAME_SOLVER_V5_VERSION =
  "v157-camera-frame-solver-v5" as const;

export type AtlasCameraFrameRequestV5 = AtlasCameraFrameRequest & {
  ringOuterRadiusScene?: number | null;
  dockHeightPx?: number;
};

export type AtlasProjectedSubjectMetricsV5 = Omit<
  ReturnType<typeof solveAtlasCameraFrameV4>,
  "version"
> & {
  version: typeof ATLAS_CAMERA_FRAME_SOLVER_V5_VERSION;
  framingRadiusScene: number;
};

function safeRectAboveDock(
  request: AtlasCameraFrameRequestV5,
): AtlasSafeViewportRect {
  const safe = normalizeAtlasSafeViewportRect(
    request.safeRect,
    request.viewportWidth,
    request.viewportHeight,
  );
  const dockTop = Math.max(safe.top + 1, request.viewportHeight - Math.max(0, request.dockHeightPx ?? 0));
  return { ...safe, bottom: Math.min(safe.bottom, dockTop) };
}

export function solveAtlasCameraFrameV5(
  request: AtlasCameraFrameRequestV5,
): AtlasProjectedSubjectMetricsV5 {
  const framingRadiusScene = Math.max(
    Math.max(1e-6, request.subjectRadiusScene),
    Math.max(0, request.ringOuterRadiusScene ?? 0),
  );
  const solved = solveAtlasCameraFrameV4({
    ...request,
    subjectRadiusScene: framingRadiusScene,
    safeRect: safeRectAboveDock(request),
  });
  return {
    ...solved,
    version: ATLAS_CAMERA_FRAME_SOLVER_V5_VERSION,
    framingRadiusScene,
  };
}
