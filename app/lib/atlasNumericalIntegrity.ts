import { createRk4Workspaces, defaultEps2Meters, rk4Step } from "./physicsEngine";
import { AU_METERS, C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
import { MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY } from "./relativityReferenceConstants";
import type {
  AtlasNumericalIntegrityBenchmarkDescriptor,
  AtlasNumericalIntegrityCoverage,
  AtlasNumericalIntegrityStatus,
  AtlasNumericalIntegritySummary,
  AtlasNumericalIntegrityTrend,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const ATLAS_NUMERICAL_INTEGRITY_VERSION = "v54-numerical-integrity-gate" as const;

export const ATLAS_NUMERICAL_INTEGRITY_BOUNDARY =
  "Local numerical-integrity metadata derived from existing diagnostics and local deterministic test fixtures. It does not run runtime benchmarks, certify science or CI status, fetch online validation, add a physics model, or mutate EIH 1PN / Kerr dynamics.";

export const ATLAS_NUMERICAL_INTEGRITY_COVERAGE: AtlasNumericalIntegrityCoverage =
  "covered-by-local-tests-not-runtime-claimed";

const WATCH_DRIFT_THRESHOLD = 2e-4;
const WARNING_DRIFT_THRESHOLD = 8e-4;
const WATCH_SLOPE_THRESHOLD = 5e-6;
const WARNING_SLOPE_THRESHOLD = 2.5e-5;

const BENCHMARK_DESCRIPTORS: readonly AtlasNumericalIntegrityBenchmarkDescriptor[] = [
  {
    id: "mercury-weak-field-drift",
    title: "Mercury weak-field drift",
    model: "Existing EIH 1PN diagnostics and Mercury perihelion target",
    source: "local diagnostics plus offline weak-field target",
    expectedSignal: `${MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY} arcsec / century reference cue`,
    boundary: "Read-only descriptor; no runtime benchmark execution is claimed.",
  },
  {
    id: "earth-moon-scale-conservation",
    title: "Earth-Moon scale conservation",
    model: "Local two-body conservation fixture",
    source: "deterministic unit test coverage",
    expectedSignal: "Bounded relative energy and angular-momentum drift trend",
    boundary: "Local test coverage only; not a live mission or CI status claim.",
  },
  {
    id: "two-body-time-reversal",
    title: "Two-body time reversal",
    model: "RK4 two-body fixture with reversed velocities",
    source: "deterministic unit test coverage",
    expectedSignal: "Forward then reversed integration returns near the initial state",
    boundary: "Uses cloned arrays and existing RK4 helper; no SolarSystemIntegrator mutation.",
  },
  {
    id: "kerr-numerical-health-boundary",
    title: "Kerr numerical-health boundary",
    model: "Kerr Studio Hamiltonian drift treated as numerical health",
    source: "local v35 Kerr Relativity Studio boundary",
    expectedSignal: "Hamiltonian drift remains a stability cue, not an astrophysical observable",
    boundary: "Preserves kernel id eih-1pn+kerr-geodesic-v17 and does not replace EIH 1PN dynamics.",
  },
];

type DriftClassification = {
  trend: AtlasNumericalIntegrityTrend;
  maxAbs: number | null;
  slope: number | null;
};

function finiteAbsValues(values: readonly number[] | null | undefined): number[] {
  return (values ?? [])
    .map((value) => Math.abs(value))
    .filter((value) => Number.isFinite(value));
}

export function classifyNumericalIntegrityDrift(
  history: readonly number[] | null | undefined,
  current: number | null | undefined
): DriftClassification {
  const values = finiteAbsValues(history);
  const currentAbs = Number.isFinite(current) ? Math.abs(current as number) : null;
  if (currentAbs !== null) {
    values.push(currentAbs);
  }

  if (values.length === 0) {
    return { trend: "insufficient-data", maxAbs: null, slope: null };
  }

  const maxAbs = Math.max(...values);
  const slope = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
  const positiveSlope = Math.max(0, slope);

  if (maxAbs >= WARNING_DRIFT_THRESHOLD || positiveSlope >= WARNING_SLOPE_THRESHOLD) {
    return { trend: "warning", maxAbs, slope };
  }
  if (maxAbs >= WATCH_DRIFT_THRESHOLD || positiveSlope >= WATCH_SLOPE_THRESHOLD) {
    return { trend: "watch", maxAbs, slope };
  }
  return { trend: "stable", maxAbs, slope };
}

function statusForTrends(
  diagnostics: SimulationDiagnostics | null,
  energyTrend: AtlasNumericalIntegrityTrend,
  angularTrend: AtlasNumericalIntegrityTrend
): AtlasNumericalIntegrityStatus {
  if (!diagnostics) {
    return "informational";
  }
  if (energyTrend === "warning" || angularTrend === "warning") {
    return "warning";
  }
  if (
    energyTrend === "watch" ||
    angularTrend === "watch" ||
    energyTrend === "insufficient-data" ||
    angularTrend === "insufficient-data"
  ) {
    return "watch";
  }
  return "ready";
}

function claimStatusForIntegrity(status: AtlasNumericalIntegrityStatus) {
  if (status === "ready") {
    return "ready" as const;
  }
  if (status === "warning") {
    return "pending" as const;
  }
  return "informational" as const;
}

export function createAtlasNumericalIntegritySummary(
  diagnostics: SimulationDiagnostics | null = null
): AtlasNumericalIntegritySummary {
  const energy = classifyNumericalIntegrityDrift(diagnostics?.energyHistory, diagnostics?.relEnergyDrift);
  const angular = classifyNumericalIntegrityDrift(diagnostics?.angMomHistory, diagnostics?.relAngMomDrift);
  const integrityStatus = statusForTrends(diagnostics, energy.trend, angular.trend);

  return {
    version: ATLAS_NUMERICAL_INTEGRITY_VERSION,
    status: claimStatusForIntegrity(integrityStatus),
    integrityStatus,
    currentEnergyDrift: Number.isFinite(diagnostics?.relEnergyDrift) ? diagnostics?.relEnergyDrift ?? null : null,
    currentAngularMomentumDrift: Number.isFinite(diagnostics?.relAngMomDrift)
      ? diagnostics?.relAngMomDrift ?? null
      : null,
    maxEnergyDrift: energy.maxAbs,
    maxAngularMomentumDrift: angular.maxAbs,
    energyDriftTrend: energy.trend,
    angularMomentumDriftTrend: angular.trend,
    energyDriftSlope: energy.slope,
    angularMomentumDriftSlope: angular.slope,
    timestepSensitivityCoverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
    timeReversalCoverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
    unitAuditCoverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
    benchmarkDescriptors: BENCHMARK_DESCRIPTORS,
    benchmarkCount: BENCHMARK_DESCRIPTORS.length,
    runtimeBenchmarkExecution: "not-run-in-runtime-ui",
    runtimeCertificationStatus: "not-claimed-in-app",
    ciCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    physicsMutation: "not-applied",
    trustedBoundary: ATLAS_NUMERICAL_INTEGRITY_BOUNDARY,
  };
}

type TwoBodyState = {
  pos: Float64Array;
  vel: Float64Array;
  mass: Float64Array;
};

function createTwoBodyState(): TwoBodyState {
  return {
    pos: new Float64Array([0, 0, 0, AU_METERS, 0, 0]),
    vel: new Float64Array([0, 0, 0, 0, 29_780, 0]),
    mass: new Float64Array([1.98847e30, 5.9722e24]),
  };
}

function cloneState(state: TwoBodyState): TwoBodyState {
  return {
    pos: new Float64Array(state.pos),
    vel: new Float64Array(state.vel),
    mass: new Float64Array(state.mass),
  };
}

function stepTwoBody(state: TwoBodyState, dtSeconds: number, steps: number): void {
  const ws = createRk4Workspaces(2);
  for (let index = 0; index < steps; index += 1) {
    rk4Step(state.pos, state.vel, state.mass, 2, dtSeconds, G_SI, 0, 0, ws);
  }
}

function vectorError(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const delta = a[index] - b[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

function vectorNorm(a: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    sum += a[index] * a[index];
  }
  return Math.sqrt(sum);
}

export function runNumericalIntegrityTimeReversalFixture(
  steps = 24,
  dtSeconds = 600
): {
  positionRelativeError: number;
  velocityRelativeError: number;
  coverage: AtlasNumericalIntegrityCoverage;
} {
  const initial = createTwoBodyState();
  const state = cloneState(initial);
  stepTwoBody(state, dtSeconds, steps);
  for (let index = 0; index < state.vel.length; index += 1) {
    state.vel[index] *= -1;
  }
  stepTwoBody(state, dtSeconds, steps);
  for (let index = 0; index < state.vel.length; index += 1) {
    state.vel[index] *= -1;
  }

  return {
    positionRelativeError: vectorError(state.pos, initial.pos) / Math.max(vectorNorm(initial.pos), 1),
    velocityRelativeError: vectorError(state.vel, initial.vel) / Math.max(vectorNorm(initial.vel), 1),
    coverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
  };
}

export function runNumericalIntegrityTimestepSensitivityFixture(
  coarseSteps = 48,
  coarseDtSeconds = 1_200
): {
  coarsePositionErrorMeters: number;
  finePositionErrorMeters: number;
  fineNotWorse: boolean;
  coverage: AtlasNumericalIntegrityCoverage;
} {
  const initial = createTwoBodyState();
  const reference = cloneState(initial);
  const coarse = cloneState(initial);
  const fine = cloneState(initial);
  stepTwoBody(reference, coarseDtSeconds / 4, coarseSteps * 4);
  stepTwoBody(coarse, coarseDtSeconds, coarseSteps);
  stepTwoBody(fine, coarseDtSeconds / 2, coarseSteps * 2);

  const coarsePositionErrorMeters = vectorError(coarse.pos, reference.pos);
  const finePositionErrorMeters = vectorError(fine.pos, reference.pos);
  return {
    coarsePositionErrorMeters,
    finePositionErrorMeters,
    fineNotWorse: finePositionErrorMeters <= coarsePositionErrorMeters * 1.05,
    coverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
  };
}

export function createNumericalIntegrityUnitAuditCoverage(): {
  auMeters: number;
  daySeconds: number;
  cMetersPerSecond: number;
  cAuPerDay: number;
  defaultSofteningMetersSquared: number;
  mercuryPrecessionTargetArcsecPerCentury: number;
  kerrKernelBoundary: "eih-1pn+kerr-geodesic-v17";
  coverage: AtlasNumericalIntegrityCoverage;
} {
  return {
    auMeters: AU_METERS,
    daySeconds: DAY_SECONDS,
    cMetersPerSecond: C_LIGHT,
    cAuPerDay: (C_LIGHT * DAY_SECONDS) / AU_METERS,
    defaultSofteningMetersSquared: defaultEps2Meters(),
    mercuryPrecessionTargetArcsecPerCentury: MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY,
    kerrKernelBoundary: "eih-1pn+kerr-geodesic-v17",
    coverage: ATLAS_NUMERICAL_INTEGRITY_COVERAGE,
  };
}
