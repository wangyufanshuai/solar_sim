import {
  KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
  KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300,
} from "./kerrCriticalCurveV300";

export const KERR_EVENT_TIMELINE_VERSION_V302 = "v302-kerr-canonical-event-timeline-v1" as const;
export const KERR_EVENT_TIMELINE_RAY_COUNT_V302 = 16 as const;
export const KERR_EVENT_RADIUS_AGREEMENT_LIMIT_M_V302 = 1e-8;

export type KerrEventKindV302 = "capture" | "escape" | "disk-hit";
export type KerrCanonicalRayIdV302 =
  | `capture-0${0 | 1 | 2 | 3 | 4 | 5}`
  | `escape-0${0 | 1 | 2 | 3 | 4 | 5}`
  | `disk-0${0 | 1 | 2 | 3}`;

export type KerrGeodesicEventV302 = Readonly<{
  sequence: number;
  kind: KerrEventKindV302;
  parameter: number;
  radiusM: number;
  valid: boolean;
  detail: string;
}>;

export type KerrFormulaTimelineV302 = Readonly<{
  formulation: "carter-mino-dop853-constraint-stabilized-v296" | "cartesian-kerr-schild-hamiltonian-dop853-v292";
  parameterization: "mino-parameter" | "cartesian-hamiltonian-affine-parameter";
  selectedEvent: KerrGeodesicEventV302;
  events: readonly KerrGeodesicEventV302[];
  radialTurningPoints: readonly number[];
  polarTurningPoints: readonly number[];
  stepCount: number;
}>;

export type KerrCanonicalEventTimelineV302 = Readonly<{
  rayId: KerrCanonicalRayIdV302;
  spinA: number;
  classification: KerrEventKindV302;
  carter: KerrFormulaTimelineV302;
  kerrSchild: KerrFormulaTimelineV302;
  selectedRadiusDifferenceM: number;
  classificationAgreement: true;
}>;

export type KerrEventTimelineViewV302 = Readonly<{
  version: typeof KERR_EVENT_TIMELINE_VERSION_V302;
  status: "canonical-event-timelines-qualified";
  geometryEvidenceSha256: typeof KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300;
  geometryFileSha256: typeof KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300;
  rayCount: typeof KERR_EVENT_TIMELINE_RAY_COUNT_V302;
  classCounts: Readonly<Record<KerrEventKindV302, number>>;
  timelines: readonly KerrCanonicalEventTimelineV302[];
  maxima: Readonly<{
    selectedRadiusDifferenceM: number;
    eventsPerFormula: number;
    radialTurningPointsPerFormula: number;
    polarTurningPointsPerFormula: number;
  }>;
  parameterComparisonBoundary: "formula-parameters-are-not-cross-compared";
  denseBoundary: "canonical-16-rays-not-dense-campaign";
}>;

