"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrAxialPolarizationVectorSnapshotV421,
  loadKerrAxialPolarizationVectorSummaryV421,
  subscribeKerrAxialPolarizationVectorV421,
} from "../lib/kerrAxialPolarizationVectorClientV421";

const EXPORTS = [["VECTOR JSON", "json"], ["ENDPOINT CSV", "csv"], ["WCS FITS", "fits"], ["CORRECTED PNG", "png"]] as const;
const scientific = (value: number) => value === 0 ? "0" : value.toExponential(2);
const screenX = (pixelX: number) => pixelX - 0.5;
const screenY = (pixelY: number) => 384.5 - pixelY;

export default function KerrAxialPolarizationVectorsV421() {
  const state = useSyncExternalStore(
    subscribeKerrAxialPolarizationVectorV421,
    getKerrAxialPolarizationVectorSnapshotV421,
    getKerrAxialPolarizationVectorSnapshotV421,
  );
  useEffect(() => { void loadKerrAxialPolarizationVectorSummaryV421().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-teal-100/16 bg-[radial-gradient(circle_at_18%_22%,rgba(45,212,191,.08),transparent_31%),radial-gradient(circle_at_88%_76%,rgba(251,191,36,.045),transparent_27%),linear-gradient(132deg,rgba(1,10,12,.995),rgba(3,8,11,.99)_57%,rgba(10,7,2,.98))] px-3 py-3 font-mono"
      data-atlas-kerr-axial-vectors-v421
      data-atlas-v421-status={state.status}
      data-atlas-v421-evpa-zero="plus-beta"
      data-atlas-v421-evpa-positive="toward-plus-alpha"
      data-atlas-v421-world-direction="dAlpha=sin-chi-dBeta=cos-chi"
      data-atlas-v421-prior-png-orientation="withdrawn"
      data-atlas-v421-historical-files-overwritten="false"
      data-atlas-v421-intensity="unavailable"
      data-atlas-v421-stokes-amplitude="unavailable"
      data-atlas-v421-interpolation="false"
      data-atlas-v421-summary-only-in-react-state="true"
      data-atlas-v421-science-buffer-mutation="false"
      data-atlas-v421-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(116deg,transparent_0_13px,rgba(153,246,228,.025)_14px,transparent_15px_29px)]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.31em] text-teal-100/44">V421 · axial-vector correction vault</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.17em] text-teal-50/92">WCS-aware polarization vectors</h4>
          <p className="mt-1 max-w-[108ch] text-[6px] leading-relaxed text-white/38">EVPA 零度严格指向 +β，正方向朝 +α。四条权威盘面射线以 180° 轴向张量和 WCS 端点重新发布；v419/v420 的数值坐标与 EVPA 保留资格，旧 PNG 箭头方向因相差 90° 被撤回。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-teal-100/14 bg-teal-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-teal-200/75 shadow-[0_0_14px_rgba(94,234,212,.32)]" : state.status === "loading" ? "animate-pulse bg-amber-200/60" : "bg-rose-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">vector channel</div><div className="mt-0.5 text-[6px] uppercase text-teal-100/62">{state.status}</div></div>
        </div>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-teal-100/24 px-2 py-1.5 text-[6px] text-teal-50/48">{state.status === "loading" || state.status === "idle" ? "正在读取轴向偏振矢量…" : `偏振矢量不可用 · ${state.reason ?? "request-failed"}`}</div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.18fr)_minmax(290px,.82fr)]">
            <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden border border-teal-100/10 bg-[linear-gradient(rgba(94,234,212,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(94,234,212,.04)_1px,transparent_1px)] bg-[size:12.5%_12.5%]">
              <svg viewBox="0 0 384 384" className="absolute inset-0 h-full w-full" role="img" aria-label="Four corrected axial polarization vectors in the finite-distance ZAMO observer plane">
                <line x1="192" y1="0" x2="192" y2="384" stroke="rgba(153,246,228,.12)" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="192" x2="384" y2="192" stroke="rgba(153,246,228,.12)" vectorEffect="non-scaling-stroke" />
                {summary.rows.map((row) => {
                  const negative = row.presentationGlyph.negative;
                  const positive = row.presentationGlyph.positive;
                  const cx = (screenX(negative.pixelX) + screenX(positive.pixelX)) / 2;
                  const cy = (screenY(negative.pixelY) + screenY(positive.pixelY)) / 2;
                  return (
                    <g key={row.rayId} data-atlas-v421-vector={row.rayId}>
                      <line x1={screenX(negative.pixelX)} y1={screenY(negative.pixelY)} x2={screenX(positive.pixelX)} y2={screenY(positive.pixelY)} stroke="rgba(94,234,212,.96)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                      <circle cx={cx} cy={cy} r="3.7" fill="rgba(251,191,36,.96)" stroke="rgba(254,243,199,.85)" strokeWidth=".8" vectorEffect="non-scaling-stroke" />
                      <text x={cx + 7} y={cy + 8} fill="rgba(240,253,250,.68)" fontSize="7">{row.rayId}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute left-2 top-2 border-l border-teal-100/18 pl-2 text-[5px] leading-relaxed text-teal-100/38"><div>β +16M</div><div className="mt-1">χ=0° → +β</div><div>χ=90° → +α</div></div>
              <div className="absolute bottom-2 right-2 text-right text-[5px] leading-relaxed text-white/25"><div>α +22M</div><div>FITS origin 1 · 384² WCS</div></div>
            </div>
            <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="axial convention" value="χ mod 180°" tone="teal" />
              <Metric label="direction norm max" value={scientific(summary.maxima.directionNormResidual)} tone="lime" />
              <Metric label="EVPA recovery max" value={`${scientific(summary.maxima.recoveredAxialEvpaResidualDeg)}°`} tone="lime" />
              <Metric label="Astropy endpoint Δ" value={scientific(summary.maxima.pythonOracleEndpointDifference)} tone="lime" />
              <Metric label="prior PNG display" value="WITHDRAWN · 90°" tone="amber" />
              <Metric label="science raster" value="UNAVAILABLE · 0/49" tone="amber" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            {EXPORTS.map(([label, format]) => <a key={format} href={`/api/atlas/relativity-evidence/v421/axial-vectors?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-teal-100/[.05]"><div className="text-[7px] text-teal-100/60">{label}</div><div className="mt-0.5 text-[5px] text-white/25">{format === "fits" ? "WCS + Binary Table，无图像 HDU" : format === "png" ? "修正后的稀疏轴向诊断图" : "SHA 锁定的四射线端点目录"}</div></a>)}
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28"><span>固定 4M glyph 仅为展示尺度，不是偏振幅度</span><span className="text-amber-100/42">无 intensity · 无 Stokes amplitude · 禁止插值 · browser not run</span></footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "teal" | "lime" | "amber" }>) {
  const color = tone === "teal" ? "text-teal-100/58" : tone === "lime" ? "text-lime-100/56" : "text-amber-100/54";
  return <div className="bg-black/40 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
