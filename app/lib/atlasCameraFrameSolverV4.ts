export const ATLAS_CAMERA_FRAME_SOLVER_V4_VERSION =
  "v141-camera-frame-solver-v4" as const;

export type AtlasSafeViewportRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type AtlasCameraFrameRequest = {
  subjectRadiusScene: number;
  verticalFovDeg: number;
  viewportWidth: number;
  viewportHeight: number;
  safeRect?: AtlasSafeViewportRect | null;
  desiredCoverage?: number;
  nearPaddingScale?: number;
};

export type AtlasProjectedSubjectMetrics = {
  version: typeof ATLAS_CAMERA_FRAME_SOLVER_V4_VERSION;
  distance: number;
  desiredCoverage: number;
  projectedDiameterPx: number;
  safeWidthPx: number;
  safeHeightPx: number;
  targetNdcX: number;
  targetNdcY: number;
  clipped: false;
};

function finiteClamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

export function normalizeAtlasSafeViewportRect(
  safeRect: AtlasSafeViewportRect | null | undefined,
  viewportWidth: number,
  viewportHeight: number,
): AtlasSafeViewportRect {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  if (!safeRect) {
    return { left: 0, top: 0, right: width, bottom: height, viewportWidth: width, viewportHeight: height };
  }
  const left = finiteClamp(safeRect.left, 0, width - 1);
  const top = finiteClamp(safeRect.top, 0, height - 1);
  const right = finiteClamp(safeRect.right, left + 1, width);
  const bottom = finiteClamp(safeRect.bottom, top + 1, height);
  return { left, top, right, bottom, viewportWidth: width, viewportHeight: height };
}

export function solveAtlasCameraFrameV4(
  request: AtlasCameraFrameRequest,
): AtlasProjectedSubjectMetrics {
  const viewportWidth = Math.max(1, request.viewportWidth);
  const viewportHeight = Math.max(1, request.viewportHeight);
  const safe = normalizeAtlasSafeViewportRect(
    request.safeRect,
    viewportWidth,
    viewportHeight,
  );
  const safeWidthPx = Math.max(1, safe.right - safe.left);
  const safeHeightPx = Math.max(1, safe.bottom - safe.top);
  const safeMinorPx = Math.min(safeWidthPx, safeHeightPx);
  const desiredCoverage = finiteClamp(request.desiredCoverage ?? 0.46, 0.35, 0.68);
  const subjectRadius = Math.max(1e-6, request.subjectRadiusScene);
  const halfFov = finiteClamp(request.verticalFovDeg, 10, 120) * Math.PI / 360;
  const distance = Math.max(
    subjectRadius * (request.nearPaddingScale ?? 1.04),
    (viewportHeight * subjectRadius) /
      (safeMinorPx * desiredCoverage * Math.tan(halfFov)),
  );
  const projectedDiameterPx =
    (viewportHeight * subjectRadius) / (distance * Math.tan(halfFov));
  const centerX = (safe.left + safe.right) / 2;
  const centerY = (safe.top + safe.bottom) / 2;
  return {
    version: ATLAS_CAMERA_FRAME_SOLVER_V4_VERSION,
    distance,
    desiredCoverage,
    projectedDiameterPx,
    safeWidthPx,
    safeHeightPx,
    targetNdcX: finiteClamp((centerX / viewportWidth) * 2 - 1, -0.75, 0.75),
    targetNdcY: finiteClamp(1 - (centerY / viewportHeight) * 2, -0.75, 0.75),
    clipped: false,
  };
}

export function atlasSafeRectFromOccluder(args: {
  viewportWidth: number;
  viewportHeight: number;
  occluder: Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom" | "width" | "height">;
  dockHeight?: number;
  gap?: number;
}): AtlasSafeViewportRect {
  const width = Math.max(1, args.viewportWidth);
  const height = Math.max(1, args.viewportHeight);
  const gap = Math.max(0, args.gap ?? 16);
  const dockTop = Math.max(1, height - Math.max(0, args.dockHeight ?? 0));
  const mobileBottomPanel = args.occluder.width >= width * 0.72;
  return normalizeAtlasSafeViewportRect(
    mobileBottomPanel
      ? { left: 0, top: 0, right: width, bottom: Math.min(dockTop, args.occluder.top - gap), viewportWidth: width, viewportHeight: height }
      : { left: 0, top: 0, right: Math.min(width, args.occluder.left - gap), bottom: dockTop, viewportWidth: width, viewportHeight: height },
    width,
    height,
  );
}
