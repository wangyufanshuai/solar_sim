"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrFixedBandRadiometryOracleSnapshotV519,
  loadKerrFixedBandRadiometryOracleSummaryV519,
  subscribeKerrFixedBandRadiometryOracleV519,
} from "../lib/kerrFixedBandRadiometryOracleClientV519";
import { resolveKerrProvenanceConstellationProfileV518 } from "../lib/kerrProvenanceConstellationV518";

export default function KerrFixedBandRadiometryOracleV519() {
  const state = useSyncExternalStore(
    subscribeKerrFixedBandRadiometryOracleV519,
    getKerrFixedBandRadiometryOracleSnapshotV519,
    getKerrFixedBandRadiometryOracleSnapshotV519,
  );
  useEffect(() => {
    void loadKerrFixedBandRadiometryOracleSummaryV519().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518("science");
  const style = {
    "--v519-panel": profile.panel,
    "--v519-raised": profile.panelRaised,
    "--v519-ink": profile.ink,
    "--v519-grid": profile.grid,
    "--v519-qualified": profile.nodeStroke,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v519-panel)] p-5 font-mono text-[var(--v519-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-fixed-band-radiometry-oracle-v519
      data-atlas-v519-ray-count="4"
      data-atlas-v519-band-count="3"
      data-atlas-v519-row-count="12"
      data-atlas-v519-decimal-digits="80"
      data-atlas-v519-measured-radiance-row-count="0"
      data-atlas-v519-detector-projected-row-count="0"
      data-atlas-v519-scientific-mutation="false"
      data-atlas-v519-canvas-created="false"
      data-atlas-v519-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v519-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v519-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V519 / 80-digit independent fixed-band radiometry oracle
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          不再让固定 Simpson 积分独自证明自己
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          自适应 tanh-sinh 在对数频率坐标中重新积分四条 disk ray 的 visible、EUV 与 soft X-ray 能量和光子辐亮度，并独立复核 g³/g⁴ 传输系数。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 multiprecision oracle…"
            : `Radiometry oracle 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="rays" value="4" />
            <Metric label="bands" value="3" />
            <Metric label="integral rows" value="12" />
            <Metric label="precision" value="80 digits" />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate
              label="energy radiance Δrel"
              value={scientific(summary.maxima.energyRadianceRelativeDifference)}
            />
            <Gate
              label="photon radiance Δrel"
              value={scientific(summary.maxima.photonRadianceRelativeDifference)}
            />
            <Gate
              label="mean frequency Δrel"
              value={scientific(summary.maxima.meanFrequencyRelativeDifference)}
            />
            <Gate
              label="g³ transfer Δrel"
              value={scientific(summary.maxima.g3TransferRelativeDifference)}
            />
            <Gate
              label="g⁴ transfer Δrel"
              value={scientific(summary.maxima.g4TransferRelativeDifference)}
            />
            <Gate label="integration" value="adaptive tanh-sinh / log ν" />
          </div>
          <div className="relative mt-5 border-l-2 border-amber-300/45 bg-amber-300/[.035] px-4 py-4 text-[9px] leading-5 text-amber-100/65">
            这是冻结薄盘模型的预测辐射交叉验证，不是实测发射谱、探测器吞吐、观测计数或科学图像资格。
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>model-only · measured rows 0 · detector rows 0 · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v519/radiometry-oracle?download=oracle"
            >
              Export full oracle
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v519-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v519-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v519-qualified)]">{value}</span>
    </div>
  );
}

const scientific = (value: string) => Number(value).toExponential(3);
