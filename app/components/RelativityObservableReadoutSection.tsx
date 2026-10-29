import { BookOpen, Gauge, ListChecks, ShieldCheck } from "lucide-react";
import { AtlasInstrumentActionButton, AtlasInstrumentInfoBlock, AtlasInstrumentSection, AtlasInstrumentStatusBadge } from "./AtlasInstrumentUi";
import type { RelativityObservableAtlasPanelProps } from "./RelativityObservableAtlasPanel";
import type { RelativityObservableExplainerCard, RelativityObservableRow } from "../lib/simulationDiagnosticsTypes";

const KIND_LABELS: Record<RelativityObservableRow["kind"], string> = {
  "weak-field": "弱场 GR",
  "strong-field": "Kerr 工作室",
  "numerical-health": "数值健康",
};

const SCALE_BAND_LABELS: Record<RelativityObservableRow["scaleBand"], string> = {
  "weak-field-precision": "Weak-field precision",
  "strong-field-geometry": "Strong-field geometry",
  "numerical-health-boundary": "Numerical boundary",
};

const V73_CLASSIFICATION_LABELS: Record<RelativityObservableRow["kind"], string> = {
  "weak-field": "Weak-field observable: Newtonian baseline vs EIH 1PN correction",
  "strong-field": "Kerr test-particle reference: independent geodesic teaching lab",
  "numerical-health": "Numerical-health only: solver stability, not an astrophysical observable",
};

function ObservableRowCard({
  row,
  explainerCard,
}: {
  row: RelativityObservableRow;
  explainerCard: RelativityObservableExplainerCard | null;
}) {
  return (
    <AtlasInstrumentSection
      className="min-w-0"
      data-relativity-observable-row-id={row.id}
      data-relativity-observable-kind={row.kind}
      data-relativity-observable-status={row.status}
      data-relativity-observable-scale-band={row.scaleBand}
      data-atlas-relativity-classification={V73_CLASSIFICATION_LABELS[row.kind]}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 break-words text-[14px] font-semibold leading-5 text-white/90">
              {row.title}
            </h2>
            <AtlasInstrumentStatusBadge status={row.status} />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100/42">
            {KIND_LABELS[row.kind]}
          </div>
          <div className="mt-1 text-[10px] leading-4 text-white/42">
            {V73_CLASSIFICATION_LABELS[row.kind]}
          </div>
        </div>
        <div className="shrink-0 rounded border border-cyan-100/12 bg-cyan-100/[0.045] px-2 py-1 text-[10px] text-cyan-50/72">
          {row.confidence}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        <AtlasInstrumentInfoBlock
          label="formula"
          value={row.formula}
          className="[&_div:last-child]:break-all"
        />
        <AtlasInstrumentInfoBlock label="measured" value={row.measuredValue} />
        <AtlasInstrumentInfoBlock label="reference" value={row.referenceValue} />
        <AtlasInstrumentInfoBlock label="source" value={row.source} />
        <AtlasInstrumentInfoBlock label="scale band" value={SCALE_BAND_LABELS[row.scaleBand]} />
        <AtlasInstrumentInfoBlock label="scale note" value={row.scaleNote} />
      </div>
      <div className="mt-2">
        <AtlasInstrumentInfoBlock label="trusted boundary" value={row.boundary} />
      </div>
      {explainerCard ? <ExplainerCard card={explainerCard} /> : null}
    </AtlasInstrumentSection>
  );
}

