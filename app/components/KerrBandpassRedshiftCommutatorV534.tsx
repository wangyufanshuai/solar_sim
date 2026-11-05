"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrBandpassRedshiftCommutatorSnapshotV534,
  loadKerrBandpassRedshiftCommutatorSummaryV534,
  subscribeKerrBandpassRedshiftCommutatorV534,
} from "../lib/kerrBandpassRedshiftCommutatorClientV534";
import {
  createKerrBandpassRedshiftHudEncodingV534,
  resolveKerrBandpassRedshiftHudProfileV534,
  type KerrBandpassRedshiftHudModeV534,
} from "../lib/kerrBandpassRedshiftCommutatorV534";

const exponential = (value: number, digits = 5) => Number.isFinite(value) ? value.toExponential(digits) : "unavailable";
const percent = (value: number) => Number.isFinite(value) ? `${(100 * value).toFixed(5)}%` : "unavailable";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--v534-panel)] px-4 py-3">
      <div className="text-[7px] uppercase tracking-[0.2em] text-[var(--v534-muted)]">{label}</div>
      <div className="mt-2 text-sm text-[var(--v534-ink)]">{value}</div>
    </div>
  );
}

export default function KerrBandpassRedshiftCommutatorV534() {
  const [mode, setMode] = useState<KerrBandpassRedshiftHudModeV534>("science");
  const state = useSyncExternalStore(
    subscribeKerrBandpassRedshiftCommutatorV534,
    getKerrBandpassRedshiftCommutatorSnapshotV534,
    getKerrBandpassRedshiftCommutatorSnapshotV534,
  );
  const profile = resolveKerrBandpassRedshiftHudProfileV534(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrBandpassRedshiftHudEncodingV534(summary, mode) : null;

  useEffect(() => {
    void loadKerrBandpassRedshiftCommutatorSummaryV534().catch(() => undefined);
  }, []);

  const style = {
    "--v534-panel": profile.panel,
    "--v534-raised": profile.panelRaised,
    "--v534-ink": profile.ink,
    "--v534-muted": profile.muted,
    "--v534-exact": profile.exact,
    "--v534-frozen": profile.frozen,
    "--v534-unavailable": profile.unavailable,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[48px] border border-white/10 bg-[var(--v534-panel)] p-6 font-mono text-[var(--v534-ink)]"
      data-atlas-kerr-bandpass-redshift-v534
      data-atlas-v534-mode={mode}
      data-atlas-v534-scientific-row-count={encoding?.scientificGeometryInputCount ?? 0}
      data-atlas-v534-numeric-style-input-count="0"
      data-atlas-v534-canvas-created="false"
      data-atlas-v534-scene-revision-delta="0"
    >
      <header className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.44em] text-[var(--v534-muted)]">
              V534 / Science Cinematic V8.3
            </div>
            <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight">
              红移与仪器带通不能交换顺序
            </h2>
          </div>
          <div className="flex rounded-full border border-white/10 p-1">
            {(["science", "cinematic"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? "rounded-full bg-white/10 px-3 py-2 text-[8px]" : "px-3 py-2 text-[8px] text-[var(--v534-muted)]"}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v534-muted)]">
          正确算子在观测者波长上应用 η(λobs)。把响应错误冻结在发射波长 η(gλobs) 会产生真实、可计算的顺序偏差；四条 Kerr disk ray 由波长域 TypeScript 与频率域 Python 独立验证。
        </p>
      </header>

      {!summary ? (
        <div className="mt-6 rounded-2xl border border-white/10 p-4 text-[10px] text-[var(--v534-muted)]">
          {state.status === "unavailable" ? `unavailable · ${state.reason ?? "unknown"}` : "loading bandpass-redshift authority…"}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-5">
            <Metric label="disk rays" value="4" />
            <Metric label="commutator min" value={percent(summary.minima.redshiftBandpassCommutatorRelative)} />
            <Metric label="commutator max" value={percent(summary.maxima.redshiftBandpassCommutatorRelative)} />
            <Metric label="measured packs" value="0 / 6" />
            <Metric label="science pixels" value="0" />
          </div>
          <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-[var(--v534-raised)]">
            <table className="w-full min-w-[860px] border-collapse text-left text-[9px]">
              <thead className="text-[var(--v534-muted)]">
                <tr>
                  <th className="px-4 py-3 font-normal">ray / spin</th>
                  <th className="px-3 py-3 font-normal">g</th>
                  <th className="px-3 py-3 font-normal text-[var(--v534-exact)]">observer η(λobs)</th>
                  <th className="px-3 py-3 font-normal text-[var(--v534-frozen)]">frozen η(gλobs)</th>
                  <th className="px-3 py-3 font-normal">signed bias</th>
                  <th className="px-3 py-3 font-normal">|commutator|</th>
                  <th className="px-3 py-3 font-normal">TS ↔ Python</th>
                </tr>
              </thead>
              <tbody>
                {encoding?.scientificRows.map((row) => (
                  <tr key={row.rayIndex} className="border-t border-white/[0.07]">
                    <td className="px-4 py-3">{row.rayIndex} / {row.spinA.toFixed(3)}</td>
                    <td className="px-3 py-3">{row.redshiftFactor.toFixed(9)}</td>
                    <td className="px-3 py-3 text-[var(--v534-exact)]">{exponential(row.observerBandpassPhotonRadiancePerSM2Sr)}</td>
                    <td className="px-3 py-3 text-[var(--v534-frozen)]">{exponential(row.frozenEmitterBandpassPhotonRadiancePerSM2Sr)}</td>
                    <td className="px-3 py-3">{percent(row.signedFrozenBiasRelative)}</td>
                    <td className="px-3 py-3">{percent(row.redshiftBandpassCommutatorRelative)}</td>
                    <td className="px-3 py-3">{exponential(row.pythonFrequencyDomainRelativeDifference, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--v534-exact)]/20 bg-[var(--v534-exact)]/[0.035] p-4 text-[9px] leading-5 text-[var(--v534-muted)]">
              Qualified: observer-frame bandpass operator, g=1 identity, wavelength/frequency-domain agreement and four non-zero commutators. Response is applied exactly once.
            </div>
            <div className="rounded-2xl border border-[var(--v534-unavailable)]/20 bg-[var(--v534-unavailable)]/[0.035] p-4 text-[9px] leading-5 text-[var(--v534-muted)]">
              Withheld: the HST F350LP profile remains a 1/7 source-dossier candidate. No collecting area, exposure, electrons, counts, detector calibration, raster or production image is claimed.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
