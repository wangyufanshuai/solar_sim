import { MERCURY_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  runNumericalIntegrityTimeReversalFixture,
  runNumericalIntegrityTimestepSensitivityFixture,
} from "./atlasNumericalIntegrity";
import {
  SCHWARZSCHILD_STRONG_FIELD_ANCHORS,
  createKerrGeodesicValidationSummary,
  kerrEquatorialIscoRadiusM,
  kerrOuterHorizonRadiusM,
  weakFieldLightDeflectionRad,
} from "./kerrGeodesicKernel";
import {
  mercuryPrecessionValidation,
  shapiroDelayValidation,
  solarLimbLightDeflectionValidation,
  timeDilationValidation,
} from "./relativityValidation";
import { SolarSystemPhysics } from "./solarSystemPhysics";
import type {
  AtlasPhysicsBenchmarkGateSummary,
  AtlasPhysicsBenchmarkResult,
  AtlasPhysicsBenchmarkStatus,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PHYSICS_BENCHMARK_GATE_VERSION =
  "v75-physics-benchmark-release-gate" as const;
export const ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE =
  "v75-weak-field-horizons-kerr-error-budget" as const;

export const ATLAS_PHYSICS_BENCHMARK_BOUNDARY =
  "Local v75 blocking benchmark contract over deterministic weak-field formulas, RK4 fixtures, offline JPL Horizons checkpoints and the existing equatorial Kerr test-particle kernel. Runtime UI status is read-only and does not claim the latest CI result, NASA/JPL precision ephemeris equivalence, full numerical relativity, non-equatorial Carter-constant coverage, online validation, physics mutation, sky mutation or Kerr kernel mutation.";

export const ATLAS_PHYSICS_BENCHMARK_BUDGETS = {
  mercuryErrorPercent: 5,
  lightDeflectionErrorPercent: 1,
  shapiroRepeatRelativeDelta: 1e-12,
  weakFieldSlowdownFraction: 1e-3,
  timestepFineToCoarseRatio: 1.05,
  timeReversalRelativeError: 1e-9,
  analyticAnchorAbsoluteError: 1e-12,
  kerrNullTimelikeHamiltonianDrift: 1e-10,
  kerrProbeHamiltonianDrift: 1e-6,
  horizonsPositionRmsKm: 1_000_000,
  horizonsVelocityRmsMs: 10,
  horizonsMercuryOnePnToNewtonRatio: 1.02,
} as const;

export function classifyStrictUpperBound(
  measured: number | null | undefined,
  threshold: number,
): AtlasPhysicsBenchmarkStatus {
  return Number.isFinite(measured) && (measured as number) < threshold ? "pass" : "fail";
}

let cachedFastBenchmarkResults: readonly AtlasPhysicsBenchmarkResult[] | null = null;

function createFastBenchmarkResults(): readonly AtlasPhysicsBenchmarkResult[] {
  const physics = new SolarSystemPhysics({
    activeN: SOLAR_SYSTEM_BODIES.length,
    forceFixedRk4: true,
  });
  const mercury = mercuryPrecessionValidation(physics);
  const light = solarLimbLightDeflectionValidation();
  const shapiroFirst = shapiroDelayValidation(physics, MERCURY_BODY_INDEX);
  const shapiroSecond = shapiroDelayValidation(physics, MERCURY_BODY_INDEX);
  const clock = timeDilationValidation(physics, MERCURY_BODY_INDEX, null);
  const timestep = runNumericalIntegrityTimestepSensitivityFixture();
  const reversal = runNumericalIntegrityTimeReversalFixture();
  const kerr = createKerrGeodesicValidationSummary(0.9);

  const shapiroRelativeDelta =
    shapiroFirst.microseconds != null &&
    shapiroSecond.microseconds != null &&
    shapiroFirst.microseconds > 0
      ? Math.abs(shapiroFirst.microseconds - shapiroSecond.microseconds) /
        Math.max(Math.abs(shapiroFirst.microseconds), Number.EPSILON)
      : Number.NaN;
  const timestepRatio =
    timestep.coarsePositionErrorMeters > 0
      ? timestep.finePositionErrorMeters / timestep.coarsePositionErrorMeters
      : Number.NaN;
  const analyticAnchorError = Math.max(
    Math.abs(kerrOuterHorizonRadiusM(0) - SCHWARZSCHILD_STRONG_FIELD_ANCHORS.horizonRadiusM),
    Math.abs(kerrEquatorialIscoRadiusM(0, "prograde") - SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM),
    Math.abs(kerrEquatorialIscoRadiusM(0, "retrograde") - SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM),
    Math.abs(weakFieldLightDeflectionRad(1_000) - 0.004),
  );

  const results: AtlasPhysicsBenchmarkResult[] = [
    result({
      id: "mercury-perihelion-anchor",
      domain: "weak-field",
      classification: "analytic-anchor",
      status: classifyStrictUpperBound(
        mercury.errorPercent,
        ATLAS_PHYSICS_BENCHMARK_BUDGETS.mercuryErrorPercent,
      ),
      measured: `${formatNumber(mercury.onePnArcsecPerCentury)} arcsec/century; error ${formatNumber(mercury.errorPercent)}%`,
      threshold: "error < 5%",
      boundary: "Analytic 1PN perihelion anchor from the fixed local J2000 state; not a century-long live integration.",
    }),
    result({
      id: "solar-limb-deflection-anchor",
      domain: "weak-field",
      classification: "analytic-anchor",
      status: classifyStrictUpperBound(
        light.errorPercent,
        ATLAS_PHYSICS_BENCHMARK_BUDGETS.lightDeflectionErrorPercent,
      ),
      measured: `${formatNumber(light.formulaArcsec)} arcsec; error ${formatNumber(light.errorPercent)}%`,
      threshold: "error < 1%",
      boundary: "Closed-form solar-limb weak-field reference; not full ray tracing.",
    }),
    result({
      id: "shapiro-fixed-state-regression",
      domain: "weak-field",
      classification: "formula-regression",
      status:
        shapiroFirst.status === "ready" &&
        (shapiroFirst.microseconds ?? 0) > 0 &&
        classifyStrictUpperBound(
          shapiroRelativeDelta,
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.shapiroRepeatRelativeDelta,
        ) === "pass"
          ? "pass"
          : "fail",
      measured: `${formatNumber(shapiroFirst.microseconds)} us; repeat delta ${formatExponential(shapiroRelativeDelta)}`,
      threshold: "finite and positive; repeat relative delta < 1e-12",
      boundary: "Deterministic fixed-state formula regression, not an independent ranging observation.",
    }),
    result({
      id: "weak-field-clock-rate",
      domain: "weak-field",
      classification: "analytic-anchor",
      status:
        clock.status === "ready" &&
        Number.isFinite(clock.ratio) &&
        classifyStrictUpperBound(
          Math.abs((clock.ratio ?? Number.NaN) - 1),
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.weakFieldSlowdownFraction,
        ) === "pass" &&
        classifyStrictUpperBound(
          Math.abs(clock.slowdownFraction ?? Number.NaN),
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.weakFieldSlowdownFraction,
        ) === "pass"
          ? "pass"
          : "fail",
      measured: `ratio ${formatNumber(clock.ratio)}; slowdown ${formatExponential(clock.slowdownFraction)}`,
      threshold: "|ratio - 1| < 1e-3; |slowdown| < 1e-3",
      boundary: "Weak-field gravitational plus kinematic clock-rate check; not precision timing certification.",
    }),
    result({
      id: "rk4-timestep-convergence",
      domain: "numerical",
      classification: "numerical-health",
      status: classifyStrictUpperBound(
        timestepRatio,
        ATLAS_PHYSICS_BENCHMARK_BUDGETS.timestepFineToCoarseRatio,
      ),
      measured: `fine/coarse ${formatExponential(timestepRatio)}`,
      threshold: "fine/coarse position error < 1.05",
      boundary: "Deterministic local two-body RK4 fixture; does not mutate the live integrator.",
    }),
    result({
      id: "rk4-time-reversal",
      domain: "numerical",
      classification: "numerical-health",
      status:
        classifyStrictUpperBound(
          reversal.positionRelativeError,
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.timeReversalRelativeError,
        ) === "pass" &&
        classifyStrictUpperBound(
          reversal.velocityRelativeError,
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.timeReversalRelativeError,
        ) === "pass"
          ? "pass"
          : "fail",
      measured: `position ${formatExponential(reversal.positionRelativeError)}; velocity ${formatExponential(reversal.velocityRelativeError)}`,
      threshold: "position and velocity relative error < 1e-9",
      boundary: "Local reversibility health fixture; RK4 is not claimed to be a symplectic integrator.",
    }),
    result({
      id: "schwarzschild-kerr-analytic-anchors",
      domain: "kerr",
      classification: "analytic-anchor",
      status: classifyStrictUpperBound(
        analyticAnchorError,
        ATLAS_PHYSICS_BENCHMARK_BUDGETS.analyticAnchorAbsoluteError,
      ),
      measured: `max absolute anchor error ${formatExponential(analyticAnchorError)}`,
      threshold: "2M/3M/6M and 4M/b absolute error < 1e-12",
      boundary: "Equatorial analytic anchor check only; no Carter-constant claim.",
    }),
    result({
      id: "kerr-hamiltonian-drift",
      domain: "kerr",
      classification: "numerical-health",
      status:
        classifyStrictUpperBound(
          Math.max(
            kerr.integration.nullHamiltonianDrift,
            kerr.integration.timelikeHamiltonianDrift,
          ),
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.kerrNullTimelikeHamiltonianDrift,
        ) === "pass" &&
        classifyStrictUpperBound(
          kerr.integration.probeHamiltonianDrift,
          ATLAS_PHYSICS_BENCHMARK_BUDGETS.kerrProbeHamiltonianDrift,
        ) === "pass"
          ? "pass"
          : "fail",
      measured: `null/timelike ${formatExponential(Math.max(kerr.integration.nullHamiltonianDrift, kerr.integration.timelikeHamiltonianDrift))}; probe ${formatExponential(kerr.integration.probeHamiltonianDrift)}`,
      threshold: "null/timelike < 1e-10; probe < 1e-6",
      boundary: "Numerical health for displayed equatorial test-particle tracks, not an astrophysical observable.",
    }),
  ];
  return results;
}

export function createAtlasPhysicsBenchmarkGateSummary(
  horizonsRun: HorizonsValidationRun | null = null,
): AtlasPhysicsBenchmarkGateSummary {
  cachedFastBenchmarkResults ??= createFastBenchmarkResults();
  const results = [...cachedFastBenchmarkResults, horizonsResult(horizonsRun)];
  const passCount = results.filter((item) => item.status === "pass").length;
  const pendingCount = results.filter((item) => item.status === "pending").length;
  const failCount = results.filter((item) => item.status === "fail").length;
  return {
    version: ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
    budgetProfile: ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE,
    runtimeStatus: failCount > 0 ? "fail" : pendingCount > 0 ? "pending" : "pass",
    resultCount: results.length,
    passCount,
    pendingCount,
    failCount,
    blockingCount: failCount,
    ciCertificationStatus: "not-claimed-in-app",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_PHYSICS_BENCHMARK_BOUNDARY,
    results,
  };
}

function horizonsResult(
  run: HorizonsValidationRun | null,
): AtlasPhysicsBenchmarkResult {
  if (!run || run.status === "pending" || run.status === "running") {
    return result({
      id: "horizons-ten-year-eih-1pn",
      domain: "ephemeris",
      classification: "ephemeris-comparison",
      status: "pending",
      measured: run ? `${run.status}; ${Math.round(run.progress * 100)}%` : "not started",
      threshold: "complete two modes and three future checkpoints",
      boundary: "Runtime worker result pending; latest CI status is not claimed in the app.",
    });
  }
  if (run.status === "failed") {
    return result({
      id: "horizons-ten-year-eih-1pn",
      domain: "ephemeris",
      classification: "ephemeris-comparison",
      status: "fail",
      measured: run.error ?? "worker failed",
      threshold: "complete two modes and three future checkpoints",
      boundary: "Offline local Horizons runner failed; no online fallback is used.",
    });
  }

  const newton = run.modes.find((mode) => mode.mode === "newton");
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const newtonTenYear = newton?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const onePnTenYear = onePn?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const newtonMercury = newtonTenYear?.bodyComparisons.find((body) => body.bodyId === "mercury");
  const onePnMercury = onePnTenYear?.bodyComparisons.find((body) => body.bodyId === "mercury");
  const mercuryRatio =
    newtonMercury && onePnMercury && newtonMercury.deltaRKm > 0
      ? onePnMercury.deltaRKm / newtonMercury.deltaRKm
      : Number.NaN;
  const completeModes =
    run.modes.length === 2 &&
    newton?.checkpoints.length === 3 &&
    onePn?.checkpoints.length === 3;
  const finiteCheckpoints = run.modes.every((mode) =>
    mode.checkpoints.every(
      (checkpoint) =>
        checkpoint.available &&
        Number.isFinite(checkpoint.rmsPositionKm) &&
        Number.isFinite(checkpoint.rmsVelocityMs),
    ),
  );
  const passes =
    completeModes &&
    finiteCheckpoints &&
    classifyStrictUpperBound(
      onePn?.rmsPositionKm,
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    ) === "pass" &&
    classifyStrictUpperBound(
      onePn?.rmsVelocityMs,
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    ) === "pass" &&
    classifyStrictUpperBound(
      mercuryRatio,
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    ) === "pass";

  return result({
    id: "horizons-ten-year-eih-1pn",
    domain: "ephemeris",
    classification: "ephemeris-comparison",
    status: passes ? "pass" : "fail",
    measured: `1PN RMS ${formatNumber(onePn?.rmsPositionKm)} km / ${formatNumber(onePn?.rmsVelocityMs)} m/s; Mercury +10y 1PN/Newton ${formatNumber(mercuryRatio)}`,
    threshold: "RMS < 1,000,000 km / 10 m/s; Mercury +10y ratio < 1.02",
    boundary: "Ten-year offline checkpoint comparison, separate from the initial J2000 epoch match and not a precision ephemeris replacement.",
  });
}

function result(
  value: Omit<AtlasPhysicsBenchmarkResult, "blocking">,
): AtlasPhysicsBenchmarkResult {
  return { ...value, blocking: true };
}

function formatNumber(value: number | null | undefined): string {
  return Number.isFinite(value) ? (value as number).toPrecision(6) : "unavailable";
}

function formatExponential(value: number | null | undefined): string {
  return Number.isFinite(value) ? (value as number).toExponential(2) : "unavailable";
}
