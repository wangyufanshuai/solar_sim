import { AtlasInstrumentInfoBlock, AtlasInstrumentSection } from "./AtlasInstrumentUi";
import type { AtlasRelativityChartSummary, AtlasRelativityMercuryCurvePoint } from "../lib/simulationDiagnosticsTypes";

function RelativityMercuryCurve({
  points,
}: {
  points: readonly AtlasRelativityMercuryCurvePoint[];
}) {
  const maxY = Math.max(1, ...points.map((point) => point.targetArcsec));
  const eihPolyline = chartPolyline(points.map((point) => point.eihOnePnArcsec), maxY);
  const targetPolyline = chartPolyline(points.map((point) => point.targetArcsec), maxY);
  const newtonPolyline = chartPolyline(points.map((point) => point.newtonianArcsec), maxY);

  return (
    <div className="mt-2 h-28 min-w-0 rounded border border-cyan-100/10 bg-black/18 p-2">
      <svg
        viewBox="0 0 100 64"
        className="h-full w-full overflow-visible"
        aria-label="Mercury Newtonian versus EIH 1PN precession curve"
      >
        <polyline points="0,60 100,60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
        <polyline points="0,6 100,6" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
        <polyline points={targetPolyline} fill="none" stroke="rgba(255,255,255,0.36)" strokeWidth="1" strokeDasharray="3 3" />
        <polyline points={eihPolyline} fill="none" stroke="rgba(125,211,252,0.9)" strokeWidth="1.8" />
        <polyline points={newtonPolyline} fill="none" stroke="rgba(248,113,113,0.7)" strokeWidth="1.2" />
        {points.map((point, index) => (
          <circle
            key={`${point.label}:${index}`}
            cx={chartX(index, points.length)}
            cy={chartY(point.eihOnePnArcsec, maxY)}
            r="1.8"
            fill="rgba(125,211,252,0.92)"
          />
        ))}
      </svg>
    </div>
  );
}

function KerrIscoBars({ summary }: { summary: AtlasRelativityChartSummary }) {
  const maxRadius = Math.max(1, ...summary.kerrIscoBars.map((bar) => bar.radiusM));
  return (
    <div className="grid gap-1.5">
      {summary.kerrIscoBars.map((bar) => (
        <div
          key={bar.id}
          className="min-w-0"
          data-atlas-relativity-isco-bar-id={bar.id}
          data-atlas-relativity-isco-bar-radius-m={bar.radiusM.toFixed(3)}
        >
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-white/48">
            <span>{bar.label}</span>
            <span className="font-mono text-cyan-50/72">{bar.radiusM.toFixed(3)}M</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-white/[0.06]">
            <div
              className="h-full rounded bg-cyan-200/70"
              style={{ width: `${Math.max(4, (bar.radiusM / maxRadius) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function chartPolyline(values: readonly number[], maxY: number): string {
  return values.map((value, index) => `${chartX(index, values.length)},${chartY(value, maxY)}`).join(" ");
}

function chartX(index: number, length: number): number {
  return length <= 1 ? 0 : (index / (length - 1)) * 100;
}

function chartY(value: number, maxY: number): number {
  return 60 - Math.max(0, Math.min(1, value / maxY)) * 54;
}

export function RelativityWeakFieldChartSection({ summary }: { summary: AtlasRelativityChartSummary }) {
  return (
    <AtlasInstrumentSection className="min-w-0" data-atlas-relativity-chart-id="mercury-newtonian-eih-1pn">
      <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/46">v74 Mercury precession curve</div>
      <RelativityMercuryCurve points={summary.mercuryCurve} />
      <div className="mt-2 grid gap-1 text-[10px] leading-4 text-white/46 sm:grid-cols-3">
        <span>Newtonian {summary.mercuryNewtonianArcsecPerCentury.toFixed(2)} arcsec/century</span>
        <span>EIH 1PN {summary.mercuryEihOnePnArcsecPerCentury.toFixed(2)}</span>
        <span>Target {summary.mercuryTargetArcsecPerCentury.toFixed(2)}</span>
      </div>
    </AtlasInstrumentSection>
  );
}

export function RelativityKerrChartSection({ summary }: { summary: AtlasRelativityChartSummary }) {
  return (
    <AtlasInstrumentSection className="min-w-0" data-atlas-relativity-chart-id="kerr-isco-hamiltonian">
      <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/46">v74 Kerr readout</div>
      <div className="mt-2 grid gap-2">
        <KerrIscoBars summary={summary} />
        <AtlasInstrumentInfoBlock label="Hamiltonian drift" value={`${summary.hamiltonianDrift.formatted}; ${summary.hamiltonianDrift.classification}`} />
      </div>
    </AtlasInstrumentSection>
  );
}

export default function RelativityObservableChartSection({ summary }: { summary: AtlasRelativityChartSummary }) {
  return (
    <div className="border-b border-cyan-100/10 px-3 py-2">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)]">
        <RelativityWeakFieldChartSection summary={summary} />
        <RelativityKerrChartSection summary={summary} />
      </div>
    </div>
  );
}
