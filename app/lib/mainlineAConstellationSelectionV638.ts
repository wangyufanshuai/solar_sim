export type MainlineAConstellationFigureV638 = Readonly<{
  iauCode: string;
  name: string;
  waypoints: readonly (readonly [number, number])[];
  coordinateSegments?: readonly (readonly [readonly [number, number], readonly [number, number]])[];
  sourceComplete?: boolean;
  sourceIssues?: readonly string[];
}>;

export type MainlineAConstellationSelectionV638 = Readonly<{
  catalogId: string | null;
  iauCode: string | null;
  label: string | null;
  status: "none" | "invalid" | "selected";
  positions: Float32Array;
  segmentCount: number;
  issues: readonly string[];
  sourceComplete?: boolean;
}>;

export type MainlineAConstellationProjectionV638 = Readonly<{
  status: "visible" | "outside-viewport" | "invalid";
  totalSegments: number;
  visibleSegments: number;
  clippedSegments: number;
  fullyFramed: boolean;
  bounds: Readonly<{ left: number; right: number; bottom: number; top: number }> | null;
}>;

type ClipPoint = readonly [number, number, number, number];
const EMPTY_POSITIONS = new Float32Array();
const POSITION_EPSILON = 1e-8;
const CLIP_PLANES = [
  (point: ClipPoint) => point[3] + point[0],
  (point: ClipPoint) => point[3] - point[0],
  (point: ClipPoint) => point[3] + point[1],
  (point: ClipPoint) => point[3] - point[1],
  (point: ClipPoint) => point[3] + point[2],
  (point: ClipPoint) => point[3] - point[2],
  (point: ClipPoint) => point[3] - POSITION_EPSILON,
];

export function mainlineAConstellationCodeV638(catalogId: string): string | null {
  if (!catalogId.startsWith("constellation:")) return null;
  const code = catalogId.slice("constellation:".length);
  return /^[A-Z][A-Za-z]{2}$/.test(code) ? code : null;
}

export function selectMainlineAConstellationFigureV638(
  catalogId: string,
  figures: readonly MainlineAConstellationFigureV638[],
  radius: number,
): MainlineAConstellationSelectionV638 {
  const iauCode = mainlineAConstellationCodeV638(catalogId);
  const empty: MainlineAConstellationSelectionV638 = {
    catalogId: iauCode ? catalogId : null,
    iauCode,
    label: null,
    status: iauCode ? "invalid" : "none",
    positions: EMPTY_POSITIONS,
    segmentCount: 0,
    issues: [],
  };
  if (!iauCode) return empty;
  if (!Number.isFinite(radius) || radius <= 0) return { ...empty, issues: ["figure:invalid-radius"] };
  const matches = figures.filter((figure) => figure.iauCode === iauCode);
  if (matches.length !== 1) return { ...empty, issues: [matches.length ? "figure:ambiguous-code" : "figure:not-found"] };
  const figure = matches[0];
  if (figure.coordinateSegments?.some((pair) => pair.length !== 2)) {
    return { ...empty, label: figure.name, issues: ["figure:malformed-segment"] };
  }
  const coordinates = figure.coordinateSegments
    ? figure.coordinateSegments.flatMap((pair) => pair)
    : figure.waypoints;
  if (coordinates.length < 2) return { ...empty, label: figure.name, issues: ["figure:insufficient-waypoints"] };
  const directions: [number, number, number][] = [];
  for (const [index, coordinate] of coordinates.entries()) {
    const [ra, dec] = coordinate;
    if (coordinate.length !== 2 || !Number.isFinite(ra) || !Number.isFinite(dec)
      || ra < 0 || ra > 360 || dec < -90 || dec > 90) {
      return { ...empty, label: figure.name, issues: [`figure:coordinate-invalid:${index}`] };
    }
    const longitude = ra * Math.PI / 180;
    const latitude = dec * Math.PI / 180;
    directions.push([
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(longitude),
    ]);
  }
  const positions: number[] = [];
  for (let index = 1; index < directions.length; index += figure.coordinateSegments ? 2 : 1) {
    const previous = directions[index - 1];
    const next = directions[index];
    if (Math.hypot(...previous.map((value, axis) => value - next[axis])) < POSITION_EPSILON) continue;
    positions.push(...previous.map((value) => value * radius), ...next.map((value) => value * radius));
  }
  if (!positions.length) return { ...empty, label: figure.name, issues: ["figure:no-drawable-segments"] };
  const buffer = new Float32Array(positions);
  if (buffer.some((value) => !Number.isFinite(value))) {
    return { ...empty, label: figure.name, issues: ["figure:scene-coordinate-overflow"] };
  }
  return {
    catalogId,
    iauCode,
    label: figure.name,
    status: "selected",
    positions: buffer,
    segmentCount: positions.length / 6,
    issues: figure.sourceComplete === false ? ["figure:source-incomplete", ...(figure.sourceIssues ?? [])] : [],
    sourceComplete: figure.sourceComplete !== false,
  };
}

function projectPoint(positions: ArrayLike<number>, offset: number, matrix: ArrayLike<number>): ClipPoint {
  const x = positions[offset];
  const y = positions[offset + 1];
  const z = positions[offset + 2];
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15],
  ];
}

