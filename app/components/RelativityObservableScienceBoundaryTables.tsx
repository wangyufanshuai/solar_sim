import { AtlasInstrumentSection } from "./AtlasInstrumentUi";
import type { RelativityObservableBoundarySectionProps } from "./RelativityObservableBoundarySection";

export default function RelativityObservableScienceBoundaryTables({
  scientificGateReleaseEvidenceSummary,
  scientificGateMaintenanceRunbookSummary,
  offlineRuntimeBoundaryAuditSummary,
  horizonsProvenanceFreezeSummary,
  defaultStrictHorizonsMigrationSummary,
  strictHorizonsShadowMigrationGateSummary,
  strictHorizonsMigrationDryRunSummary,
  horizonsCandidateScientificGateSummary,
  outerSystemForceModelPreflightSummary,
  outerSystemReferenceAdoptionSummary,
  plutoResidualIsolationSummary,
  horizonsCandidateLabSummary,
  horizonsResidualDecompositionSummary,
}: RelativityObservableBoundarySectionProps) {
  return (
    <>
<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-scientific-gate-release-evidence-table
        data-atlas-scientific-gate-release-evidence-row-count={scientificGateReleaseEvidenceSummary.releaseEvidenceRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v93 Scientific gate release evidence
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Scientific gate release evidence">
            {scientificGateReleaseEvidenceSummary.releaseEvidenceRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-scientific-gate-release-evidence-row-id={row.id}
                data-atlas-scientific-gate-release-evidence-row-status={row.status}
                data-atlas-scientific-gate-release-evidence-fixture-status={row.fixtureEvidenceStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.fixtureEvidenceStatus}</span>
                <span role="cell">{row.scientificGateReleaseEvidence}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-scientific-gate-maintenance-runbook-table
        data-atlas-scientific-gate-maintenance-runbook-row-count={scientificGateMaintenanceRunbookSummary.runbookRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v92 Scientific gate maintenance runbook
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Scientific gate maintenance runbook">
            {scientificGateMaintenanceRunbookSummary.runbookRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-scientific-gate-maintenance-runbook-row-id={row.id}
                data-atlas-scientific-gate-maintenance-runbook-row-status={row.status}
                data-atlas-scientific-gate-maintenance-runbook-rollback-status={row.rollbackContractStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.rollbackContractStatus}</span>
                <span role="cell">{row.scientificGateMaintenanceRunbook}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-offline-runtime-boundary-audit-table
        data-atlas-offline-runtime-boundary-audit-row-count={offlineRuntimeBoundaryAuditSummary.boundaryRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v91 Offline/runtime boundary audit
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Offline runtime boundary audit">
            {offlineRuntimeBoundaryAuditSummary.boundaryRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-offline-runtime-boundary-audit-row-id={row.id}
                data-atlas-offline-runtime-boundary-audit-row-status={row.status}
                data-atlas-offline-runtime-boundary-audit-runtime-status={row.runtimeClaimStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.runtimeClaimStatus}</span>
                <span role="cell">{row.offlineRuntimeBoundaryAudit}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-provenance-freeze-table
        data-atlas-horizons-provenance-freeze-row-count={horizonsProvenanceFreezeSummary.freezeRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v90 Horizons provenance freeze
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons provenance freeze">
            {horizonsProvenanceFreezeSummary.freezeRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-horizons-provenance-freeze-row-id={row.id}
                data-atlas-horizons-provenance-freeze-row-status={row.status}
                data-atlas-horizons-provenance-freeze-hash-status={row.fixtureHashStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.fixtureHashStatus}</span>
                <span role="cell">{row.provenanceFreeze}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-default-strict-horizons-migration-table
        data-atlas-default-strict-horizons-migration-row-count={defaultStrictHorizonsMigrationSummary.migrationRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v89 Default strict Horizons migration
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Default strict Horizons migration">
            {defaultStrictHorizonsMigrationSummary.migrationRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                role="row"
                data-atlas-default-strict-horizons-migration-row-id={row.id}
                data-atlas-default-strict-horizons-migration-row-status={row.status}
                data-atlas-default-strict-horizons-migration-budget-status={row.migratedBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.migratedBudgetStatus}</span>
                <span role="cell">{row.defaultScientificGateMigration}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-strict-horizons-shadow-migration-gate-table
        data-atlas-strict-horizons-shadow-migration-gate-row-count={strictHorizonsShadowMigrationGateSummary.shadowGateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v88 Strict Horizons shadow migration gate
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Strict Horizons shadow migration gate">
            {strictHorizonsShadowMigrationGateSummary.shadowGateRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-strict-horizons-shadow-migration-gate-row-id={row.id}
                data-atlas-strict-horizons-shadow-migration-gate-row-status={row.status}
                data-atlas-strict-horizons-shadow-migration-gate-budget-status={row.shadowBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.shadowBudgetStatus}</span>
                <span role="cell">
                  {row.onePnRmsPositionKm == null
                    ? row.status
                    : `${row.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-strict-horizons-migration-dry-run-table
        data-atlas-strict-horizons-migration-dry-run-row-count={strictHorizonsMigrationDryRunSummary.migrationDiffCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v87 Strict Horizons migration dry-run
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Strict Horizons migration dry-run">
            {strictHorizonsMigrationDryRunSummary.migrationDiffRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-strict-horizons-migration-dry-run-row-id={row.id}
                data-atlas-strict-horizons-migration-dry-run-row-status={row.status}
                data-atlas-strict-horizons-migration-dry-run-diff-status={row.diffStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {row.id}
                </span>
                <span role="cell">{row.diffStatus}</span>
                <span role="cell">{row.candidateBudgetStatus}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-candidate-scientific-gate-table
        data-atlas-horizons-candidate-scientific-gate-row-count={horizonsCandidateScientificGateSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v86 Horizons candidate scientific gate
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons candidate scientific gate">
            {horizonsCandidateScientificGateSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-horizons-candidate-scientific-gate-candidate-id={candidate.id}
                data-atlas-horizons-candidate-scientific-gate-candidate-status={candidate.status}
                data-atlas-horizons-candidate-scientific-gate-budget-status={candidate.candidateBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.candidateBudgetStatus}</span>
                <span role="cell">
                  {candidate.onePnRmsPositionKm == null
                    ? candidate.status
                    : `${candidate.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-outer-system-force-model-preflight-table
        data-atlas-outer-system-force-model-preflight-row-count={outerSystemForceModelPreflightSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v84 Outer-system force-model preflight
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Outer-system force-model preflight">
            {outerSystemForceModelPreflightSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-outer-system-force-model-preflight-candidate-id={candidate.id}
                data-atlas-outer-system-force-model-preflight-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.targetRole}</span>
                <span role="cell">
                  {candidate.plutoPositionKm == null
                    ? candidate.status
                    : `${candidate.plutoPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-outer-system-reference-adoption-table
        data-atlas-outer-system-reference-adoption-row-count={outerSystemReferenceAdoptionSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v85 Outer-system reference adoption
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Outer-system reference adoption">
            {outerSystemReferenceAdoptionSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
                role="row"
                data-atlas-outer-system-reference-adoption-candidate-id={candidate.id}
                data-atlas-outer-system-reference-adoption-candidate-status={candidate.status}
                data-atlas-outer-system-reference-adoption-budget-status={candidate.candidateBudgetStatus}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">{candidate.candidateBudgetStatus}</span>
                <span role="cell">
                  {candidate.onePnRmsPositionKm == null
                    ? candidate.status
                    : `${candidate.onePnRmsPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-pluto-residual-isolation-table
        data-atlas-pluto-residual-isolation-row-count={plutoResidualIsolationSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v83 Pluto residual isolation
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Pluto residual isolation">
            {plutoResidualIsolationSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_6rem_7rem]"
                role="row"
                data-atlas-pluto-residual-isolation-candidate-id={candidate.id}
                data-atlas-pluto-residual-isolation-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">dt {candidate.dtDays}</span>
                <span role="cell">
                  {candidate.plutoPositionKm == null
                    ? "pending"
                    : `${candidate.plutoPositionKm.toExponential(2)} km`}
                </span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-candidate-table
        data-atlas-horizons-candidate-row-count={horizonsCandidateLabSummary.candidateCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v82 Horizons candidate lab
          </div>
          <div className="mt-2 grid gap-1" role="table" aria-label="Horizons candidate lab">
            {horizonsCandidateLabSummary.candidateRows.map((candidate) => (
              <div
                key={candidate.id}
                className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]"
                role="row"
                data-atlas-horizons-candidate-id={candidate.id}
                data-atlas-horizons-candidate-status={candidate.status}
              >
                <span className="min-w-0 font-mono text-cyan-50/80" role="cell">
                  {candidate.id}
                </span>
                <span role="cell">dt {candidate.dtDays}</span>
                <span role="cell">eps {candidate.softeningAu}</span>
              </div>
            ))}
          </div>
        </AtlasInstrumentSection>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-horizons-residual-table
        data-atlas-horizons-residual-row-count={horizonsResidualDecompositionSummary.residualRowCount}
      >
        <AtlasInstrumentSection className="min-w-0">
          <div className="text-base text-cyan-100/70">
            v81 Horizons residual attribution
          </div>
          {horizonsResidualDecompositionSummary.checkpointSummaries.length > 0 ? (
            <div className="mt-2 grid gap-1" role="table" aria-label="Horizons RTN residual attribution">
              {horizonsResidualDecompositionSummary.checkpointSummaries.map((checkpoint) => (
                <div
                  key={`${checkpoint.mode}:${checkpoint.checkpointLabel}`}
                  className="grid min-w-0 gap-2 border-t border-white/[0.06] py-1.5 text-base leading-6 text-white/66 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]"
                  role="row"
                  data-atlas-horizons-residual-checkpoint={`${checkpoint.mode}:${checkpoint.checkpointLabel}`}
                >
                  <span className="font-mono text-cyan-50/80" role="cell">
                    {checkpoint.mode} {checkpoint.checkpointLabel}
                  </span>
                  <span className="min-w-0" role="cell">
                    position {checkpoint.dominantPositionBodyId} / {checkpoint.dominantPositionComponent} /{" "}
                    {(checkpoint.dominantPositionContributionFraction * 100).toFixed(1)}%
                  </span>
                  <span className="min-w-0" role="cell">
                    velocity {checkpoint.dominantVelocityBodyId} / {checkpoint.dominantVelocityComponent} /{" "}
                    {(checkpoint.dominantVelocityContributionFraction * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-base leading-6 text-white/56">
              Runtime Horizons residuals pending. No CI or scientific certification is claimed in-app.
            </div>
          )}
        </AtlasInstrumentSection>
      </div>

    </>
  );
}
