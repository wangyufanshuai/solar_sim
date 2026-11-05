"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrPhotonRadiometryTransferSnapshotV477,
  loadKerrPhotonRadiometryTransferSummaryV477,
  subscribeKerrPhotonRadiometryTransferV477,
} from "../lib/kerrPhotonRadiometryTransferClientV477";

export default function KerrPhotonRadiometryTransferV477() {
  const state = useSyncExternalStore(
    subscribeKerrPhotonRadiometryTransferV477,
    getKerrPhotonRadiometryTransferSnapshotV477,
    getKerrPhotonRadiometryTransferSnapshotV477,
  );
  const [selectedId, setSelectedId] = useState("disk-00");

  useEffect(() => {
    void loadKerrPhotonRadiometryTransferSummaryV477().catch(() => undefined);
  }, []);

  const selected =
    state.summary?.rows.find((row) => row.rayId === selectedId) ?? state.summary?.rows[0] ?? null;
  const shiftTone = selected && selected.redshiftFactor >= 1 ? "blue" : "red";
  const style = {
    "--v477-blue": "#72e7ff",
    "--v477-red": "#ff8066",
    "--v477-active": shiftTone === "blue" ? "var(--v477-blue)" : "var(--v477-red)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[46px] border border-white/10 bg-[#050608] p-5 text-[#f3f7ff] shadow-[0_58px_190px_rgba(0,0,0,.76)] sm:p-8"
      data-atlas-kerr-photon-radiometry-v477
      data-atlas-v477-measured-radiance-rows="0"
      data-atlas-v477-science-pixels="0"
      data-atlas-v477-presentation-inputs="0"
      data-atlas-v477-scientific-mutation="0"
      data-atlas-v477-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(114,231,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,128,102,.045)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-cyan-300/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-orange-400/8 blur-3xl" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/35">
            V477 / photon radiometry transfer observatory
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            追踪光如何缩放，不假装已经测到光
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            对每条 disk ray 显示 νobs/νem = g、谱辐亮度传递 g³ 与总辐亮度传递 g⁴。系数由解析不变量约束；发射谱、探测器响应和实测辐亮度仍明确为空。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-center font-mono">
          <Metric label="rays" value="4" />
          <Metric label="coeff" value="12" />
          <Metric label="measured" value="0" />
        </div>
      </header>

      {!state.summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v477-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 photon radiometry transfer payload……"
            : "Photon radiometry transfer 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.6fr_1.4fr]">
            <div className="grid content-start gap-2">
              {state.summary.rows.map((row, index) => (
                <button
                  className={
                    "border p-4 text-left transition-colors " +
                    (selected?.rayId === row.rayId
                      ? "border-[var(--v477-active)]/45 bg-[var(--v477-active)]/[.06]"
                      : "border-white/8 bg-black/25 opacity-60 hover:opacity-100")
                  }
                  data-atlas-v477-ray={row.rayId}
                  key={row.rayId}
                  onClick={() => setSelectedId(row.rayId)}
                  type="button"
                >
                  <div className="flex items-center justify-between font-mono text-[8px] text-white/30">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className={row.redshiftFactor >= 1 ? "text-[var(--v477-blue)]" : "text-[var(--v477-red)]"}>
                      {row.redshiftFactor >= 1 ? "BLUE" : "RED"}
                    </span>
                  </div>
                  <div className="mt-4 font-serif text-xl tracking-[.04em]">{row.rayId}</div>
                  <div className="mt-2 font-mono text-[8px] text-white/40">
                    g = {format(row.redshiftFactor)}
                  </div>
                </button>
              ))}
            </div>

            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.18em] text-white/35">
                    <span>{selected.rayId} / analytic transfer coefficients</span>
                    <span className="text-[var(--v477-active)]">{shiftTone}shift channel</span>
                  </div>
                  <div className="mt-6 space-y-5">
                    <TransferBar label="frequency νobs / νem" exponent="g¹" value={selected.frequencyRatioObservedToEmitter} />
                    <TransferBar label="spectral radiance transfer" exponent="g³" value={selected.spectralRadianceTransferG3} />
                    <TransferBar label="bolometric radiance transfer" exponent="g⁴" value={selected.bolometricRadianceTransferG4} />
                  </div>

                  <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <Datum label="u(g) upper" value={scientific(selected.uncertainty.redshiftAbsoluteUpperBound)} />
                    <Datum label="u(g³) upper" value={scientific(selected.uncertainty.spectralTransferAbsoluteUpperBound)} />
                    <Datum label="u(g⁴) upper" value={scientific(selected.uncertainty.bolometricTransferAbsoluteUpperBound)} />
                    <Datum label="power oracle" value={scientific(Math.max(selected.oracle.spectralRelativeDifference, selected.oracle.bolometricRelativeDifference))} />
                    <Datum label="inverse residual" value={scientific(Math.max(selected.oracle.spectralInverseRoundTripResidual, selected.oracle.bolometricInverseRoundTripResidual))} />
                    <Datum label="combination" value="shared channel" />
                  </div>

                  <div className="mt-7 border border-[var(--v477-red)]/20 bg-[var(--v477-red)]/[.035] p-4 font-mono text-[8px] leading-5 text-white/45">
                    emitted radiance = null · observed radiance = null · detector value = null · Stokes I/Q/U/V = null
                    <br />
                    transfer coefficient ≠ measured radiance；unavailable ≠ 0
                  </div>
                </>
              ) : null}
            </article>
          </div>

          <div className="relative mt-6 grid gap-2 border border-white/10 bg-white/[.02] p-4 font-mono text-[8px] sm:grid-cols-3">
            <Audit label="Liouville residual" value={scientific(state.summary.audit.v466MaximumLiouvilleInvariantRelativeError)} />
            <Audit label="spectral inverse" value={scientific(state.summary.audit.v468MaximumSpectralInverseRelativeError)} />
            <Audit label="bolometric inverse" value={scientific(state.summary.audit.v468MaximumBolometricInverseRelativeError)} />
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>analytic transfer qualified · production radiometry blocked · dense 0/49</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v477-active)]/50 hover:text-[var(--v477-active)]"
              href="/api/atlas/relativity-evidence/v477/photon-radiometry-transfer?download=transfer-payload"
            >
              导出传递 payload
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 bg-black/50 px-4 py-3">
      <div className="text-[7px] uppercase tracking-[.14em] text-white/30">{label}</div>
      <div className="mt-1 text-lg text-[var(--v477-active)]">{value}</div>
    </div>
  );
}

function TransferBar({ label, exponent, value }: { label: string; exponent: string; value: number }) {
  const width = Math.max(2, Math.min(100, (value / 1.3) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-4 font-mono text-[8px] text-white/35">
        <span>{label}</span>
        <span className="text-[var(--v477-active)]">{exponent} = {format(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden bg-white/[.045]">
        <div className="h-full bg-[var(--v477-active)]/75" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-white/[.025] p-3 font-mono">
      <div className="text-[7px] uppercase tracking-[.12em] text-white/30">{label}</div>
      <div className="mt-2 text-[9px] text-[var(--v477-active)]">{value}</div>
    </div>
  );
}

function Audit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-l border-white/10 px-3 py-2">
      <span className="text-white/30">{label}</span>
      <span className="text-white/60">{value}</span>
    </div>
  );
}

function format(value: number): string {
  return value.toFixed(8);
}

function scientific(value: number): string {
  return value === 0 ? "0" : value.toExponential(4);
}
