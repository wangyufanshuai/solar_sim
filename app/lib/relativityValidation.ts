import { EARTH_BODY_INDEX, MERCURY_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { AU_METERS, C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
import {
  heliocentricOsculatingElements,
  reducedMassMu,
} from "./osculatingElements";
import { createHorizonsOrbitalResidual } from "./horizonsResidualFrame";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import type {
  HorizonsComparisonBody,
  HorizonsComparisonCheckpoint,
  HorizonsValidationDataset,
  HorizonsValidationModeResult,
  HorizonsValidationRun,
  LightDeflectionValidation,
  MercuryPrecessionValidation,
  RelativityConfidence,
  RelativityValidationSummary,
  ShapiroDelayValidation,
  TimeDilationValidation,
} from "./simulationDiagnosticsTypes";

export const MERCURY_GR_TARGET_ARCSEC_PER_CENTURY = 42.98;
export const SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC = 1.751;
export const SUN_RADIUS_M = 695_700_000;
const ARCSEC_PER_RAD = 180 * 3600 / Math.PI;
const MARS_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex((body) => body.id === "mars");

export const PENDING_HORIZONS_VALIDATION_RUN: HorizonsValidationRun = {
  status: "pending",
  progress: 0,
  source: "JPL Horizons API",
  modes: [],
};

export function errorPercent(measured: number | null, target: number): number | null {
  if (measured == null || !Number.isFinite(measured) || target === 0) return null;
  return Math.abs(measured - target) / Math.abs(target) * 100;
}

export function mercuryPrecessionValidation(
  physics: SolarSystemPhysicsRef | null,
): MercuryPrecessionValidation {
  if (!physics || MERCURY_BODY_INDEX <= 0 || MERCURY_BODY_INDEX >= physics.n) {
    return unavailableMercuryPrecession();
  }
  const mercury = SOLAR_SYSTEM_BODIES[MERCURY_BODY_INDEX];
  if (!mercury) return unavailableMercuryPrecession();
  const mu = reducedMassMu(
    physics.G,
    physics.mass[0] ?? SOLAR_SYSTEM_BODIES[0]!.massKg,
    physics.mass[MERCURY_BODY_INDEX] ?? mercury.massKg,
  );
  const elements = heliocentricOsculatingElements(
    physics.posM,
    physics.velM,
    0,
    MERCURY_BODY_INDEX,
    mu,
  );
  if (!elements || !Number.isFinite(elements.a) || elements.a <= 0 || elements.e >= 1) {
    return unavailableMercuryPrecession();
  }
  const deltaRadPerOrbit =
    (6 * Math.PI * physics.G * (physics.mass[0] ?? SOLAR_SYSTEM_BODIES[0]!.massKg)) /
    (elements.a * (1 - elements.e * elements.e) * C_LIGHT * C_LIGHT);
  const orbitsPerCentury = (100 * 365.25 * DAY_SECONDS) / elements.periodSeconds;
  const onePnArcsecPerCentury = deltaRadPerOrbit * ARCSEC_PER_RAD * orbitsPerCentury;
  return {
    sameInitialState: true,
    method: "analytic-1pn-from-osculating-state",
    newtonArcsecPerCentury: 0,
    onePnArcsecPerCentury,
    targetArcsecPerCentury: MERCURY_GR_TARGET_ARCSEC_PER_CENTURY,
    errorPercent: errorPercent(onePnArcsecPerCentury, MERCURY_GR_TARGET_ARCSEC_PER_CENTURY),
    sampledOrbits: Math.max(0, Math.floor(orbitsPerCentury)),
    status: "ready",
  };
}

function unavailableMercuryPrecession(): MercuryPrecessionValidation {
  return {
    sameInitialState: true,
    method: "analytic-1pn-from-osculating-state",
    newtonArcsecPerCentury: 0,
    onePnArcsecPerCentury: null,
    targetArcsecPerCentury: MERCURY_GR_TARGET_ARCSEC_PER_CENTURY,
    errorPercent: null,
    sampledOrbits: 0,
    status: "unavailable",
  };
}

export function solarLimbLightDeflectionValidation(): LightDeflectionValidation {
  const formulaArcsec =
    (4 * G_SI * SOLAR_SYSTEM_BODIES[0]!.massKg) /
    (C_LIGHT * C_LIGHT * SUN_RADIUS_M) *
    ARCSEC_PER_RAD;
  return {
    impactParameterSolarRadii: 1,
    formulaArcsec,
    targetArcsec: SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC,
    errorPercent: errorPercent(formulaArcsec, SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC) ?? 0,
    status: "ready",
  };
}

export function shapiroDelayValidation(
  physics: SolarSystemPhysicsRef | null,
  preferredBodyIndex: number | null,
): ShapiroDelayValidation {
  if (!physics || EARTH_BODY_INDEX <= 0 || EARTH_BODY_INDEX >= physics.n) {
    return unavailableShapiro("mercury");
  }
  const fallbackIndex =
    preferredBodyIndex === MARS_BODY_INDEX || preferredBodyIndex === MERCURY_BODY_INDEX
      ? preferredBodyIndex
      : MERCURY_BODY_INDEX;
  const body = SOLAR_SYSTEM_BODIES[fallbackIndex];
  const bodyId = body?.id === "mars" ? "mars" : "mercury";
  if (!body || fallbackIndex >= physics.n) return unavailableShapiro(bodyId);

  const s = vectorAt(physics.posM, 0);
  const earth = vectorAt(physics.posM, EARTH_BODY_INDEX);
  const target = vectorAt(physics.posM, fallbackIndex);
  const rEarth = distance(earth, s);
  const rTarget = distance(target, s);
  const rSignal = distance(earth, target);
  if (
    rEarth <= 0 ||
    rTarget <= 0 ||
    rSignal <= 0 ||
    rEarth + rTarget <= rSignal
  ) {
    return unavailableShapiro(bodyId);
  }
  const seconds =
    (2 * G_SI * SOLAR_SYSTEM_BODIES[0]!.massKg) /
    (C_LIGHT * C_LIGHT * C_LIGHT) *
    Math.log((rEarth + rTarget + rSignal) / (rEarth + rTarget - rSignal));
  const microseconds = seconds * 1e6;
  return {
    bodyId,
    microseconds,
    formulaMicroseconds: microseconds,
    errorPercent: 0,
    status: "ready",
  };
}

function unavailableShapiro(bodyId: "mercury" | "mars"): ShapiroDelayValidation {
  return {
    bodyId,
    microseconds: null,
    formulaMicroseconds: null,
    errorPercent: null,
    status: "unavailable",
  };
}

export function timeDilationValidation(
  physics: SolarSystemPhysicsRef | null,
  selectedBodyIndex: number | null,
  surfaceRedshift: number | null,
): TimeDilationValidation {
  if (!physics || selectedBodyIndex == null || selectedBodyIndex < 0 || selectedBodyIndex >= physics.n) {
    return {
      bodyId: null,
      ratio: null,
      slowdownFraction: null,
      gravitationalPlusKinematicUsPerDay: null,
      surfaceRedshift,
      status: "unavailable",
    };
  }
  const body = SOLAR_SYSTEM_BODIES[selectedBodyIndex];
  const result = physics.getGravitationalTimeDilationVsCom(selectedBodyIndex);
  return {
    bodyId: body?.id ?? null,
    ratio: result.ratio,
    slowdownFraction: result.slowdownFraction,
    gravitationalPlusKinematicUsPerDay: result.slowdownFraction * DAY_SECONDS * 1e6,
    surfaceRedshift,
    status: "ready",
  };
}

export function relativityConfidenceForValidation(summary: {
  mercury: MercuryPrecessionValidation;
  light: LightDeflectionValidation;
  shapiro: ShapiroDelayValidation;
  horizons: HorizonsValidationRun;
}): RelativityConfidence {
  const formulaChecked =
    summary.mercury.status === "ready" &&
    summary.light.status === "ready" &&
    summary.shapiro.status === "ready";
  if (!formulaChecked) return "visual";
  const horizonsComplete = summary.horizons.status === "complete";
  if (!horizonsComplete) return "formula-checked";
  const horizonsGood = summary.horizons.modes.some(
    (mode) =>
      mode.mode === "1pn" &&
      mode.rmsPositionKm != null &&
      mode.rmsVelocityMs != null &&
      mode.rmsPositionKm < 2e8 &&
      mode.rmsVelocityMs < 500,
  );
  if (!horizonsGood) return "horizons-checked";
  const mercuryGood = (summary.mercury.errorPercent ?? Infinity) < 25;
  const lightGood = summary.light.errorPercent < 1;
  return mercuryGood && lightGood ? "validated" : "horizons-checked";
}

export function createRelativityValidationSummary(args: {
  physics: SolarSystemPhysicsRef | null;
  selectedBodyIndex: number | null;
  surfaceRedshift: number | null;
  horizonsRun: HorizonsValidationRun;
}): RelativityValidationSummary {
  const mercury = mercuryPrecessionValidation(args.physics);
  const light = solarLimbLightDeflectionValidation();
  const shapiro = shapiroDelayValidation(args.physics, args.selectedBodyIndex);
  const timeDilation = timeDilationValidation(
    args.physics,
    args.selectedBodyIndex,
    args.surfaceRedshift,
  );
  return {
    mercuryPrecession: mercury,
    lightDeflection: light,
    shapiroDelay: shapiro,
    timeDilation,
    horizons: args.horizonsRun,
    semantics: {
      presentation: "orbit-atlas-visual-guide",
      dynamics: "live-nbody-eih-1pn-state",
      validation: "offline-gr-targets-and-jpl-horizons",
      kerr: "independent-strong-field-geodesic-lab",
    },
  };
}

export function loadHorizonsValidationDatasetFromJson(json: string): HorizonsValidationDataset {
  const raw = JSON.parse(json) as unknown;
  if (!raw || typeof raw !== "object") throw new Error("Horizons validation JSON must be an object");
  const data = raw as HorizonsValidationDataset;
  if (data.origin !== "sun" || data.refplane !== "ecliptic" || data.aberrations !== "geometric") {
    throw new Error("Horizons validation metadata mismatch");
  }
  const labels = data.checkpoints?.map((checkpoint) => checkpoint.label);
  if (labels?.join(",") !== "J2000,+30d,+365d,+10y") {
    throw new Error("Horizons validation checkpoints must be J2000,+30d,+365d,+10y");
  }
  for (const checkpoint of data.checkpoints) {
    if (!Number.isFinite(checkpoint.offsetDays) || !Number.isFinite(checkpoint.epochJdTdb)) {
      throw new Error(`Invalid Horizons checkpoint time: ${checkpoint.label}`);
    }
    if (!Array.isArray(checkpoint.bodies) || checkpoint.bodies.length === 0) {
      throw new Error(`Horizons checkpoint has no bodies: ${checkpoint.label}`);
    }
    for (const body of checkpoint.bodies) {
      if (typeof body.id !== "string") throw new Error("Horizons body missing id");
      for (const key of ["x_au", "y_au", "z_au", "vx_au_d", "vy_au_d", "vz_au_d"] as const) {
        if (!Number.isFinite(body[key])) throw new Error(`Invalid Horizons ${key} for ${body.id}`);
      }
    }
  }
  return data;
}

export function compareStateToHorizonsCheckpoint(args: {
  posM: Float64Array;
  velM: Float64Array;
  bodyIds: readonly string[];
  checkpoint: HorizonsValidationDataset["checkpoints"][number];
}): HorizonsComparisonCheckpoint {
  const comparisons: HorizonsComparisonBody[] = [];
  const sx = args.posM[0] ?? 0;
  const sy = args.posM[1] ?? 0;
  const sz = args.posM[2] ?? 0;
  const svx = args.velM[0] ?? 0;
  const svy = args.velM[1] ?? 0;
  const svz = args.velM[2] ?? 0;
  const byId = new Map(args.checkpoint.bodies.map((body) => [body.id, body]));
  for (let i = 0; i < args.bodyIds.length; i++) {
    const bodyId = args.bodyIds[i]!;
    const ref = byId.get(bodyId);
    if (!ref) continue;
    const base = i * 3;
    const xAu = ((args.posM[base] ?? 0) - sx) / AU_METERS;
    const yAu = ((args.posM[base + 1] ?? 0) - sy) / AU_METERS;
    const zAu = ((args.posM[base + 2] ?? 0) - sz) / AU_METERS;
    const vxAuD = (((args.velM[base] ?? 0) - svx) * DAY_SECONDS) / AU_METERS;
    const vyAuD = (((args.velM[base + 1] ?? 0) - svy) * DAY_SECONDS) / AU_METERS;
    const vzAuD = (((args.velM[base + 2] ?? 0) - svz) * DAY_SECONDS) / AU_METERS;
    const orbitalResidual = createHorizonsOrbitalResidual({
      measuredPositionAu: [xAu, yAu, zAu],
      measuredVelocityAuD: [vxAuD, vyAuD, vzAuD],
      referencePositionAu: [ref.x_au, ref.y_au, ref.z_au],
      referenceVelocityAuD: [ref.vx_au_d, ref.vy_au_d, ref.vz_au_d],
    });
    comparisons.push({
      bodyId,
      deltaRKm: orbitalResidual.positionNormKm,
      deltaVMs: orbitalResidual.velocityNormMs,
      orbitalResidual,
    });
  }
  const rmsPositionKm = rms(comparisons.map((item) => item.deltaRKm));
  const rmsVelocityMs = rms(comparisons.map((item) => item.deltaVMs));
  const label = args.checkpoint.label === "J2000" ? "+30d" : args.checkpoint.label;
  return {
    label: label as "+30d" | "+365d" | "+10y",
    offsetDays: args.checkpoint.offsetDays,
    referenceSource: "JPL Horizons",
    available: true,
    deltaRKm: rmsPositionKm,
    deltaVMs: rmsVelocityMs,
    rmsPositionKm,
    rmsVelocityMs,
    bodyComparisons: comparisons,
  };
}

export function modeResultFromCheckpoints(
  mode: "newton" | "1pn",
  checkpoints: readonly HorizonsComparisonCheckpoint[],
): HorizonsValidationModeResult {
  return {
    mode,
    checkpoints,
    rmsPositionKm: rms(checkpoints.map((checkpoint) => checkpoint.rmsPositionKm ?? NaN)),
    rmsVelocityMs: rms(checkpoints.map((checkpoint) => checkpoint.rmsVelocityMs ?? NaN)),
  };
}

function vectorAt(array: Float64Array, index: number): readonly [number, number, number] {
  return [array[3 * index] ?? 0, array[3 * index + 1] ?? 0, array[3 * index + 2] ?? 0];
}

function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

function rms(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return Math.sqrt(finite.reduce((sum, value) => sum + value * value, 0) / finite.length);
}
