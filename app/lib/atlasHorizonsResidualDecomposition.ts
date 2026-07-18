import {
  createAtlasHorizonsGateAuditSummary,
} from "./atlasHorizonsGateAudit";
import type {
  AtlasHorizonsResidualCheckpointSummary,
  AtlasHorizonsResidualComponent,
  AtlasHorizonsResidualDecompositionSummary,
  AtlasHorizonsResidualRow,
  AtlasHorizonsTenYearBodyComparison,
  HorizonsOrbitalResidual,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION =
  "v81-horizons-residual-decomposition" as const;

export const ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_PROFILE =
  "v81-rtn-body-checkpoint-error-attribution" as const;

export const ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_BOUNDARY =
  "Local v81 read-only decomposition of offline Horizons residuals into a Sun-centered reference RTN frame. Dominant transverse, radial or normal components are diagnostic attribution only and do not prove a root cause. This does not relax v75 budgets, certify NASA/JPL precision, change initial states, force models, RK4, EIH 1PN, worker physics, the Kerr kernel, product/scientific gate semantics, backgrounds, materials or sky assets.";

type ReadyOrbitalResidual = HorizonsOrbitalResidual & {
  basisStatus: "ready";
  radialPositionKm: number;
  transversePositionKm: number;
  normalPositionKm: number;
  radialVelocityMs: number;
  transverseVelocityMs: number;
  normalVelocityMs: number;
};

export function createAtlasHorizonsResidualDecompositionSummary(
  run: HorizonsValidationRun | null = null,
): AtlasHorizonsResidualDecompositionSummary {
  const audit = createAtlasHorizonsGateAuditSummary(run);
  const checkpointSummaries = run ? summarizeCheckpoints(run) : [];
  const tenYearBodyComparisons = summarizeTenYearComparisons(checkpointSummaries);
  const onePnTenYear = checkpointSummaries.find(
    (checkpoint) =>
      checkpoint.mode === "1pn" && checkpoint.checkpointLabel === "+10y",
  );
  const decomposableBodyCount = checkpointSummaries.reduce(
    (maximum, checkpoint) => Math.max(maximum, checkpoint.bodyCount),
    0,
  );
  const hasCompleteDecomposition =
    run?.status === "complete" &&
    checkpointSummaries.length === 6 &&
    checkpointSummaries.every((checkpoint) => checkpoint.bodyCount > 0);

  return {
    version: ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_VERSION,
    decompositionProfile: ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_PROFILE,
    status:
      hasCompleteDecomposition && audit.status === "pass"
        ? "ready-pass"
        : hasCompleteDecomposition && audit.status === "blocked-model-limit"
          ? "ready-blocked-model-limit"
          : "pending-runtime-run",
    sourceAuditStatus: audit.status,
    referenceFrame: "sun-centered-reference-rtn",
    contributionScope: "finite-non-sun-rtn-bodies-per-mode-checkpoint",
    modeCount: run?.modes.length ?? 0,
    checkpointCount: checkpointSummaries.length,
    decomposableBodyCount,
    residualRowCount: checkpointSummaries.reduce(
      (count, checkpoint) => count + checkpoint.rows.length,
      0,
    ),
    dominantBodyId: onePnTenYear?.dominantPositionBodyId ?? "",
    checkpointSummaries,
    tenYearBodyComparisons,
    knownScientificBlocker: audit.currentFailureMeasured,
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus:
      audit.status === "pass" ? "not-claimed" : "blocked-by-strict-horizons-gate",
    trustedBoundary: ATLAS_HORIZONS_RESIDUAL_DECOMPOSITION_BOUNDARY,
  };
}

function summarizeCheckpoints(
  run: HorizonsValidationRun,
): readonly AtlasHorizonsResidualCheckpointSummary[] {
  return run.modes.flatMap((mode) =>
    mode.checkpoints.map((checkpoint) => {
      const sourceRows = checkpoint.bodyComparisons.flatMap((body) => {
        const residual = body.orbitalResidual;
        if (
          body.bodyId === "sun" ||
          !isReadyResidual(residual) ||
          !Number.isFinite(residual.positionNormKm) ||
          !Number.isFinite(residual.velocityNormMs)
        ) {
          return [];
        }
        return [{ bodyId: body.bodyId, residual }];
      });
      const positionSquareTotal = sourceRows.reduce(
        (sum, row) => sum + row.residual.positionNormKm ** 2,
        0,
      );
      const velocitySquareTotal = sourceRows.reduce(
        (sum, row) => sum + row.residual.velocityNormMs ** 2,
        0,
      );
      const rows: AtlasHorizonsResidualRow[] = sourceRows.map(
        ({ bodyId, residual }) => ({
          mode: mode.mode,
          checkpointLabel: checkpoint.label,
          bodyId,
          positionNormKm: residual.positionNormKm,
          velocityNormMs: residual.velocityNormMs,
          radialPositionKm: residual.radialPositionKm,
          transversePositionKm: residual.transversePositionKm,
          normalPositionKm: residual.normalPositionKm,
          radialVelocityMs: residual.radialVelocityMs,
          transverseVelocityMs: residual.transverseVelocityMs,
          normalVelocityMs: residual.normalVelocityMs,
          dominantPositionComponent: dominantComponent(
            residual.radialPositionKm,
            residual.transversePositionKm,
            residual.normalPositionKm,
          ),
          dominantVelocityComponent: dominantComponent(
            residual.radialVelocityMs,
            residual.transverseVelocityMs,
            residual.normalVelocityMs,
          ),
          positionContributionFraction: contributionFraction(
            residual.positionNormKm,
            positionSquareTotal,
          ),
          velocityContributionFraction: contributionFraction(
            residual.velocityNormMs,
            velocitySquareTotal,
          ),
        }),
      );
      const dominantPosition = maxRow(
        rows,
        (row) => row.positionContributionFraction,
      );
      const dominantVelocity = maxRow(
        rows,
        (row) => row.velocityContributionFraction,
      );
      return {
        mode: mode.mode,
        checkpointLabel: checkpoint.label,
        bodyCount: rows.length,
        positionContributionTotal: rows.reduce(
          (sum, row) => sum + row.positionContributionFraction,
          0,
        ),
        velocityContributionTotal: rows.reduce(
          (sum, row) => sum + row.velocityContributionFraction,
          0,
        ),
        dominantPositionBodyId: dominantPosition?.bodyId ?? "",
        dominantPositionComponent:
          dominantPosition?.dominantPositionComponent ?? "unavailable",
        dominantPositionContributionFraction:
          dominantPosition?.positionContributionFraction ?? 0,
        dominantVelocityBodyId: dominantVelocity?.bodyId ?? "",
        dominantVelocityComponent:
          dominantVelocity?.dominantVelocityComponent ?? "unavailable",
        dominantVelocityContributionFraction:
          dominantVelocity?.velocityContributionFraction ?? 0,
        rows,
      };
    }),
  );
}

function summarizeTenYearComparisons(
  checkpoints: readonly AtlasHorizonsResidualCheckpointSummary[],
): readonly AtlasHorizonsTenYearBodyComparison[] {
  const newtonRows =
    checkpoints.find(
      (checkpoint) =>
        checkpoint.mode === "newton" && checkpoint.checkpointLabel === "+10y",
    )?.rows ?? [];
  const onePnRows =
    checkpoints.find(
      (checkpoint) =>
        checkpoint.mode === "1pn" && checkpoint.checkpointLabel === "+10y",
    )?.rows ?? [];
  const newtonByBody = new Map(newtonRows.map((row) => [row.bodyId, row]));
  const onePnByBody = new Map(onePnRows.map((row) => [row.bodyId, row]));
  const bodyIds = Array.from(
    new Set([...onePnRows.map((row) => row.bodyId), ...newtonRows.map((row) => row.bodyId)]),
  );

  return bodyIds.map((bodyId) => {
    const newtonPositionKm = newtonByBody.get(bodyId)?.positionNormKm ?? null;
    const onePnPositionKm = onePnByBody.get(bodyId)?.positionNormKm ?? null;
    const ratio =
      newtonPositionKm != null &&
      onePnPositionKm != null &&
      Number.isFinite(newtonPositionKm) &&
      Number.isFinite(onePnPositionKm) &&
      newtonPositionKm > 0
        ? onePnPositionKm / newtonPositionKm
        : null;
    return {
      bodyId,
      newtonPositionKm,
      onePnPositionKm,
      onePnToNewtonPositionRatio: ratio,
      classification: classifyRatio(ratio),
    };
  });
}

function isReadyResidual(
  residual: HorizonsOrbitalResidual | undefined,
): residual is ReadyOrbitalResidual {
  return (
    residual?.basisStatus === "ready" &&
    Number.isFinite(residual.radialPositionKm) &&
    Number.isFinite(residual.transversePositionKm) &&
    Number.isFinite(residual.normalPositionKm) &&
    Number.isFinite(residual.radialVelocityMs) &&
    Number.isFinite(residual.transverseVelocityMs) &&
    Number.isFinite(residual.normalVelocityMs)
  );
}

function dominantComponent(
  radial: number,
  transverse: number,
  normal: number,
): AtlasHorizonsResidualComponent {
  const components = [
    ["radial", Math.abs(radial)],
    ["transverse", Math.abs(transverse)],
    ["normal", Math.abs(normal)],
  ] as const;
  return components.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0];
}

function contributionFraction(value: number, squareTotal: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(squareTotal) || squareTotal <= 0) {
    return 0;
  }
  return (value * value) / squareTotal;
}

function maxRow(
  rows: readonly AtlasHorizonsResidualRow[],
  select: (row: AtlasHorizonsResidualRow) => number,
): AtlasHorizonsResidualRow | null {
  return rows.reduce<AtlasHorizonsResidualRow | null>((best, row) => {
    if (!best) return row;
    return select(row) > select(best) ? row : best;
  }, null);
}

function classifyRatio(
  ratio: number | null,
): AtlasHorizonsTenYearBodyComparison["classification"] {
  if (ratio == null || !Number.isFinite(ratio)) return "unavailable";
  if (ratio < 1 - 1e-12) return "improved";
  if (ratio > 1 + 1e-12) return "worsened";
  return "unchanged";
}