const CARTER = "carter-mino-dop853-constraint-stabilized-v296" as const;
const KERR_SCHILD = "cartesian-kerr-schild-hamiltonian-dop853-v292" as const;
const EXPECTED_RAY_IDS: readonly KerrCanonicalRayIdV302[] = Object.freeze([
  "capture-00", "capture-01", "capture-02", "capture-03", "capture-04", "capture-05",
  "escape-00", "escape-01", "escape-02", "escape-03", "escape-04", "escape-05",
  "disk-00", "disk-01", "disk-02", "disk-03",
]);
const VALID_DETAILS = new Set([
  "capture-terminal-event",
  "escape-terminal-event",
  "equatorial-crossing-outside-disk",
  "equatorial-crossing-in-disk",
  "z-crossing-outside-disk",
  "z-crossing-in-disk",
]);

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v302-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v302-${label}-non-finite`);
  return value;
}

function eventKind(value: unknown, label: string): KerrEventKindV302 {
  if (value !== "capture" && value !== "escape" && value !== "disk-hit") throw new Error(`v302-${label}-kind-invalid`);
  return value;
}

function parseEvent(value: unknown, sequence: number): KerrGeodesicEventV302 {
  const candidate = record(value, `event-${sequence}`);
  const detail = typeof candidate.detail === "string" ? candidate.detail : "";
  if (!VALID_DETAILS.has(detail) || typeof candidate.valid !== "boolean") throw new Error("v302-event-contract-invalid");
  const parameter = finite(candidate.parameter, "event-parameter");
  const radiusM = finite(candidate.radiusM, "event-radius");
  if (parameter < 0 || radiusM <= 0) throw new Error("v302-event-domain-invalid");
  return Object.freeze({
    sequence,
    kind: eventKind(candidate.kind, "event"),
    parameter,
    radiusM,
    valid: candidate.valid,
    detail,
  });
}

function turningPoints(value: unknown, label: string): readonly number[] {
  if (!Array.isArray(value) || value.length > 8) throw new Error(`v302-${label}-invalid`);
  const points = value.map((entry, index) => finite(entry, `${label}-${index}`));
  if (points.some((point, index) => point < 0 || (index > 0 && point <= points[index - 1]))) {
    throw new Error(`v302-${label}-order-invalid`);
  }
  return Object.freeze(points);
}

function parseFormulaTimeline(
  value: unknown,
  formulation: typeof CARTER | typeof KERR_SCHILD,
  classification: KerrEventKindV302,
): KerrFormulaTimelineV302 {
  const candidate = record(value, "formula");
  if (candidate.formulation !== formulation) throw new Error("v302-formulation-identity-mismatch");
  if (!Array.isArray(candidate.events) || candidate.events.length < 1 || candidate.events.length > 4) {
    throw new Error("v302-event-count-invalid");
  }
  const events = candidate.events.map(parseEvent);
  if (events.some((event, index) => index > 0 && event.parameter <= events[index - 1].parameter)) {
    throw new Error("v302-event-order-invalid");
  }
  const selectedSource = record(candidate.selectedEvent, "selected-event");
  const selectedEvent = parseEvent({ ...selectedSource, valid: selectedSource.valid }, 0);
  const earliestValid = events.find((event) => event.valid);
  if (!earliestValid || !selectedEvent.valid || selectedEvent.kind !== classification
    || earliestValid.kind !== selectedEvent.kind
    || earliestValid.parameter !== selectedEvent.parameter
    || earliestValid.radiusM !== selectedEvent.radiusM
    || earliestValid.detail !== selectedEvent.detail) {
    throw new Error("v302-earliest-valid-event-conservation-failed");
  }
  const stepCount = finite(candidate.stepCount, "step-count");
  if (!Number.isSafeInteger(stepCount) || stepCount < 1) throw new Error("v302-step-count-invalid");
  return Object.freeze({
    formulation,
    parameterization: formulation === CARTER ? "mino-parameter" : "cartesian-hamiltonian-affine-parameter",
    selectedEvent,
    events: Object.freeze(events),
    radialTurningPoints: turningPoints(candidate.radialTurningPoints, "radial-turning-points"),
    polarTurningPoints: turningPoints(candidate.polarTurningPoints, "polar-turning-points"),
    stepCount,
  });
}

function createFromFormulaRows(
  carterRows: Map<string, UnknownRecord>,
  kerrSchildRows: Map<string, UnknownRecord>,
): KerrEventTimelineViewV302 {
  const classCounts: Record<KerrEventKindV302, number> = { capture: 0, escape: 0, "disk-hit": 0 };
  const timelines = EXPECTED_RAY_IDS.map((rayId) => {
    const carterSource = carterRows.get(rayId);
    const kerrSchildSource = kerrSchildRows.get(rayId);
    if (!carterSource || !kerrSchildSource) throw new Error("v302-canonical-ray-missing");
    const carterClass = eventKind(carterSource.classification, "carter-classification");
    const kerrSchildClass = eventKind(kerrSchildSource.classification, "ks-classification");
    const spinA = finite(carterSource.spin, "spin");
    if (carterClass !== kerrSchildClass || spinA !== finite(kerrSchildSource.spin, "ks-spin")) {
      throw new Error("v302-formulation-classification-mismatch");
    }
    const carter = parseFormulaTimeline(carterSource, CARTER, carterClass);
    const kerrSchild = parseFormulaTimeline(kerrSchildSource, KERR_SCHILD, carterClass);
    const selectedRadiusDifferenceM = Math.abs(carter.selectedEvent.radiusM - kerrSchild.selectedEvent.radiusM);
    if (selectedRadiusDifferenceM >= KERR_EVENT_RADIUS_AGREEMENT_LIMIT_M_V302) {
      throw new Error("v302-selected-radius-agreement-failed");
    }
    classCounts[carterClass] += 1;
    return Object.freeze({
      rayId,
      spinA,
      classification: carterClass,
      carter,
      kerrSchild,
      selectedRadiusDifferenceM,
      classificationAgreement: true as const,
    });
  });
  if (classCounts.capture !== 6 || classCounts.escape !== 6 || classCounts["disk-hit"] !== 4) {
    throw new Error("v302-class-count-conservation-failed");
  }
  const formulas = timelines.flatMap((timeline) => [timeline.carter, timeline.kerrSchild]);
  const maxima = Object.freeze({
    selectedRadiusDifferenceM: Math.max(...timelines.map((timeline) => timeline.selectedRadiusDifferenceM)),
    eventsPerFormula: Math.max(...formulas.map((formula) => formula.events.length)),
    radialTurningPointsPerFormula: Math.max(...formulas.map((formula) => formula.radialTurningPoints.length)),
    polarTurningPointsPerFormula: Math.max(...formulas.map((formula) => formula.polarTurningPoints.length)),
  });
  return Object.freeze({
    version: KERR_EVENT_TIMELINE_VERSION_V302,
    status: "canonical-event-timelines-qualified",
    geometryEvidenceSha256: KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
    geometryFileSha256: KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300,
    rayCount: KERR_EVENT_TIMELINE_RAY_COUNT_V302,
    classCounts: Object.freeze(classCounts),
    timelines: Object.freeze(timelines),
    maxima,
    parameterComparisonBoundary: "formula-parameters-are-not-cross-compared",
    denseBoundary: "canonical-16-rays-not-dense-campaign",
  });
}

export function createKerrEventTimelineViewV302(source: unknown): KerrEventTimelineViewV302 {
  const document = record(source, "geometry-document");
  if (document.version !== "v296-kerr-geometry-redshift-short-gate-v1"
    || document.status !== "geometry-redshift-qualified"
    || document.geometryRedshiftQualified !== true
    || document.evidenceSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300
    || !Array.isArray(document.executions) || document.executions.length !== 128) {
    throw new Error("v302-geometry-authority-lock-mismatch");
  }
  const selected = document.executions.map((entry) => record(entry, "execution"))
    .filter((entry) => entry.toleranceClass === "release" && entry.branch === "A");
  const carterRows = new Map(selected.filter((entry) => entry.formulation === CARTER).map((entry) => [String(entry.rayId), entry]));
  const kerrSchildRows = new Map(selected.filter((entry) => entry.formulation === KERR_SCHILD).map((entry) => [String(entry.rayId), entry]));
  if (selected.length !== 32 || carterRows.size !== 16 || kerrSchildRows.size !== 16) {
    throw new Error("v302-formula-execution-conservation-failed");
  }
  return createFromFormulaRows(carterRows, kerrSchildRows);
}

export function parseKerrEventTimelineViewV302(source: unknown): KerrEventTimelineViewV302 {
  const candidate = record(source, "view");
  if (candidate.version !== KERR_EVENT_TIMELINE_VERSION_V302
    || candidate.status !== "canonical-event-timelines-qualified"
    || candidate.geometryEvidenceSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300
    || candidate.geometryFileSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300
    || candidate.rayCount !== KERR_EVENT_TIMELINE_RAY_COUNT_V302
    || candidate.parameterComparisonBoundary !== "formula-parameters-are-not-cross-compared"
    || candidate.denseBoundary !== "canonical-16-rays-not-dense-campaign"
    || !Array.isArray(candidate.timelines) || candidate.timelines.length !== 16) {
    throw new Error("v302-timeline-view-authority-lock-mismatch");
  }
  const carterRows = new Map<string, UnknownRecord>();
  const kerrSchildRows = new Map<string, UnknownRecord>();
  candidate.timelines.forEach((entry) => {
    const timeline = record(entry, "timeline");
    const rayId = String(timeline.rayId);
    const classification = timeline.classification;
    const spin = timeline.spinA;
    for (const [key, formulation, target] of [
      ["carter", CARTER, carterRows],
      ["kerrSchild", KERR_SCHILD, kerrSchildRows],
    ] as const) {
      const formula = record(timeline[key], `timeline-${key}`);
      target.set(rayId, { ...formula, rayId, spin, classification, formulation });
    }
  });
  const rebuilt = createFromFormulaRows(carterRows, kerrSchildRows);
  const maxima = record(candidate.maxima, "view-maxima");
  const classCounts = record(candidate.classCounts, "view-class-counts");
  if (Object.entries(rebuilt.maxima).some(([key, value]) => maxima[key] !== value)
    || Object.entries(rebuilt.classCounts).some(([key, value]) => classCounts[key] !== value)) {
    throw new Error("v302-timeline-summary-conservation-failed");
  }
  return rebuilt;
}
