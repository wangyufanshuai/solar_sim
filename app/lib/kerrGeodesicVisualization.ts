import type {
  GeodesicInitialState,
  GeodesicIntegrationResult,
  KerrOrbitPresetId,
  GeodesicTrackKind,
  KerrGeodesicRenderMode,
  KerrGeodesicTrack,
  KerrGeodesicTrackKind,
  KerrProbeGeodesicSummary,
  KerrGeodesicTrackSample,
  KerrGeodesicTrackSet,
} from "./simulationDiagnosticsTypes";
import {
  DEFAULT_KERR_IMPACT_PARAMETER_M,
  DEFAULT_KERR_ORBIT_PRESET_ID,
  KERR_RELATIVITY_LAB_VERSION,
  SCHWARZSCHILD_STRONG_FIELD_ANCHORS,
  classifyKerrProbeStatus,
  createKerrNullProbeInitialState,
  integrateGeodesic,
  kerrProbeIntegrationOptions,
  kerrEquatorialIscoRadiusM,
  normalizeKerrImpactParameterM,
  schwarzschildCircularTimelikeConstants,
  schwarzschildPhotonSphereConstants,
  weakFieldLightDeflectionRad,
} from "./kerrGeodesicKernel";

export const KERR_GEODESIC_VISUALIZATION_ID = "kerr-geodesic-tracks-v18" as const;
export const DEFAULT_KERR_GEODESIC_RENDER_MODE: KerrGeodesicRenderMode = "geodesic-tracks";
export const KERR_GEODESIC_TRACK_COUNT = 7;
export { DEFAULT_KERR_IMPACT_PARAMETER_M, DEFAULT_KERR_ORBIT_PRESET_ID, KERR_RELATIVITY_LAB_VERSION };

const ARCSEC_PER_RAD = 206_264.80624709636;

export const KERR_ORBIT_PRESETS: ReadonlyArray<{
  id: KerrOrbitPresetId;
  label: string;
  spinA: number;
  impactParameterM: number;
  highlightTrackKind: KerrGeodesicTrackKind;
}> = [
  {
    id: "photon-ring-demo",
    label: "Photon ring",
    spinA: 0.88,
    impactParameterM: DEFAULT_KERR_IMPACT_PARAMETER_M,
    highlightTrackKind: "photon-sphere",
  },
  {
    id: "isco-comparison",
    label: "ISCO split",
    spinA: 0.9,
    impactParameterM: 6.2,
    highlightTrackKind: "kerr-prograde",
  },
  {
    id: "capture-cone",
    label: "Capture cone",
    spinA: 0.72,
    impactParameterM: 4.2,
    highlightTrackKind: "capture",
  },
  {
    id: "wide-deflection",
    label: "Wide bend",
    spinA: 0.35,
    impactParameterM: 14,
    highlightTrackKind: "probe-null",
  },
  {
    id: "frame-drag-split",
    label: "Frame split",
    spinA: 0.98,
    impactParameterM: 7.5,
    highlightTrackKind: "kerr-retrograde",
  },
] as const;

const MAX_TRACK_SAMPLES = 420;

const TRACK_STYLE: Record<GeodesicTrackKind, Pick<KerrGeodesicTrack, "color" | "haloColor" | "width" | "opacity">> = {
  "photon-sphere": {
    color: "#7dd3fc",
    haloColor: "#1e78ff",
    width: 1.75,
    opacity: 0.84,
  },
  isco: {
    color: "#d8c48a",
    haloColor: "#675f39",
    width: 1.5,
    opacity: 0.74,
  },
  capture: {
    color: "#a45f55",
    haloColor: "#3d1d1b",
    width: 1.28,
    opacity: 0.64,
  },
  escape: {
    color: "#9cc8d3",
    haloColor: "#264a5a",
    width: 1.18,
    opacity: 0.58,
  },
  "kerr-prograde": {
    color: "#67e8f9",
    haloColor: "#0e7490",
    width: 1.38,
    opacity: 0.72,
  },
  "kerr-retrograde": {
    color: "#a7b6c7",
    haloColor: "#334155",
    width: 1.16,
    opacity: 0.56,
  },
  "probe-null": {
    color: "#b7f7ff",
    haloColor: "#22d3ee",
    width: 1.62,
    opacity: 0.88,
  },
};

const TRACK_TILT_RAD: Record<GeodesicTrackKind, number> = {
  "photon-sphere": 0,
  isco: 0.035,
  capture: -0.12,
  escape: 0.14,
  "kerr-prograde": 0.075,
  "kerr-retrograde": -0.08,
  "probe-null": 0.19,
};

type KerrTrackSetArgs = number | {
  spinA?: number;
  impactParameterM?: number;
  presetId?: KerrOrbitPresetId;
};

