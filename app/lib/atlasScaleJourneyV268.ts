import { ATLAS_SCALE_BANDS_V260, ATLAS_SCALE_BAND_ORDER_V260 } from "./atlasScaleBandsV260";
import type { AtlasScaleBand } from "./atlasRuntimeStateV256";

export const ATLAS_SCALE_JOURNEY_VERSION = "v268-continuous-scale-journey-v1" as const;
export const ATLAS_SCALE_JOURNEY_DURATION_MS = 900;
export type AtlasScalePositionStatusV273 = "retained" | "angular-shell-only" | "position-unavailable";

export type AtlasScaleJourneyV268 = {
  version: typeof ATLAS_SCALE_JOURNEY_VERSION;
  requestId: number;
  lifecycle: "idle" | "transition";
  route: readonly AtlasScaleBand[];
  stepIndex: number;
  from: AtlasScaleBand;
  to: AtlasScaleBand;
  finalTarget: AtlasScaleBand;
  selectedObjectId: string;
  handoffAnchor: { kind: "selected-object" | "band-origin"; id: string };
  returnPath: readonly AtlasScaleBand[];
  requestedAtMs: number;
  durationMs: number;
  positionStatus: AtlasScalePositionStatusV273;
  publicDeploymentBlocked: boolean;
};

export type AtlasScaleTransitionSnapshotV268 = {
  version: typeof ATLAS_SCALE_JOURNEY_VERSION;
  requestId: number;
  from: AtlasScaleBand;
  to: AtlasScaleBand;
  progress: number;
};

const IDLE_JOURNEY: AtlasScaleJourneyV268 = {
  version: ATLAS_SCALE_JOURNEY_VERSION,
  requestId: 0,
  lifecycle: "idle",
  route: ["solar"],
  stepIndex: 0,
  from: "solar",
  to: "solar",
  finalTarget: "solar",
  selectedObjectId: "",
  handoffAnchor: { kind: "band-origin", id: "solar-origin" },
  returnPath: [],
  requestedAtMs: 0,
  durationMs: ATLAS_SCALE_JOURNEY_DURATION_MS,
  positionStatus: "retained",
  publicDeploymentBlocked: false,
};

let transient: AtlasScaleTransitionSnapshotV268 = {
  version: ATLAS_SCALE_JOURNEY_VERSION,
  requestId: 0,
  from: "solar",
  to: "solar",
  progress: 1,
};

