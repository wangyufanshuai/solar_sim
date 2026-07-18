import {
  ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE,
  ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import type {
  AtlasHorizonsGateAuditFailureClassification,
  AtlasHorizonsGateAuditRow,
  AtlasHorizonsGateAuditStatus,
  AtlasHorizonsGateAuditSummary,
  HorizonsComparisonBody,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_HORIZONS_GATE_AUDIT_VERSION =
  "v77-horizons-gate-closure-audit" as const;

export const ATLAS_HORIZONS_GATE_AUDIT_PROFILE =
  "v77-j2000-frame-unit-integrator-audit" as const;

export const V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED =
  "1PN RMS 1.30808e+6 km / 378.557 m/s; Mercury +10y 1PN/Newton 0.997826" as const;

export const V77_HORIZONS_GATE_AUDIT_BOUNDARY =
  "Local v77 audit over the offline Horizons runner, J2000 frame metadata, AU/AU-day to SI conversion, body order, mass mapping and shared RK4/1PN integration path. This is not NASA/JPL precision ephemeris certification, not a threshold relaxation, not full-release approval, not a background or material upgrade, and not a sky, visual, Kerr or live-physics mutation.";

export const V77_HORIZONS_DATA_LINEAGE_CHECKS = [
  "baseEpochJdTdb=2451545.0",
  "origin=sun",
  "refplane=ecliptic",
  "aberrations=geometric",
  "checkpoint-labels=J2000,+30d,+365d,+10y",
  "body-order-from-J2000-checkpoint",
  "au-and-au-per-day-to-si-conversion",
  "sun-relative-comparison-frame",
] as const;

export const V77_HORIZONS_RUNNER_LINEAGE_CHECKS = [
  "HORIZONS_VALIDATION_DT_DAYS=0.25",
  "shared-rk4Step",
  "shared-defaultEps2Meters",
  "newton-invC2=0",
  "one-pn-invC2=1/c^2",
  "worker-and-test-use-runHorizonsValidationDataset",
] as const;

export function createAtlasHorizonsGateAuditSummary(
  run: HorizonsValidationRun | null = null,
): AtlasHorizonsGateAuditSummary {
  const auditRows = run ? auditRowsFromRun(run) : [];
  const onePn = run?.modes.find((mode) => mode.mode === "1pn");
  const onePnPosition = onePn?.rmsPositionKm ?? null;
  const onePnVelocity = onePn?.rmsVelocityMs ?? null;
  const passesPosition =
    onePnPosition != null &&
    Number.isFinite(onePnPosition) &&
    onePnPosition < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm;
  const passesVelocity =
    onePnVelocity != null &&
    Number.isFinite(onePnVelocity) &&
    onePnVelocity < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs;
  const classification = classifyAudit(run, passesPosition && passesVelocity);
  const status = statusForClassification(classification);

  return {
    version: ATLAS_HORIZONS_GATE_AUDIT_VERSION,
    status,
    auditProfile: ATLAS_HORIZONS_GATE_AUDIT_PROFILE,
    physicsBenchmarkGateVersion: ATLAS_PHYSICS_BENCHMARK_GATE_VERSION,
    physicsBenchmarkBudgetProfile: ATLAS_PHYSICS_BENCHMARK_BUDGET_PROFILE,
    failureClassification: classification,
    currentFailureMeasured: run
      ? formatRunMeasured(run)
      : V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    currentThreshold: "RMS < 1,000,000 km / 10 m/s; Mercury +10y ratio < 1.02",
    modeCount: run?.modes.length ?? 0,
    checkpointCount: auditRows.length,
    auditRows,
    dataLineageChecks: V77_HORIZONS_DATA_LINEAGE_CHECKS,
    runnerLineageChecks: V77_HORIZONS_RUNNER_LINEAGE_CHECKS,
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "not-claimed",
    fullReleaseGateStatus: "blocked-by-v75-horizons-until-fixed",
    trustedBoundary: V77_HORIZONS_GATE_AUDIT_BOUNDARY,
  };
}

function auditRowsFromRun(run: HorizonsValidationRun): readonly AtlasHorizonsGateAuditRow[] {
  return run.modes.flatMap((mode) =>
    mode.checkpoints.map((checkpoint) => {
      const mercury = checkpoint.bodyComparisons.find((body) => body.bodyId === "mercury");
      const maxError = maxBodyError(checkpoint.bodyComparisons);
      return {
        mode: mode.mode,
        checkpointLabel: checkpoint.label,
        offsetDays: checkpoint.offsetDays,
        rmsPositionKm: checkpoint.rmsPositionKm,
        rmsVelocityMs: checkpoint.rmsVelocityMs,
        mercuryDeltaRKm: mercury?.deltaRKm ?? null,
        mercuryDeltaVMs: mercury?.deltaVMs ?? null,
        maxErrorBodyId: maxError?.bodyId ?? "",
        maxErrorDeltaRKm: maxError?.deltaRKm ?? null,
        maxErrorDeltaVMs: maxError?.deltaVMs ?? null,
      };
    }),
  );
}

function maxBodyError(bodies: readonly HorizonsComparisonBody[]): HorizonsComparisonBody | null {
  return bodies.reduce<HorizonsComparisonBody | null>((best, body) => {
    if (!best) return body;
    return body.deltaRKm > best.deltaRKm ? body : best;
  }, null);
}

function classifyAudit(
  run: HorizonsValidationRun | null,
  passesAggregate: boolean,
): AtlasHorizonsGateAuditFailureClassification {
  if (!run || run.status === "pending" || run.status === "running") return "pending";
  if (passesAggregate) return "none";
  if (hasLineageShapeMismatch(run)) return "reference-frame-mismatch";
  return "model-limit";
}

function hasLineageShapeMismatch(run: HorizonsValidationRun): boolean {
  if (run.modes.length !== 2) return true;
  if (run.modes.map((mode) => mode.mode).join(",") !== "newton,1pn") return true;
  return run.modes.some(
    (mode) => mode.checkpoints.map((checkpoint) => checkpoint.label).join(",") !== "+30d,+365d,+10y",
  );
}

function statusForClassification(
  classification: AtlasHorizonsGateAuditFailureClassification,
): AtlasHorizonsGateAuditStatus {
  if (classification === "none") return "pass";
  if (classification === "pending") return "pending-runtime-run";
  if (classification === "reference-frame-mismatch") return "blocked-reference-frame-mismatch";
  if (classification === "runner-bug-unresolved") return "blocked-runner-bug-unresolved";
  return "blocked-model-limit";
}

function formatRunMeasured(run: HorizonsValidationRun): string {
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const newton = run.modes.find((mode) => mode.mode === "newton");
  const onePnMercury = onePn?.checkpoints
    .find((checkpoint) => checkpoint.label === "+10y")
    ?.bodyComparisons.find((body) => body.bodyId === "mercury");
  const newtonMercury = newton?.checkpoints
    .find((checkpoint) => checkpoint.label === "+10y")
    ?.bodyComparisons.find((body) => body.bodyId === "mercury");
  const ratio =
    onePnMercury && newtonMercury && newtonMercury.deltaRKm > 0
      ? onePnMercury.deltaRKm / newtonMercury.deltaRKm
      : Number.NaN;
  return `1PN RMS ${formatNumber(onePn?.rmsPositionKm)} km / ${formatNumber(onePn?.rmsVelocityMs)} m/s; Mercury +10y 1PN/Newton ${formatNumber(ratio)}`;
}

function formatNumber(value: number | null | undefined): string {
  if (!Number.isFinite(value)) return "unavailable";
  const finite = value as number;
  if (Math.abs(finite) >= 1_000_000 || Math.abs(finite) < 0.001) return finite.toExponential(5).replace("e+", "e+");
  return finite.toPrecision(6);
}
