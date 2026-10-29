"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrPolarizationAuthorityViewV304,
  type KerrPolarizationAuthorityViewV304,
  type KerrToleranceClassV304,
} from "../lib/kerrPolarizationViewV304";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v304-polarization-view";
const MAX_RESPONSE_BYTES = 32 * 1024;

export default function KerrPolarizationWorkbenchV304({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrPolarizationAuthorityViewV304 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [selectedRayId, setSelectedRayId] = useState<string | null>(null);
  const [toleranceClass, setToleranceClass] = useState<KerrToleranceClassV304>("release");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("polarization-view-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("polarization-response-size-boundary");
        return parseKerrPolarizationAuthorityViewV304(JSON.parse(text));
      })
      .then((validated) => {
        setView(validated);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setView(null);
        setStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  const selected = useMemo(() => {
    if (!view) return null;
    return view.rays.find((ray) => ray.rayId === selectedRayId)
      ?? view.rays.reduce((nearest, ray) => Math.abs(ray.spinA - spinA) < Math.abs(nearest.spinA - spinA) ? ray : nearest);
  }, [selectedRayId, spinA, view]);
  const execution = selected ? (toleranceClass === "release" ? selected.release[0] : selected.internal[0]) : null;

  if (!view || !selected || !execution) {
    return <div className="mt-2 rounded border border-fuchsia-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-polarization-v304={status}>{status === "loading" ? "正在重放 projected-normal 与 Walker–Penrose 常数…" : "偏振 authority 不可用；EVPA 保持 unavailable。"}</div>;
  }

  const wp = selected.projectedSeed.walkerPenroseConstant;
  const wpPlaneScale = 3.2;
  return (
    <section
      className="mt-2 overflow-hidden rounded border border-fuchsia-100/12 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.08),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.06),transparent_45%),rgba(0,0,0,0.13)] p-2.5"
      data-atlas-polarization-v304="ready"
      data-atlas-polarization-authority-sha={view.authority.polarizationEvidenceSha256}
      data-atlas-polarization-projection-replay={view.maxima.projectionReplayDifference}
      data-atlas-polarization-dense-boundary={view.denseBoundary}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-fuchsia-50/80">Walker–Penrose / parallel transport</div>
          <p className="mt-0.5 text-[9px] text-white/42">同一发射端投影，两条独立传播路径，EVPA 按 180° 周期比较。</p>
        </div>
        <div className="flex gap-1">
          {(["release", "internal"] as const).map((value) => <button key={value} type="button" onClick={() => setToleranceClass(value)} className={toleranceClass === value ? "atlas-accessible-focus rounded border border-fuchsia-100/25 bg-fuchsia-100/[0.1] px-2 py-1 text-[8px] text-fuchsia-50" : "atlas-accessible-focus rounded border border-white/8 px-2 py-1 text-[8px] text-white/40"}>{value}</button>)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Disk polarization ray selection">
        {view.rays.map((ray) => <button key={ray.rayId} type="button" role="tab" aria-selected={selected.rayId === ray.rayId} onClick={() => setSelectedRayId(ray.rayId)} className={selected.rayId === ray.rayId ? "atlas-accessible-focus rounded border border-cyan-100/25 bg-cyan-100/[0.08] px-2 py-1 font-mono text-[9px] text-cyan-50" : "atlas-accessible-focus rounded border border-white/8 px-2 py-1 font-mono text-[9px] text-white/42"}>{ray.rayId} · a {ray.spinA.toFixed(1)}</button>)}
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-[180px_1fr_1fr]">
        <div className="relative mx-auto grid size-44 place-items-center rounded-full border border-white/10 bg-black/20 shadow-[inset_0_0_42px_rgba(34,211,238,0.04)]" aria-label="EVPA compass">
          <div className="absolute inset-4 rounded-full border border-dashed border-white/8" />
          <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px bg-white/5" />
          <div className="absolute left-4 top-1/2 h-px w-[calc(100%-2rem)] bg-white/5" />
          <div className="absolute left-1/2 top-1/2 h-0.5 w-32 -translate-x-1/2 -translate-y-1/2 rounded bg-fuchsia-300/75 shadow-[0_0_8px_rgba(240,171,252,0.35)]" style={{ transform: `translate(-50%, -50%) rotate(${execution.walkerPenroseEvpaDeg}deg)` }} />
          <div className="absolute left-1/2 top-1/2 h-px w-32 -translate-x-1/2 -translate-y-1/2 rounded bg-cyan-200/85" style={{ transform: `translate(-50%, -50%) rotate(${execution.parallelTransportEvpaDeg}deg)` }} />
          <div className="z-10 rounded-full border border-white/10 bg-black/70 px-2 py-1 text-center font-mono text-[8px] text-white/60">
            ΔEVPA<br /><span className="text-cyan-50">{execution.evpaDifferenceDeg.toExponential(2)}°</span>
          </div>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] text-fuchsia-100/50">WP</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] text-cyan-100/55">KS PT</span>
        </div>

        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/45">Complex WP constant</div>
          <svg viewBox="0 0 160 120" className="mt-1 block w-full" role="img" aria-label="Complex Walker Penrose constant plane">
            <line x1="10" x2="150" y1="60" y2="60" stroke="rgba(255,255,255,0.12)" />
            <line x1="80" x2="80" y1="8" y2="112" stroke="rgba(255,255,255,0.12)" />
            <line x1="80" y1="60" x2={80 + wp.real * wpPlaneScale} y2={60 - wp.imaginary * wpPlaneScale} stroke="rgba(240,171,252,0.72)" strokeWidth="1.5" />
            <circle cx={80 + wp.real * wpPlaneScale} cy={60 - wp.imaginary * wpPlaneScale} r="3" fill="rgba(103,232,249,0.9)" />
            <text x="148" y="56" textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="7">Re κ</text>
            <text x="84" y="14" fill="rgba(255,255,255,0.35)" fontSize="7">Im κ</text>
          </svg>
          <div className="font-mono text-[9px] text-white/50">κ = {wp.real.toFixed(6)} {wp.imaginary < 0 ? "−" : "+"} {Math.abs(wp.imaginary).toFixed(6)}i</div>
        </div>

        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/45">Emitter projection / transport</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-mono text-[8px] text-white/50">
            <dt>r emission</dt><dd>{selected.emissionRadiusM.toFixed(7)} M</dd>
            <dt>fᵘ BL</dt><dd>[{selected.projectedSeed.polarizationBl.map((value) => value.toExponential(2)).join(", ")}]</dd>
            <dt>k·f / f·u / f²−1</dt><dd>{Math.max(selected.projectedSeed.waveOrthogonalityResidual, selected.projectedSeed.emitterOrthogonalityResidual, selected.projectedSeed.polarizationNormResidual).toExponential(2)}</dd>
            <dt>WP invariant drift</dt><dd>{execution.walkerPenroseInvariantDrift.toExponential(2)}</dd>
            <dt>endpoint / screen</dt><dd>{execution.endpointResidual.toExponential(2)} / {execution.screenDirectionResidual.toExponential(2)}</dd>
            <dt>solver / steps</dt><dd>{execution.solverTolerance.toExponential(1)} / {execution.stepCount}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40">
        <span>A/B deterministic · 16/16 finite · capture/escape EVPA unavailable {view.counts.captureEscapeNotApplicableCount}/96</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-fuchsia-100/65 underline decoration-fuchsia-100/20 underline-offset-2">查看 bounded polarization JSON</a>
      </div>
      <p className="mt-1.5 text-[8px] leading-3 text-amber-100/48">精确 face-on 发射基退化，明确 not-applicable；bounded view 不包含完整输运轨迹，也不是 dense polarization map。</p>
    </section>
  );
}