export function atlasScaleObjectAvailabilityV273(selectedObjectId: string, band: AtlasScaleBand): AtlasScalePositionStatusV273 {
  if (!selectedObjectId) return "retained";
  const id = selectedObjectId.toLowerCase();
  const solarIds = new Set(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
  if (solarIds.has(id)) return band === "solar" || band === "stellar" || band === "galactic" ? "retained" : "position-unavailable";
  if (id.startsWith("gaia-dr3:") || /^\d{10,}$/.test(id)) return band === "stellar" || band === "galactic" ? "retained" : "position-unavailable";
  if (id.startsWith("cosmicflows:")) return band === "near-universe" ? "retained" : "position-unavailable";
  if (id.startsWith("ngc") || id.startsWith("ic") || id.startsWith("openngc:")) {
    return band === "local-group" || band === "near-universe" ? "angular-shell-only" : "position-unavailable";
  }
  return band === "stellar" || band === "galactic" ? "retained" : "position-unavailable";
}

export function createIdleAtlasScaleJourneyV268(
  band: AtlasScaleBand = "solar",
  requestId = 0,
  returnPath: readonly AtlasScaleBand[] = [],
  retained?: Partial<Pick<AtlasScaleJourneyV268, "selectedObjectId" | "positionStatus" | "publicDeploymentBlocked">>,
): AtlasScaleJourneyV268 {
  const selectedObjectId = retained?.selectedObjectId ?? "";
  const positionStatus = retained?.positionStatus ?? atlasScaleObjectAvailabilityV273(selectedObjectId, band);
  return {
    ...IDLE_JOURNEY,
    requestId,
    route: [band],
    from: band,
    to: band,
    finalTarget: band,
    returnPath,
    selectedObjectId,
    positionStatus,
    publicDeploymentBlocked: retained?.publicDeploymentBlocked ?? ATLAS_SCALE_BANDS_V260[band].publicDeploymentBlocked,
    handoffAnchor: selectedObjectId && positionStatus === "retained"
      ? { kind: "selected-object", id: selectedObjectId }
      : { kind: "band-origin", id: `${band}-origin` },
  };
}

export function createAtlasScaleRouteV268(from: AtlasScaleBand, to: AtlasScaleBand): AtlasScaleBand[] {
  const first = ATLAS_SCALE_BAND_ORDER_V260.indexOf(from);
  const last = ATLAS_SCALE_BAND_ORDER_V260.indexOf(to);
  if (first === last) return [from];
  const direction = first < last ? 1 : -1;
  const route: AtlasScaleBand[] = [];
  for (let index = first; index !== last + direction; index += direction) route.push(ATLAS_SCALE_BAND_ORDER_V260[index]!);
  return route;
}

export function createAtlasScaleJourneyV268(args: {
  requestId: number;
  from: AtlasScaleBand;
  to: AtlasScaleBand;
  selectedObjectId: string;
  returnPath: readonly AtlasScaleBand[];
  requestedAtMs: number;
  reducedMotion?: boolean;
}): AtlasScaleJourneyV268 {
  const route = createAtlasScaleRouteV268(args.from, args.to);
  const next = route[1] ?? args.to;
  const anchorPositionStatus = atlasScaleObjectAvailabilityV273(args.selectedObjectId, next);
  const positionStatus = atlasScaleObjectAvailabilityV273(args.selectedObjectId, args.to);
  const selectedRetained = args.selectedObjectId !== "" && anchorPositionStatus === "retained";
  return {
    version: ATLAS_SCALE_JOURNEY_VERSION,
    requestId: args.requestId,
    lifecycle: route.length > 1 ? "transition" : "idle",
    route,
    stepIndex: 0,
    from: args.from,
    to: next,
    finalTarget: args.to,
    selectedObjectId: args.selectedObjectId,
    handoffAnchor: selectedRetained
      ? { kind: "selected-object", id: args.selectedObjectId }
      : { kind: "band-origin", id: `${next}-origin` },
    returnPath: [...args.returnPath, args.from].slice(-8),
    requestedAtMs: args.requestedAtMs,
    durationMs: args.reducedMotion ? 0 : ATLAS_SCALE_JOURNEY_DURATION_MS,
    positionStatus,
    publicDeploymentBlocked: ATLAS_SCALE_BANDS_V260[args.to].publicDeploymentBlocked,
  };
}

export function advanceAtlasScaleJourneyV268(journey: AtlasScaleJourneyV268, nowMs: number): AtlasScaleJourneyV268 {
  if (journey.lifecycle !== "transition") return journey;
  const nextIndex = journey.stepIndex + 1;
  const arrived = journey.route[nextIndex]!;
  const following = journey.route[nextIndex + 1];
  if (!following) return createIdleAtlasScaleJourneyV268(arrived, journey.requestId, journey.returnPath, {
    selectedObjectId: journey.selectedObjectId,
    positionStatus: atlasScaleObjectAvailabilityV273(journey.selectedObjectId, arrived),
    publicDeploymentBlocked: ATLAS_SCALE_BANDS_V260[arrived].publicDeploymentBlocked,
  });
  const anchorPositionStatus = atlasScaleObjectAvailabilityV273(journey.selectedObjectId, following);
  return {
    ...journey,
    stepIndex: nextIndex,
    from: arrived,
    to: following,
    requestedAtMs: nowMs,
    publicDeploymentBlocked: ATLAS_SCALE_BANDS_V260[journey.finalTarget].publicDeploymentBlocked,
    handoffAnchor: journey.selectedObjectId && anchorPositionStatus === "retained"
      ? { kind: "selected-object", id: journey.selectedObjectId }
      : { kind: "band-origin", id: `${following}-origin` },
  };
}

export function setAtlasScaleTransitionProgressV268(journey: AtlasScaleJourneyV268, progress: number): void {
  transient = { version: ATLAS_SCALE_JOURNEY_VERSION, requestId: journey.requestId, from: journey.from, to: journey.to, progress: Math.max(0, Math.min(1, progress)) };
}

export function getAtlasScaleTransitionSnapshotV268(): AtlasScaleTransitionSnapshotV268 {
  return transient;
}

export function atlasScaleBandOpacityV268(band: AtlasScaleBand, current: AtlasScaleBand, journey: AtlasScaleJourneyV268): number {
  if (journey.lifecycle !== "transition" || transient.requestId !== journey.requestId) return band === current ? 1 : 0;
  if (band === journey.from) return 1 - transient.progress;
  if (band === journey.to) return transient.progress;
  return 0;
}

export const ATLAS_SCALE_CAMERA_DISTANCE_V268: Readonly<Record<AtlasScaleBand, number>> = {
  solar: 48,
  stellar: 1_200,
  galactic: 4_500,
  "local-group": 9_000,
  "near-universe": 15_000,
};