function clampSpin(spinA: number): number {
  if (!Number.isFinite(spinA)) return 0;
  return Math.max(0, Math.min(0.998, spinA));
}

function presetDefaults(presetId: KerrOrbitPresetId | undefined) {
  return KERR_ORBIT_PRESETS.find((preset) => preset.id === presetId) ?? KERR_ORBIT_PRESETS[0]!;
}

function normalizeTrackSetArgs(args: KerrTrackSetArgs = {}): {
  spinA: number;
  impactParameterM: number;
  presetId: KerrOrbitPresetId;
} {
  if (typeof args === "number") {
    return {
      spinA: clampSpin(args),
      impactParameterM: DEFAULT_KERR_IMPACT_PARAMETER_M,
      presetId: DEFAULT_KERR_ORBIT_PRESET_ID,
    };
  }
  const preset = presetDefaults(args.presetId);
  return {
    spinA: clampSpin(args.spinA ?? preset.spinA),
    impactParameterM: normalizeKerrImpactParameterM(args.impactParameterM ?? preset.impactParameterM),
    presetId: preset.id,
  };
}

function kerrCircularTimelikeConstants(
  radiusM: number,
  spinA: number,
  direction: "prograde" | "retrograde",
): { energy: number; angularMomentum: number } {
  const r = radiusM;
  const a = clampSpin(spinA);
  const sign = direction === "prograde" ? 1 : -1;
  const sqrtR = Math.sqrt(r);
  const r32 = r * sqrtR;
  const denominatorTerm = r32 - 3 * sqrtR + 2 * sign * a;
  if (denominatorTerm <= 0) {
    throw new Error(`Kerr circular orbit denominator is invalid at r=${r}`);
  }
  const denominator = Math.pow(r, 0.75) * Math.sqrt(denominatorTerm);
  return {
    energy: (r32 - 2 * sqrtR + sign * a) / denominator,
    angularMomentum: sign * (r * r - 2 * sign * a * sqrtR + a * a) / denominator,
  };
}

function decimateSamples<T>(samples: readonly T[], maxSamples: number): readonly T[] {
  if (samples.length <= maxSamples) return samples;
  const out: T[] = [];
  const step = (samples.length - 1) / (maxSamples - 1);
  for (let i = 0; i < maxSamples; i++) {
    out.push(samples[Math.round(i * step)]!);
  }
  return out;
}

function sampleToScene(sample: { lambda: number; r: number; phi: number; hamiltonian: number }, tiltRad: number): KerrGeodesicTrackSample {
  const flatX = sample.r * Math.cos(sample.phi);
  const flatY = sample.r * Math.sin(sample.phi);
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);
  return {
    lambda: sample.lambda,
    r: sample.r,
    phi: sample.phi,
    x: flatX,
    y: flatY * cosTilt,
    z: flatY * sinTilt,
    hamiltonian: sample.hamiltonian,
  };
}

function finiteTrackSamples(
  result: GeodesicIntegrationResult,
  kind: GeodesicTrackKind,
): readonly KerrGeodesicTrackSample[] {
  return decimateSamples(result.samples, MAX_TRACK_SAMPLES)
    .map((sample) => sampleToScene(sample, TRACK_TILT_RAD[kind]))
    .filter(
      (sample) =>
        Number.isFinite(sample.lambda) &&
        Number.isFinite(sample.r) &&
        Number.isFinite(sample.phi) &&
        Number.isFinite(sample.x) &&
        Number.isFinite(sample.y) &&
        Number.isFinite(sample.z) &&
        Number.isFinite(sample.hamiltonian),
    );
}

function integrateTrack(
  kind: GeodesicTrackKind,
  initial: GeodesicInitialState,
  options: Parameters<typeof integrateGeodesic>[1],
): KerrGeodesicTrack {
  const result = integrateGeodesic(initial, options);
  const samples = finiteTrackSamples(result, kind);
  const style = TRACK_STYLE[kind];
  return {
    id: initial.label ?? kind,
    kind,
    metric: result.params.family,
    geodesicKind: initial.kind,
    status: result.status,
    color: style.color,
    haloColor: style.haloColor,
    width: style.width,
    opacity: style.opacity,
    maxHamiltonianConstraintAbs: result.maxHamiltonianConstraintAbs,
    radialDrift: result.radialRange.max - result.radialRange.min,
    samples,
  };
}

