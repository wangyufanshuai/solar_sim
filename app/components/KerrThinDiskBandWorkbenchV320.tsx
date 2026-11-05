"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandImagingViewV320,
} from "../lib/kerrThinDiskBandImagingV320";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v320-thin-disk-bands";
const MAX_RESPONSE_BYTES = 64 * 1024;

function scientific(value: number | null, digits = 3): string {
  return value == null ? "不适用" : value.toExponential(digits);
}

function linearRgbStyle(rgb: readonly [number, number, number]): string {
  return `rgb(${rgb.map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255)).join(" ")})`;
}

export default function KerrThinDiskBandWorkbenchV320({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrThinDiskBandImagingViewV320 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("v320-band-imaging-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("v320-band-imaging-size-boundary");
        return parseKerrThinDiskBandImagingViewV320(JSON.parse(text));
      })
      .then((next) => {
        setView(next);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setView(null);
        setStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  const diskSamples = useMemo(() => view?.samples.filter((sample) => sample.applicable) ?? [], [view]);
  const selected = useMemo(() => diskSamples.length === 0 ? null : diskSamples.reduce((nearest, sample) => (
    Math.abs(sample.spinA - spinA) < Math.abs(nearest.spinA - spinA) ? sample : nearest
  )), [diskSamples, spinA]);

  if (!view || !selected || !selected.falseColor || !selected.bands) {
    return (
      <div className="mt-2 rounded border border-sky-100/10 bg-black/20 px-3 py-2 text-[10px] text-white/45" data-atlas-kerr-bands-v320={status}>
        {status === "loading" ? "正在积分固定观测波段…" : "固定波段科学成像不可用；不会以电影色彩替代物理辐亮度。"}
      </div>
    );
  }

  return (
    <section
      className="relative mt-2 overflow-hidden rounded border border-sky-100/15 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.08),transparent_34%),radial-gradient(circle_at_92%_108%,rgba(251,191,36,0.08),transparent_38%),rgba(2,6,12,0.72)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
      data-atlas-kerr-bands-v320="ready"
      data-atlas-kerr-band-normalization={view.normalizationPolicy}
      data-atlas-kerr-band-transfer={view.transferFunction}
      data-atlas-kerr-band-dense-boundary={view.boundary}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-100/30 to-transparent" />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-[13px] tracking-[0.06em] text-sky-50/90">固定波段观测板 <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-sky-100/45">V320</span></div>
          <p className="mt-1 max-w-2xl text-[9px] leading-4 text-white/43">
            三个互不重叠的观测频段采用固定 Simpson 网格积分。色块只是预先标定的线性假彩色；SI 辐亮度、误差项和饱和标志始终独立保存。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2 py-1 font-mono text-[8px] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.7)]" />
          fixed · non-adaptive · sparse 4/4
        </div>
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.65fr)]">
        <div className="rounded border border-white/8 bg-black/20 p-2.5">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">selected authority ray</div>
              <div className="mt-0.5 font-mono text-[10px] text-sky-50">ray {selected.rayIndex} · a/M {selected.spinA.toFixed(3)} · g {selected.redshiftFactor?.toFixed(6)}</div>
            </div>
            <div className="h-9 w-14 rounded border border-white/15 shadow-[0_0_20px_rgba(125,211,252,0.12)]" style={{ backgroundColor: linearRgbStyle(selected.falseColor.linearRgbClipped) }} aria-label="固定线性假彩色色块" />
          </div>
          <div className="space-y-2">
            {selected.bands.map((band, index) => {
              const definition = view.definitions[index];
              return (
                <div key={band.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-2">
                  <div>
                    <div className="text-[9px] text-white/70">{definition.label}</div>
                    <div className="font-mono text-[7px] text-white/30">{definition.physicalRangeLabel}</div>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={band.id === "visible" ? "h-full bg-amber-200/80" : band.id === "euv" ? "h-full bg-emerald-300/75" : "h-full bg-sky-300/80"} style={{ width: `${band.normalizedLinearClipped * 100}%` }} />
                    {band.saturated ? <span className="absolute right-0 top-0 h-full w-px bg-rose-300" /> : null}
                  </div>
                  <div className="min-w-24 text-right font-mono text-[8px] text-white/58">
                    {scientific(band.observedBandRadianceWM2Sr)}
                    <span className="ml-1 text-[7px] text-white/25">W m⁻² sr⁻¹</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/7 pt-2 font-mono text-[7px] text-white/35">
            <span>coverage {((selected.coveredBolometricFraction ?? 0) * 100).toFixed(4)}%</span>
            <span>max quadrature Δ {scientific(Math.max(...selected.bands.map((band) => band.quadratureRelativeDifference)))}</span>
            <span>saturation {selected.falseColor.saturatedChannels.length === 0 ? "none" : selected.falseColor.saturatedChannels.join(", ")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
          {diskSamples.map((sample) => (
            <button
              key={sample.rayIndex}
              type="button"
              disabled
              className={sample.rayIndex === selected.rayIndex
                ? "rounded border border-sky-100/25 bg-sky-100/[0.055] p-2 text-left"
                : "rounded border border-white/7 bg-black/15 p-2 text-left opacity-70"}
              aria-label={`authority ray ${sample.rayIndex}`}
            >
              <div className="flex items-center justify-between font-mono text-[8px] text-white/45"><span>ray {sample.rayIndex}</span><span>a {sample.spinA.toFixed(3)}</span></div>
              <div className="mt-2 h-5 rounded-sm border border-white/10" style={{ backgroundColor: sample.falseColor ? linearRgbStyle(sample.falseColor.linearRgbClipped) : "transparent" }} />
              <div className="mt-1 font-mono text-[7px] text-white/30">T {scientific(sample.effectiveTemperatureK, 2)} K</div>
            </button>
          ))}
        </div>
      </div>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] text-white/35">
        <span>physical radiance immutable · componentwise error · no RSS · no dense image claim</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-sky-100/65 underline decoration-sky-100/20 underline-offset-2">查看固定波段 JSON</a>
      </footer>
    </section>
  );
}