function clipSegment(a: ClipPoint, b: ClipPoint): readonly [ClipPoint, ClipPoint] | null | undefined {
  let first = 0;
  let last = 1;
  for (const plane of CLIP_PLANES) {
    const from = plane(a);
    const to = plane(b);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return undefined;
    if (from < 0 && to < 0) return null;
    if (from >= 0 && to >= 0) continue;
    const scale = Math.max(Math.abs(from), Math.abs(to));
    const crossing = (from / scale) / (from / scale - to / scale);
    if (from < 0) first = Math.max(first, crossing);
    else last = Math.min(last, crossing);
    if (first > last) return null;
  }
  const interpolate = (amount: number): ClipPoint => [
    a[0] * (1 - amount) + b[0] * amount,
    a[1] * (1 - amount) + b[1] * amount,
    a[2] * (1 - amount) + b[2] * amount,
    a[3] * (1 - amount) + b[3] * amount,
  ];
  return [interpolate(first), interpolate(last)];
}

export function projectMainlineAConstellationSegmentsV638(
  positions: ArrayLike<number>,
  worldToClip: ArrayLike<number>,
  frameBounds: Readonly<{ left: number; right: number; bottom: number; top: number }> = { left: -1, right: 1, bottom: -1, top: 1 },
): MainlineAConstellationProjectionV638 {
  const empty = { totalSegments: positions.length / 6, visibleSegments: 0, clippedSegments: 0, fullyFramed: false, bounds: null };
  if (!positions.length || positions.length % 6 || worldToClip.length !== 16
    || Array.from(positions).some((value) => !Number.isFinite(value))
    || Array.from(worldToClip).some((value) => !Number.isFinite(value))
    || Object.values(frameBounds).some((value) => !Number.isFinite(value))
    || frameBounds.left >= frameBounds.right || frameBounds.bottom >= frameBounds.top) {
    return { ...empty, status: "invalid" };
  }
  let visibleSegments = 0;
  let clippedSegments = 0;
  let fullyFramed = true;
  const bounds = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
  for (let offset = 0; offset < positions.length; offset += 6) {
    const start = projectPoint(positions, offset, worldToClip);
    const end = projectPoint(positions, offset + 3, worldToClip);
    if ([...start, ...end].some((value) => !Number.isFinite(value))) return { ...empty, status: "invalid" };
    // Test original anchors, before clipping can make an oversized line look valid.
    for (const point of [start, end]) {
      const x = point[0] / point[3];
      const y = point[1] / point[3];
      if (CLIP_PLANES.some((plane) => plane(point) < 0)
        || !Number.isFinite(x) || !Number.isFinite(y)
        || x < frameBounds.left || x > frameBounds.right || y < frameBounds.bottom || y > frameBounds.top) fullyFramed = false;
    }
    const clipped = clipSegment(start, end);
    if (clipped === undefined) return { ...empty, status: "invalid" };
    if (!clipped) { clippedSegments += 1; continue; }
    const [a, b] = clipped;
    const ax = a[0] / a[3];
    const ay = a[1] / a[3];
    const bx = b[0] / b[3];
    const by = b[1] / b[3];
    if (![ax, ay, bx, by].every(Number.isFinite)) return { ...empty, status: "invalid" };
    if (Math.hypot(ax - bx, ay - by) < POSITION_EPSILON) continue;
    visibleSegments += 1;
    bounds.left = Math.min(bounds.left, ax, bx);
    bounds.right = Math.max(bounds.right, ax, bx);
    bounds.bottom = Math.min(bounds.bottom, ay, by);
    bounds.top = Math.max(bounds.top, ay, by);
  }
  return {
    status: visibleSegments ? "visible" : "outside-viewport",
    totalSegments: positions.length / 6,
    visibleSegments,
    clippedSegments,
    fullyFramed: fullyFramed && visibleSegments > 0,
    bounds: visibleSegments ? bounds : null,
  };
}

export function mainlineAConstellationFrameStateV638(args: Readonly<{
  selection: MainlineAConstellationSelectionV638;
  enabled: boolean;
  ancestorsVisible: boolean;
  opacity: number;
  projection: MainlineAConstellationProjectionV638;
  drawObserved: boolean;
}>): "none" | "failed" | "unobserved" | "awaiting-draw" | "ready" {
  if (args.selection.status === "none") return "none";
  if (args.selection.status === "invalid" || args.selection.sourceComplete === false || args.projection.status === "invalid") return "failed";
  if (!args.enabled || !args.ancestorsVisible || !Number.isFinite(args.opacity) || args.opacity <= 0
    || args.projection.visibleSegments < 1 || !args.projection.fullyFramed) return "unobserved";
  return args.drawObserved ? "ready" : "awaiting-draw";
}

export function mainlineAConstellationCatalogRowsV638<T extends Readonly<{ id: string }>>(
  rows: readonly T[],
  canonicalCodes: readonly string[],
  scope: "all" | "canonical",
): readonly T[] {
  if (scope === "all") return rows;
  const byCode = new Map(rows.map((row) => [mainlineAConstellationCodeV638(row.id), row]));
  return canonicalCodes.flatMap((code) => {
    const row = byCode.get(code);
    return row ? [row] : [];
  });
}