export function createKerrGeodesicTrackSet(args: KerrTrackSetArgs = 0.9): KerrGeodesicTrackSet {
  const normalized = normalizeTrackSetArgs(args);
  const spin = normalized.spinA;
  const photon = schwarzschildPhotonSphereConstants();
  const isco = schwarzschildCircularTimelikeConstants(SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM);
  const progradeIscoM = kerrEquatorialIscoRadiusM(spin, "prograde");
  const retrogradeIscoM = kerrEquatorialIscoRadiusM(spin, "retrograde");
  const kerrPro = kerrCircularTimelikeConstants(progradeIscoM, spin, "prograde");
  const kerrRetro = kerrCircularTimelikeConstants(retrogradeIscoM, spin, "retrograde");
  const probeInitial = createKerrNullProbeInitialState(
    normalized.impactParameterM,
    normalized.presetId,
  );
  const probeTrack = integrateTrack(
    "probe-null",
    probeInitial,
    kerrProbeIntegrationOptions(normalized.impactParameterM),
  );
  const weakFieldDeflection = weakFieldLightDeflectionRad(normalized.impactParameterM);
  const probe: KerrProbeGeodesicSummary = {
    presetId: normalized.presetId,
    impactParameterM: normalized.impactParameterM,
    weakFieldDeflectionRad: weakFieldDeflection,
    weakFieldDeflectionArcsec: weakFieldDeflection * ARCSEC_PER_RAD,
    geodesicStatus: probeTrack.status,
    probeStatus: classifyKerrProbeStatus(probeTrack.status),
    maxHamiltonianConstraintAbs: probeTrack.maxHamiltonianConstraintAbs,
    radialRangeMinM: probeTrack.samples.reduce(
      (min, sample) => Math.min(min, sample.r),
      Number.POSITIVE_INFINITY,
    ),
    radialRangeMaxM: probeTrack.samples.reduce(
      (max, sample) => Math.max(max, sample.r),
      Number.NEGATIVE_INFINITY,
    ),
    sampleCount: probeTrack.samples.length,
  };

  const tracks: KerrGeodesicTrack[] = [
    integrateTrack(
      "photon-sphere",
      {
        metric: "schwarzschild",
        kind: "null",
        r0: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.photonSphereRadiusM,
        radialDirection: 0,
        energy: photon.energy,
        angularMomentum: photon.angularMomentum,
        label: "schwarzschild-photon-sphere",
      },
      { maxLambda: 48, maxStep: 0.12, tolerance: 1e-10 },
    ),
    integrateTrack(
      "isco",
      {
        metric: "schwarzschild",
        kind: "timelike",
        r0: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM,
        radialDirection: 0,
        energy: isco.energy,
        angularMomentum: isco.angularMomentum,
        label: "schwarzschild-isco",
      },
      { maxLambda: 48, maxStep: 0.12, tolerance: 1e-10 },
    ),
    integrateTrack(
      "capture",
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 2.8,
        radialDirection: -1,
        energy: 1,
        angularMomentum: 1.5,
        label: "plunging-null-capture",
      },
      { maxLambda: 20, escapeRadius: 80, maxStep: 0.05, tolerance: 1e-8 },
    ),
    integrateTrack(
      "escape",
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 30,
        radialDirection: 1,
        energy: 1,
        angularMomentum: 4,
        label: "escaping-null",
      },
      { maxLambda: 80, escapeRadius: 60, maxStep: 0.2, tolerance: 1e-8 },
    ),
    integrateTrack(
      "kerr-prograde",
      {
        metric: "kerr",
        kind: "timelike",
        spinA: spin,
        r0: progradeIscoM,
        radialDirection: 0,
        energy: kerrPro.energy,
        angularMomentum: kerrPro.angularMomentum,
        label: "kerr-prograde-isco-reference",
      },
      { maxLambda: 48, maxStep: 0.12, tolerance: 1e-9 },
    ),
    integrateTrack(
      "kerr-retrograde",
      {
        metric: "kerr",
        kind: "timelike",
        spinA: spin,
        r0: retrogradeIscoM,
        radialDirection: 0,
        energy: kerrRetro.energy,
        angularMomentum: kerrRetro.angularMomentum,
        label: "kerr-retrograde-isco-reference",
      },
      { maxLambda: 48, maxStep: 0.12, tolerance: 1e-9 },
    ),
    probeTrack,
  ];

  return {
    visualization: KERR_GEODESIC_VISUALIZATION_ID,
    labVersion: KERR_RELATIVITY_LAB_VERSION,
    spinA: spin,
    orbitPresetId: normalized.presetId,
    impactParameterM: normalized.impactParameterM,
    renderModeDefault: DEFAULT_KERR_GEODESIC_RENDER_MODE,
    trackCount: tracks.length,
    maxHamiltonianConstraintAbs: tracks.reduce(
      (max, track) => Math.max(max, track.maxHamiltonianConstraintAbs),
      0,
    ),
    probe,
    tracks,
  };
}
