"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getKerrSparsePolarimetricSnapshotV418,
  loadKerrSparsePolarimetricSummaryV418,
  subscribeKerrSparsePolarimetricV418,
} from "../lib/kerrSparsePolarimetricProductClientV418";

const EXPORTS = Object.freeze([
  ["JSON", "json", "科研诊断表"],
  ["CSV", "csv", "科研诊断表"],
  ["FITS", "fits", "Binary Table，不是图像 HDU"],
  ["PNG", "png", "诊断条带，不是科学图像"],
] as const);

export default function KerrSparsePolarimetricStripV418() {
  const state = useSyncExternalStore(
    subscribeKerrSparsePolarimetricV418,
    getKerrSparsePolarimetricSnapshotV418,
    getKerrSparsePolarimetricSnapshotV418,
  );
  useEffect(() => {
    void loadKerrSparsePolarimetricSummaryV418().catch(() => undefined);
  }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-emerald-100/15 bg-[linear-gradient(112deg,rgba(2,12,12,.99),rgba(4,7,10,.985)_58%,rgba(13,8,3,.97))] px-3 py-3 font-mono"
      data-atlas-kerr-sparse-polarimetry-v418
      data-atlas-v418-status={state.status}
      data-atlas-v418-image-plane-coordinates="unavailable"
      data-atlas-v418-science-image-map="unavailable"
      data-atlas-v418-fits-product="binary-table-not-image-hdu"
      data-atlas-v418-png-product="diagnostic-strip-only-not-science-image"
      data-atlas-v418-summary-only-in-react-state="true"
      data-atlas-v418-covariance-matrices-in-react-state="false"
      data-atlas-v418-science-buffer-mutation="false"
      data-atlas-v418-cinematic-authority-mutation="false"
      data-atlas-v418-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent_0_11.9%,rgba(167,243,208,.025)_12%_12.1%,transparent_12.2%_24.9%,rgba(251,191,36,.022)_25%_25.1%,transparent_25.2%_100%)] [background-size:52px_100%]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.28em] text-emerald-100/42">V418 · authority diagnostic product</div>
          <h4 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.15em] text-emerald-50/92">
            Sparse polarimetric rail
          </h4>
          <p className="mt-1 max-w-[104ch] text-[6px] leading-relaxed text-white/39">
            四条 Kerr disk-ray 权威 EVPA 与仪器 fixture 的精度、覆盖率并列展示。现有 authority 没有像平面 α/β 坐标，因此这里是诊断条带，不是黑洞偏振图；fixture EVPA 也绝不替换 Kerr authority EVPA。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start border border-emerald-100/14 bg-emerald-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-emerald-200/75 shadow-[0_0_14px_rgba(110,231,183,.32)]" : state.status === "loading" ? "animate-pulse bg-amber-200/60" : "bg-rose-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">product channel</div><div className="mt-0.5 text-[6px] uppercase text-emerald-100/62">{state.status}</div></div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-2 border-l-2 border-emerald-100/24 px-2 py-1.5 text-[6px] text-emerald-50/48">
          {state.status === "loading" || state.status === "idle" ? "正在读取稀疏偏振诊断摘要…" : `诊断产品不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 md:grid-cols-2 xl:grid-cols-4">
            {summary.rows.map((row) => (
              <article key={row.rayId} className="group relative min-h-44 overflow-hidden bg-black/45 px-3 py-3" data-atlas-v418-ray={row.rayId}>
                <div className="flex items-start justify-between gap-2">
                  <div><div className="text-[5px] uppercase tracking-[.16em] text-white/24">{row.rayId} · ray {row.rayIndex}</div><div className="mt-1 text-[7px] text-emerald-100/62">a = {row.spinA.toFixed(3)}</div></div>
                  <span className="border border-amber-100/14 bg-amber-100/[.025] px-1.5 py-0.5 text-[5px] uppercase text-amber-100/48">α/β unavailable</span>
                </div>
                <div className="relative mx-auto mt-3 h-20 w-20 rounded-full border border-emerald-100/13 bg-[repeating-conic-gradient(from_-90deg,rgba(255,255,255,.055)_0_1deg,transparent_1deg_15deg)]">
                  <span className="absolute left-1/2 top-1/2 h-px w-[43%] origin-left bg-gradient-to-r from-emerald-100/90 to-cyan-100/35 shadow-[0_0_10px_rgba(110,231,183,.28)]" style={{ transform: `rotate(${row.authorityEvpaDeg}deg)` }} />
                  <span className="absolute inset-2 rounded-full border border-dashed border-amber-100/12" />
                  <ConfidenceGlyph
                    major={row.calibrationConfidenceEllipse.semiMajorSigma}
                    minor={row.calibrationConfidenceEllipse.semiMinorSigma}
                    rotation={row.calibrationConfidenceEllipse.rotationDeg}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[5px]">
                  <Datum label="WP EVPA" value={`${row.authorityEvpaDeg.toFixed(6)}°`} />
                  <Datum label="PT EVPA" value={`${row.parallelTransportEvpaDeg.toFixed(6)}°`} />
                  <Datum label="fixture σEVPA" value={`${row.calibrationSigmaEvpaDeg.toFixed(6)}°`} />
                  <Datum label="redshift g" value={row.redshiftFactor.toFixed(6)} />
                </div>
              </article>
            ))}
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]">
            <div className="bg-black/38 px-3 py-2.5">
              <div className="text-[5px] uppercase tracking-[.14em] text-emerald-100/45">Science / Cinematic boundary</div>
              <p className="mt-1 text-[6px] leading-relaxed text-white/34">Science：线性、确定性、无 bloom、无噪声、无 grade。Cinematic 可给同一条带增加显式 seed 的表现层，但不得修改 classification、radius、redshift 或 EVPA。</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[5px] uppercase">
                <span className="border border-emerald-100/12 px-1.5 py-0.5 text-emerald-100/48">4 authority rows</span>
                <span className="border border-amber-100/12 px-1.5 py-0.5 text-amber-100/48">dense 0 / 49</span>
                <span className="border border-rose-100/12 px-1.5 py-0.5 text-rose-100/48">measured unavailable</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/6">
              {EXPORTS.map(([label, format, semantic]) => (
                <a key={format} href={`/api/atlas/relativity-evidence/v418/sparse-polarimetry?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-emerald-100/[.055]">
                  <div className="text-[7px] text-emerald-100/62">{label}</div>
                  <div className="mt-0.5 text-[5px] leading-tight text-white/25">{semantic}</div>
                </a>
              ))}
            </div>
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28">
            <span>WP/PT authority · standardized confidence ellipses · no coordinate invention</span>
            <span className="text-amber-100/42">FITS image unavailable · browser qualification not run</span>
          </footer>
        </>
      )}
    </section>
  );
}

function Datum({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div><div className="uppercase tracking-[.08em] text-white/21">{label}</div><div className="mt-0.5 truncate text-emerald-50/55">{value}</div></div>;
}

function ConfidenceGlyph({ major, minor, rotation }: Readonly<{ major: number; minor: number; rotation: 45 | -45 }>) {
  const width = 13;
  const height = width * minor / major;
  return (
    <span
      aria-label="联合 68% 标准化 pL–EVPA 置信椭圆"
      className="absolute bottom-1.5 right-1.5 rounded-[50%] border border-amber-200/45 bg-amber-100/[.035] shadow-[0_0_8px_rgba(251,191,36,.12)]"
      style={{ width, height, transform: `rotate(${rotation}deg)` }}
    />
  );
}
