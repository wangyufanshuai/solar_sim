"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrFixedBandStokesOracleSnapshotV521,
  loadKerrFixedBandStokesOracleSummaryV521,
  subscribeKerrFixedBandStokesOracleV521,
} from "../lib/kerrFixedBandStokesOracleClientV521";
import { resolveKerrProvenanceConstellationProfileV518 } from "../lib/kerrProvenanceConstellationV518";

export default function KerrFixedBandStokesOracleV521() {
  const state = useSyncExternalStore(
    subscribeKerrFixedBandStokesOracleV521,
    getKerrFixedBandStokesOracleSnapshotV521,
    getKerrFixedBandStokesOracleSnapshotV521,
  );
  useEffect(() => {
    void loadKerrFixedBandStokesOracleSummaryV521().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518("science");
  const style = {
    "--v521-panel": profile.panel,
    "--v521-raised": profile.panelRaised,
    "--v521-ink": profile.ink,
    "--v521-grid": profile.grid,
    "--v521-qualified": profile.nodeStroke,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v521-panel)] p-5 font-mono text-[var(--v521-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-fixed-band-stokes-oracle-v521
      data-atlas-v521-row-count="24"
      data-atlas-v521-direct-integral-count="144"
      data-atlas-v521-component-envelope-count="24"
      data-atlas-v521-measured-stokes-row-count="0"
      data-atlas-v521-circular-stokes-row-count="0"
      data-atlas-v521-detector-projected-row-count="0"
      data-atlas-v521-scientific-mutation="false"
      data-atlas-v521-canvas-created="false"
      data-atlas-v521-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v521-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v521-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V521 / direct frequency-domain Stokes oracle
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          六条独立积分路径，重新审问每一行 I/Q/U
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          每行分别积分能量 I/Q/U 与光子 I/Q/U，共 144 次 80 位自适应 tanh-sinh 积分。
          v520 只作为事后对照，不作为积分输入；误差保持分量式，不使用 RSS，也不制造标量总不确定度。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取独立 Stokes 积分摘要…"
            : `独立 Stokes oracle 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="model rows" value="24" />
            <Metric label="direct integrals" value="144" />
            <Metric label="precision" value="80 digits" />
            <Metric label="scalar totals" value="0" />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate label="energy I Δrel" value={scientific(summary.maxima.directVsV520EnergyIRelative)} />
            <Gate label="energy Q Δrel" value={scientific(summary.maxima.directVsV520EnergyQRelative)} />
            <Gate label="energy U Δrel" value={scientific(summary.maxima.directVsV520EnergyURelative)} />
            <Gate label="photon I Δrel" value={scientific(summary.maxima.directVsV520PhotonIRelative)} />
            <Gate label="photon Q Δrel" value={scientific(summary.maxima.directVsV520PhotonQRelative)} />
            <Gate label="photon U Δrel" value={scientific(summary.maxima.directVsV520PhotonURelative)} />
          </div>
          <div className="relative mt-5 border-l-2 border-amber-300/45 bg-amber-300/[.035] px-4 py-4 text-[9px] leading-5 text-amber-100/65">
            分量之间的统计独立性未经证明，因此只发布逐分量线性 envelope。实测偏振、圆偏振、Mueller 标定、探测器计数与科学栅格继续不可用。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>no RSS · no scalar total · measured 0 · detector 0/6 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v521/stokes-oracle?download=oracle"
            >
              Export direct oracle
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v521-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v521-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v521-qualified)]">{value}</span>
    </div>
  );
}

const scientific = (value: string) => Number(value).toExponential(3);
