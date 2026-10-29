"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrNormalizedFrequencySnapshotV478,
  loadKerrNormalizedFrequencySummaryV478,
  subscribeKerrNormalizedFrequencyV478,
} from "../lib/kerrNormalizedFrequencyClientV478";

export default function KerrNormalizedFrequencyChartV478() {
  const state = useSyncExternalStore(
    subscribeKerrNormalizedFrequencyV478,
    getKerrNormalizedFrequencySnapshotV478,
    getKerrNormalizedFrequencySnapshotV478,
  );
  const [selectedId, setSelectedId] = useState("disk-00");
  useEffect(() => {
    void loadKerrNormalizedFrequencySummaryV478().catch(() => undefined);
  }, []);
  const selected =
    state.summary?.rows.find((row) => row.rayId === selectedId) ?? state.summary?.rows[0] ?? null;
  const style = {
    "--v478-blue": "#79e8ff",
    "--v478-red": "#ff8a72",
    "--v478-active": selected?.shiftClass === "blueshift" ? "var(--v478-blue)" : "var(--v478-red)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[46px] border border-white/10 bg-[#050508] p-5 text-[#f7f5ff] shadow-[0_58px_190px_rgba(0,0,0,.76)] sm:p-8"
      data-atlas-kerr-normalized-frequency-v478
      data-atlas-v478-sample-count={state.summary?.audit.sampleCount ?? 0}
      data-atlas-v478-absolute-frequency-rows="0"
      data-atlas-v478-physical-bandpass-rows="0"
      data-atlas-v478-science-pixels="0"
      data-atlas-v478-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(121,232,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,138,114,.045)_1px,transparent_1px)] [background-size:50px_50px]" />
      <div className="pointer-events-none absolute -left-36 top-0 h-80 w-80 rounded-full bg-cyan-300/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 top-24 h-80 w-80 rounded-full bg-rose-300/7 blur-3xl" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/35">
            V478 / normalized spectral coordinate chart
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            先建立频率坐标，再谈真实谱带
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            固定五个无量纲发射频率锚点，验证 νobs/ν0 = g·νem/ν0、逆变换与误差传播。没有 ν0、真实 bandpass 和 throughput 时，绝对频率及带积分辐亮度保持不可用。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-center font-mono">
          <Metric label="rays" value="4" />
          <Metric label="anchors" value="5" />
          <Metric label="samples" value="20" />
        </div>
      </header>

      {!state.summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50" data-atlas-v478-load-state={state.status}>
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 normalized frequency chart……"
            : "Normalized frequency chart 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.55fr_1.45fr]">
            <div className="grid content-start gap-2">
              {state.summary.rows.map((row, index) => (
                <button
                  className={
                    "border p-4 text-left transition-colors " +
                    (selected?.rayId === row.rayId
                      ? "border-[var(--v478-active)]/45 bg-[var(--v478-active)]/[.06]"
                      : "border-white/8 bg-black/25 opacity-60 hover:opacity-100")
                  }
                  data-atlas-v478-ray={row.rayId}
                  key={row.rayId}
                  onClick={() => setSelectedId(row.rayId)}
                  type="button"
                >
                  <div className="flex items-center justify-between font-mono text-[8px] text-white/30">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className={row.shiftClass === "blueshift" ? "text-[var(--v478-blue)]" : "text-[var(--v478-red)]"}>
                      {row.shiftClass}
                    </span>
                  </div>
                  <div className="mt-4 font-serif text-xl">{row.rayId}</div>
                  <div className="mt-2 font-mono text-[8px] text-white/40">g = {row.redshiftFactor.toFixed(8)}</div>
                </button>
              ))}
            </div>

            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.18em] text-white/35">
                    <span>{selected.rayId} / ν over unspecified ν0</span>
                    <span className="text-[var(--v478-active)]">strictly increasing</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    {selected.samples.map((sample) => (
                      <div className="grid grid-cols-[3.5rem_1fr_5rem] items-center gap-3 font-mono" key={sample.anchorIndex}>
                        <div className="text-[8px] text-white/35">νem {sample.emitterFrequencyOverReference.toFixed(2)}</div>
                        <div className="relative h-7 border border-white/8 bg-white/[.02]">
                          <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
                          <div
                            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--v478-active)] shadow-[0_0_18px_var(--v478-active)]"
                            style={{ left: 0, width: `${Math.min(100, (sample.observerFrequencyOverReference / 2.2) * 100)}%` }}
                          />
                        </div>
                        <div className="text-right text-[9px] text-[var(--v478-active)]">{sample.observerFrequencyOverReference.toFixed(6)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 grid gap-2 sm:grid-cols-3">
                    <Datum label="envelope min" value={selected.observerEnvelope.minimumFrequencyOverReference.toFixed(8)} />
                    <Datum label="envelope max" value={selected.observerEnvelope.maximumFrequencyOverReference.toFixed(8)} />
                    <Datum label="max u(νobs/ν0)" value={Math.max(...selected.samples.map((sample) => sample.observerFrequencyAbsoluteUncertaintyUpperBound)).toExponential(4)} />
                  </div>
                  <div className="mt-7 border border-[var(--v478-red)]/20 bg-[var(--v478-red)]/[.035] p-4 font-mono text-[8px] leading-5 text-white/45">
                    reference frequency Hz = null · physical bandpass = null · throughput = null · band-integrated radiance = null
                    <br />
                    normalized coordinate ≠ absolute spectrum；unavailable ≠ 0
                  </div>
                </>
              ) : null}
            </article>
          </div>

          <div className="relative mt-6 grid gap-2 border border-white/10 bg-white/[.02] p-4 font-mono text-[8px] sm:grid-cols-3">
            <Audit label="direct/log oracle" value={scientific(state.summary.audit.maximumDirectOracleRelativeDifference)} />
            <Audit label="inverse round-trip" value={scientific(state.summary.audit.maximumInverseRoundTripRelativeResidual)} />
            <Audit label="physical products" value="0 qualified" />
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>normalized chart qualified · bandpass / throughput / radiance blocked · dense 0/49</span>
            <a className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v478-active)]/50 hover:text-[var(--v478-active)]" href="/api/atlas/relativity-evidence/v478/normalized-frequency-chart?download=frequency-chart">
              导出频率坐标
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-24 bg-black/50 px-4 py-3"><div className="text-[7px] uppercase tracking-[.14em] text-white/30">{label}</div><div className="mt-1 text-lg text-[var(--v478-active)]">{value}</div></div>;
}
function Datum({ label, value }: { label: string; value: string }) {
  return <div className="border border-white/8 bg-white/[.025] p-3 font-mono"><div className="text-[7px] uppercase tracking-[.12em] text-white/30">{label}</div><div className="mt-2 text-[9px] text-[var(--v478-active)]">{value}</div></div>;
}
function Audit({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-l border-white/10 px-3 py-2"><span className="text-white/30">{label}</span><span className="text-white/60">{value}</span></div>;
}
function scientific(value: number): string {
  return value === 0 ? "0" : value.toExponential(4);
}
