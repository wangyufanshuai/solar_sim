"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrThinDiskSpectralViewV319,
  type KerrThinDiskSpectralViewV319,
} from "../lib/kerrThinDiskSpectralV319";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v319-thin-disk-spectrum";
const MAX_RESPONSE_BYTES = 64 * 1024;

const scientific = (value: number | null, digits = 3) => value == null ? "不适用" : value.toExponential(digits);

export default function KerrThinDiskSpectrumWorkbenchV319({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrThinDiskSpectralViewV319 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("v319-spectrum-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("v319-spectrum-size-boundary");
        return parseKerrThinDiskSpectralViewV319(JSON.parse(text));
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

  if (!view || !selected) {
    return (
      <div className="mt-2 rounded border border-amber-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-kerr-spectrum-v319={status}>
        {status === "loading" ? "正在重放 Page–Thorne 薄盘光谱…" : "薄盘光谱不可用；不会使用电影亮度回填科学量。"}
      </div>
    );
  }

  return (
    <section
      className="mt-2 rounded border border-amber-100/12 bg-[radial-gradient(circle_at_82%_10%,rgba(251,191,36,0.055),transparent_38%),rgba(0,0,0,0.15)] p-2.5"
      data-atlas-kerr-spectrum-v319="ready"
      data-atlas-kerr-spectrum-authority={view.authority.fullShortAuthoritySha256}
      data-atlas-kerr-spectrum-dense-boundary={view.boundary}
      data-atlas-kerr-spectrum-display-boundary={view.displayBoundary}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-amber-50/80">Page–Thorne sparse spectrum · 4 disk rays</div>
          <p className="mt-0.5 max-w-2xl text-[9px] text-white/42">
            零扭矩 ISCO、薄且光学厚的局域黑体。通过 Iν/ν³ 传播至观测者；不包含 GRMHD、返回辐射、盘厚或等离子体散射。
          </p>
        </div>
        <span className="rounded border border-amber-100/12 px-1.5 py-0.5 font-mono text-[8px] text-amber-50/65">
          νobs {view.scenario.observedFrequencyHz.toExponential(2)} Hz
        </span>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {diskSamples.map((sample) => (
          <div key={sample.rayIndex} className={sample.rayIndex === selected.rayIndex ? "rounded border border-amber-100/20 bg-amber-100/[0.045] p-2" : "rounded border border-white/8 bg-black/15 p-2"}>
            <div className="flex items-center justify-between font-mono text-[8px] text-white/45">
              <span>ray {sample.rayIndex}</span><span>a {sample.spinA.toFixed(3)}</span>
            </div>
            <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-mono text-[8px] text-white/52">
              <dt>r / M</dt><dd>{sample.emissionRadiusM?.toFixed(5)}</dd>
              <dt>g</dt><dd>{sample.redshiftFactor?.toFixed(6)}</dd>
              <dt>Teff</dt><dd>{scientific(sample.effectiveTemperatureK)} K</dd>
              <dt>Iν obs</dt><dd>{scientific(sample.observedSpectralRadiance)}</dd>
              <dt>Liouville Δ</dt><dd>{scientific(sample.liouvilleInvariantRelativeResidual)}</dd>
              <dt>formula Δ</dt><dd>{scientific(sample.errorBudget.formulaSpectralRelative)}</dd>
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] text-white/40">
        <span>SI radiance · componentwise uncertainty · no RSS · sparse authority only · dense aggregate unavailable</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-amber-100/65 underline decoration-amber-100/20 underline-offset-2">查看 bounded spectrum JSON</a>
      </div>
    </section>
  );
}