function ExplainerCard({ card }: { card: RelativityObservableExplainerCard }) {
  return (
    <div
      className="mt-3 border-t border-cyan-100/10 pt-3"
      data-relativity-explainer-card-id={card.id}
      data-relativity-explainer-observable-id={card.observableId}
      data-relativity-explainer-variable-count={card.variables.length}
      data-relativity-explainer-step-count={card.derivationSteps.length}
    >
      <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100/50">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>Derivation card</span>
      </div>
      <div className="mt-2 grid min-w-0 gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <AtlasInstrumentInfoBlock
            label={card.formulaTitle}
            value={card.formulaExpression}
            className="[&_div:last-child]:break-all"
          />
          <div className="mt-2 grid gap-1">
            {card.variables.map((variable) => (
              <div
                key={`${card.id}:${variable.symbol}`}
                className="min-w-0 rounded border border-white/8 bg-white/[0.025] px-2 py-1.5"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-[11px] text-cyan-50/85">{variable.symbol}</span>
                  <span className="text-[11px] font-semibold text-white/78">{variable.label}</span>
                  <span className="text-[10px] text-white/36">{variable.unit}</span>
                </div>
                <div className="mt-1 text-[11px] leading-4 text-white/58">{variable.meaning}</div>
                <div className="mt-1 text-[10px] leading-4 text-white/34">{variable.source}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <ol className="grid gap-1.5">
            {card.derivationSteps.map((step, index) => (
              <li
                key={`${card.id}:${step.id}`}
                className="min-w-0 rounded border border-cyan-100/10 bg-cyan-100/[0.035] px-2 py-1.5"
              >
                <div className="flex min-w-0 gap-2">
                  <span className="font-mono text-[10px] text-cyan-100/48">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white/82">{step.title}</div>
                    <div className="mt-1 text-[11px] leading-4 text-white/58">{step.body}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <AtlasInstrumentInfoBlock label="scale" value={card.scaleInterpretation} />
            <AtlasInstrumentInfoBlock label="applicability" value={card.applicability} />
          </div>
          <div className="mt-2">
            <AtlasInstrumentInfoBlock label="explainer boundary" value={card.trustedBoundary} />
          </div>
        </div>
      </div>
    </div>
  );
}

export type RelativityObservableReadoutSectionProps = Pick<
  RelativityObservableAtlasPanelProps,
  | "summary"
  | "explainerSummary"
  | "relativityVerificationSummary"
  | "relativityChartSummary"
  | "physicsBenchmarkGateSummary"
  | "onOpenEvidenceLedger"
  | "onOpenKerrStudio"
>;

export function selectRelativityObservableReadoutSectionProps(
  props: RelativityObservableAtlasPanelProps,
): RelativityObservableReadoutSectionProps {
  return {
    summary: props.summary,
    explainerSummary: props.explainerSummary,
    relativityVerificationSummary: props.relativityVerificationSummary,
    relativityChartSummary: props.relativityChartSummary,
    physicsBenchmarkGateSummary: props.physicsBenchmarkGateSummary,
    onOpenEvidenceLedger: props.onOpenEvidenceLedger,
    onOpenKerrStudio: props.onOpenKerrStudio,
  };
}

export default function RelativityObservableReadoutSection({
    summary,
    explainerSummary,
    relativityVerificationSummary,
    relativityChartSummary,
    physicsBenchmarkGateSummary,
    onOpenEvidenceLedger,
    onOpenKerrStudio
}: RelativityObservableReadoutSectionProps) {
  const explainerCardsById = new Map(explainerSummary.cards.map((card) => [card.observableId, card]));
  return (
    <>
<div className="border-b border-white/10 px-3 py-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <AtlasInstrumentActionButton
            onClick={onOpenEvidenceLedger}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            证据账本
          </AtlasInstrumentActionButton>
          <AtlasInstrumentActionButton
            onClick={onOpenKerrStudio}
            icon={<Gauge className="h-3.5 w-3.5" />}
          >
            Kerr 工作室
          </AtlasInstrumentActionButton>
        </div>
      </div>

<div
        className="max-h-[calc(100dvh-var(--ui-dock-height)-160px-env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden p-3 sm:max-h-[calc(100dvh-12.5rem)]"
        role="region"
        aria-label="相对论可观测量与推导卡片"
        tabIndex={0}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-w-0 gap-2">
            {summary.rows.map((row) => (
              <ObservableRowCard
                key={row.id}
                row={row}
                explainerCard={explainerCardsById.get(row.id) ?? null}
              />
            ))}
          </div>

          <AtlasInstrumentSection className="min-w-0 self-start">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/36">
              <ListChecks className="h-3.5 w-3.5" />
              <span>Boundary</span>
            </div>
            <div className="mt-3 grid gap-2">
              <AtlasInstrumentInfoBlock label="version" value={summary.version} />
              <AtlasInstrumentInfoBlock
                label="v73"
                value={`${relativityVerificationSummary.version}; ${relativityVerificationSummary.readyReadoutCount}/${relativityVerificationSummary.readoutCount} readouts ready`}
              />
              <AtlasInstrumentInfoBlock
                label="v74 charts"
                value={`${relativityChartSummary.version}; ${relativityChartSummary.chartProfile}`}
              />
              <AtlasInstrumentInfoBlock
                label="v75 gate"
                value={`${physicsBenchmarkGateSummary.version}; ${physicsBenchmarkGateSummary.budgetProfile}`}
              />
              <AtlasInstrumentInfoBlock label="boundary" value={summary.boundary} />
              <AtlasInstrumentInfoBlock
                label="v73 boundary"
                value={relativityVerificationSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="v74 boundary"
                value={relativityChartSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="v75 boundary"
                value={physicsBenchmarkGateSummary.trustedBoundary}
              />
              <AtlasInstrumentInfoBlock
                label="Hamiltonian drift"
                value="Numerical stability only; not an astrophysical observable."
              />
              <AtlasInstrumentInfoBlock
                label="explainer"
                value={`${explainerSummary.cardCount} cards; ${explainerSummary.totalStepCount} derivation steps; ${explainerSummary.totalVariableCount} variables`}
              />
              <AtlasInstrumentInfoBlock label="explainer boundary" value={explainerSummary.boundary} />
              <AtlasInstrumentInfoBlock
                label="Physics contract"
                value="Does not modify SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr kernel."
              />
            </div>
          </AtlasInstrumentSection>
        </div>
      </div>
    </>
  );
}
