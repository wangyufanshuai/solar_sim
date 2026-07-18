import { ATLAS_PHYSICS_BENCHMARK_BUDGETS, createAtlasPhysicsBenchmarkGateSummary } from "./atlasPhysicsBenchmarkGate";
import { V82_DE440_SYSTEM_MASS_KG_BY_ID } from "./atlasHorizonsCandidateLab";
import {
  auditOuterSystemFixtureProvenance,
} from "./atlasOuterSystemForceModelPreflightRunner";
import { V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW } from "./atlasOuterSystemReferenceAdoption";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import type {
  AtlasOuterSystemReferenceAdoptionLockAudit,
  AtlasOuterSystemReferenceAdoptionRow,
  HorizonsComparisonCheckpoint,
  HorizonsValidationDataset,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export async function runAtlasOuterSystemReferenceAdoptionPreflight(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
}): Promise<{
  lockAudits: readonly AtlasOuterSystemReferenceAdoptionLockAudit[];
  rows: readonly AtlasOuterSystemReferenceAdoptionRow[];
}> {
  const v82Audit = auditOuterSystemFixtureProvenance({
    id: "v82-hierarchy-candidate",
    label: "v82 hierarchy barycenter candidate fixture",
    baselineDataset: args.baselineDataset,
    candidateDataset: args.v82HierarchyDataset,
    expectedVariant: "v82-hierarchy-barycenter-candidate",
  });
  const v84Audit = auditOuterSystemFixtureProvenance({
    id: "v84-outer-system-barycenter",
    label: "v84 outer-system barycenter fixture",
    baselineDataset: args.baselineDataset,
    candidateDataset: args.v84OuterSystemDataset,
    expectedVariant: "v84-outer-system-barycenter-reference",
  });
  const lockAudits = [
    auditStrictFixtureLock(args.baselineDataset),
    {
      id: "v84-reference-fixture-provenance",
      label: "v84 reference fixture provenance",
      status: v84Audit.status === "ready" ? "ready" : "regressed",
      measured: `${v84Audit.status}; ${v84Audit.targetProvenanceBodyCount} provenance rows; ${v84Audit.barycenterTargetCount} barycenter targets`,
      expected: "ready; 12 provenance rows; 6 system-barycenter targets",
      trustedBoundary: v84Audit.trustedBoundary,
    },
    {
      id: "v82-legacy-candidate-provenance",
      label: "v82 legacy candidate remains rejected",
      status: v82Audit.status === "provenance-insufficient" ? "ready" : "regressed",
      measured: `${v82Audit.status}; outer-system delta ${v82Audit.outerSystemJ2000DeltaAu ?? "unavailable"} AU`,
      expected: "provenance-insufficient; old candidate must not become an adoption source",
      trustedBoundary:
        "The old v82 candidate is a regression sentinel only. If it stops being provenance-insufficient, the v85 adoption path must be re-audited before any migration decision.",
    },
  ] as const satisfies readonly AtlasOuterSystemReferenceAdoptionLockAudit[];

  if (lockAudits.some((audit) => audit.status !== "ready") || !args.v84OuterSystemDataset) {
    return {
      lockAudits,
      rows: [{ ...V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW, status: "blocked" }],
    };
  }

  const run = await runHorizonsValidationDataset(args.v84OuterSystemDataset, {
    dtDays: V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW.dtDays,
    eps2Meters: 0,
    massKgByBodyId: V82_DE440_SYSTEM_MASS_KG_BY_ID,
  });

  return {
    lockAudits,
    rows: [rowFromRun(run)],
  };
}

function auditStrictFixtureLock(
  dataset: HorizonsValidationDataset,
): AtlasOuterSystemReferenceAdoptionLockAudit {
  const labels = dataset.checkpoints.map((checkpoint) => checkpoint.label).join(",");
  const j2000 = dataset.checkpoints.find((checkpoint) => checkpoint.label === "J2000");
  const bodyCount = j2000?.bodies.length ?? 0;
  const status =
    dataset.variant == null &&
    dataset.targetProvenance == null &&
    dataset.origin === "sun" &&
    dataset.refplane === "ecliptic" &&
    dataset.aberrations === "geometric" &&
    dataset.baseEpochJdTdb === 2451545 &&
    labels === "J2000,+30d,+365d,+10y" &&
    bodyCount === 12
      ? "ready"
      : "regressed";
  return {
    id: "v75-strict-fixture-lock",
    label: "v75 strict fixture lock",
    status,
    measured: `variant ${dataset.variant ?? "none"}; provenance ${dataset.targetProvenance?.length ?? 0}; labels ${labels}; J2000 bodies ${bodyCount}`,
    expected:
      "no variant; no target provenance; sun/ecliptic/geometric; J2000,+30d,+365d,+10y; 12 J2000 bodies",
    trustedBoundary:
      "The default strict fixture remains the v75 center-reference dataset. v85 reads it as a lock audit only and does not overwrite, regenerate or migrate it.",
  };
}

function rowFromRun(run: HorizonsValidationRun): AtlasOuterSystemReferenceAdoptionRow {
  const gate = createAtlasPhysicsBenchmarkGateSummary(run);
  const horizonsGate = gate.results.find((result) => result.id === "horizons-ten-year-eih-1pn");
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const newton = run.modes.find((mode) => mode.mode === "newton");
  const onePnTenYear = onePn?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const newtonTenYear = newton?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const pluto = findBody(onePnTenYear, "pluto");
  return {
    ...V85_OUTER_SYSTEM_REFERENCE_ADOPTION_ROW,
    status: "complete",
    onePnRmsPositionKm: onePn?.rmsPositionKm ?? null,
    onePnRmsVelocityMs: onePn?.rmsVelocityMs ?? null,
    mercuryOnePnToNewtonRatio: mercuryRatio(onePnTenYear, newtonTenYear),
    plutoPositionKm: pluto?.deltaRKm ?? null,
    plutoVelocityMs: pluto?.deltaVMs ?? null,
    candidateBudgetStatus: horizonsGate?.status === "pass" ? "pass" : "fail",
    mutationStatus: "not-applied",
  };
}

function findBody(
  checkpoint: HorizonsComparisonCheckpoint | undefined,
  bodyId: string,
) {
  return checkpoint?.bodyComparisons.find((body) => body.bodyId === bodyId);
}

function mercuryRatio(
  onePnTenYear: HorizonsComparisonCheckpoint | undefined,
  newtonTenYear: HorizonsComparisonCheckpoint | undefined,
): number | null {
  const onePn = findBody(onePnTenYear, "mercury");
  const newton = findBody(newtonTenYear, "mercury");
  if (!onePn || !newton || newton.deltaRKm <= 0) return null;
  return onePn.deltaRKm / newton.deltaRKm;
}

export function v85StrictBudgetContract(): Readonly<{
  horizonsPositionRmsKm: number;
  horizonsVelocityRmsMs: number;
  horizonsMercuryOnePnToNewtonRatio: number;
}> {
  return {
    horizonsPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    horizonsVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    horizonsMercuryOnePnToNewtonRatio:
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
  };
}
