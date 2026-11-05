export type AtlasVisualOcclusionRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type AtlasLabelLayoutCandidate = {
  id: string;
  priority: number;
  selected: boolean;
  rect: AtlasVisualOcclusionRect;
};

export type AtlasLabelLayoutResult = {
  id: string;
  visible: boolean;
  shiftX: number;
  shiftY: number;
  reason: "placed" | "viewport" | "ui-occluder" | "label-collision";
};

const SHIFT_ATTEMPTS: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, -14],
  [0, 14],
  [18, 0],
  [-18, 0],
  [18, -14],
  [-18, -14],
  [18, 14],
  [-18, 14],
  [0, -28],
  [0, 28],
  [30, 0],
  [-30, 0],
  [30, -22],
  [-30, -22],
  [30, 22],
  [-30, 22],
  [44, 0],
  [-44, 0],
];

function shifted(
  rect: AtlasVisualOcclusionRect,
  shiftX: number,
  shiftY: number,
): AtlasVisualOcclusionRect {
  return {
    left: rect.left + shiftX,
    top: rect.top + shiftY,
    right: rect.right + shiftX,
    bottom: rect.bottom + shiftY,
  };
}

function overlaps(
  a: AtlasVisualOcclusionRect,
  b: AtlasVisualOcclusionRect,
  padding = 0,
): boolean {
  return !(
    a.right + padding <= b.left ||
    a.left >= b.right + padding ||
    a.bottom + padding <= b.top ||
    a.top >= b.bottom + padding
  );
}

function insideViewport(
  rect: AtlasVisualOcclusionRect,
  width: number,
  height: number,
  margin: number,
): boolean {
  return (
    rect.left >= margin &&
    rect.top >= margin &&
    rect.right <= width - margin &&
    rect.bottom <= height - margin
  );
}

function viewportClampShift(
  rect: AtlasVisualOcclusionRect,
  width: number,
  height: number,
  margin: number,
): readonly [number, number] {
  const shiftX = rect.left < margin
    ? margin - rect.left
    : rect.right > width - margin
      ? width - margin - rect.right
      : 0;
  const shiftY = rect.top < margin
    ? margin - rect.top
    : rect.bottom > height - margin
      ? height - margin - rect.bottom
      : 0;
  return [shiftX, shiftY];
}

export function solveAtlasLabelLayout(args: {
  candidates: readonly AtlasLabelLayoutCandidate[];
  occluders: readonly AtlasVisualOcclusionRect[];
  viewportWidth: number;
  viewportHeight: number;
  marginPx?: number;
  collisionPaddingPx?: number;
  occluderPaddingPx?: number;
}): AtlasLabelLayoutResult[] {
  const margin = Math.max(0, args.marginPx ?? 6);
  const collisionPadding = Math.max(0, args.collisionPaddingPx ?? 4);
  const occluderPadding = Math.max(0, args.occluderPaddingPx ?? 2);
  const accepted: AtlasVisualOcclusionRect[] = [];
  const resultById = new Map<string, AtlasLabelLayoutResult>();
  const ordered = [...args.candidates].sort(
    (a, b) => Number(b.selected) - Number(a.selected) || b.priority - a.priority || a.id.localeCompare(b.id),
  );

  for (const candidate of ordered) {
    let viewportRejected = false;
    let occluderRejected = false;
    let collisionRejected = false;
    let placement: AtlasLabelLayoutResult | null = null;
    const clampShift = viewportClampShift(
      candidate.rect,
      args.viewportWidth,
      args.viewportHeight,
      margin,
    );
    const clampReachable = Math.abs(clampShift[0]) <= 56 && Math.abs(clampShift[1]) <= 56;
    const attempts = clampReachable && (clampShift[0] || clampShift[1])
      ? [clampShift, ...SHIFT_ATTEMPTS]
      : SHIFT_ATTEMPTS;
    for (const [shiftX, shiftY] of attempts) {
      const rect = shifted(candidate.rect, shiftX, shiftY);
      if (!insideViewport(rect, args.viewportWidth, args.viewportHeight, margin)) {
        viewportRejected = true;
        continue;
      }
      if (args.occluders.some((occluder) => overlaps(rect, occluder, occluderPadding))) {
        occluderRejected = true;
        continue;
      }
      if (accepted.some((other) => overlaps(rect, other, collisionPadding))) {
        collisionRejected = true;
        continue;
      }
      accepted.push(rect);
      placement = { id: candidate.id, visible: true, shiftX, shiftY, reason: "placed" };
      break;
    }

    if (!placement) {
      placement = {
        id: candidate.id,
        visible: candidate.selected && clampReachable && insideViewport(
          shifted(candidate.rect, clampShift[0], clampShift[1]),
          args.viewportWidth,
          args.viewportHeight,
          margin,
        ),
        shiftX: candidate.selected ? clampShift[0] : 0,
        shiftY: candidate.selected ? clampShift[1] : 0,
        reason: occluderRejected
          ? "ui-occluder"
          : viewportRejected
            ? "viewport"
            : collisionRejected
              ? "label-collision"
              : "label-collision",
      };
      if (placement.visible) accepted.push(shifted(candidate.rect, placement.shiftX, placement.shiftY));
    }
    resultById.set(candidate.id, placement);
  }

  return args.candidates.map((candidate) => resultById.get(candidate.id)!);
}
