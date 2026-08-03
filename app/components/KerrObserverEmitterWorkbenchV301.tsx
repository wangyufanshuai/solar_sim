"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrObserverEmitterReplayViewV301,
  type KerrObserverEmitterReplayViewV301,
} from "../lib/kerrObserverEmitterReplayV301";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v301-observer-emitter-replay";
const MAX_RESPONSE_BYTES = 32 * 1024;

type LoadState = "loading" | "ready" | "unavailable";

export default function KerrObserverEmitterWorkbenchV301({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrObserverEmitterReplayViewV301 | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [selectedRayId, setSelectedRayId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("observer-emitter-replay-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("observer-emitter-response-size-boundary");
        return parseKerrObserverEmitterReplayViewV301(JSON.parse(text));
      })
      .then((validated) => {
        setView(validated);
        setLoadState("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setView(null);
        setLoadState("unavailable");
      });
    return () => controller.abort();
  }, []);

  const selected = useMemo(() => {
    if (!view) return null;
    const explicit = view.records.find((record) => record.rayId === selectedRayId);
    return explicit ?? view.records.reduce((nearest, record) => (
      Math.abs(record.spinA - spinA) < Math.abs(nearest.spinA - spinA) ? record : nearest
    ));
  }, [selectedRayId, spinA, view]);

  if (!view || !selected) {
    return (
      <div className="mt-2 rounded border border-cyan-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-observer-emitter-v301={loadState}>
        {loadState === "loading" ? "正在重放 ZAMO observer 与 disk emitter…" : "Observer/emitter authority 不可用；redshift 不会由展示层估算。"}
      </div>
    );
  }

  return (
    <section
      className="mt-2 rounded border border-cyan-100/12 bg-[linear-gradient(135deg,rgba(34,211,238,0.035),rgba(217,70,239,0.025),rgba(0,0,0,0.18))] p-2.5"
      data-atlas-observer-emitter-v301="ready"
      data-atlas-observer-source-sha={view.authority.observerSourceSha256}
      data-atlas-emitter-source-sha={view.authority.emitterSourceSha256}
      data-atlas-observer-emitter-ray-count={view.rayCount}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-cyan-50/80">Observer / emitter 独立重放</div>
          <p className="mt-0.5 text-[9px] leading-4 text-white/42">有限距离 ZAMO · 等赤道圆轨道发射体 · g = 1 / (-k·u)</p>
        </div>
        <span className="rounded border border-emerald-200/15 bg-emerald-200/[0.05] px-2 py-1 font-mono text-[8px] text-emerald-100/65">4 canonical disk rays</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Canonical disk ray replay selection">
        {view.records.map((record) => (
          <button
            key={record.rayId}
            type="button"
            role="tab"
            aria-selected={selected.rayId === record.rayId}
            onClick={() => setSelectedRayId(record.rayId)}
            className={selected.rayId === record.rayId
              ? "atlas-accessible-focus rounded border border-cyan-100/25 bg-cyan-100/[0.1] px-2 py-1 font-mono text-[9px] text-cyan-50"
              : "atlas-accessible-focus rounded border border-white/8 px-2 py-1 font-mono text-[9px] text-white/45"}
          >
            {record.rayId} · a {record.spinA.toFixed(1)}
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-1.5 md:grid-cols-2" role="tabpanel">
        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-white/45">ZAMO observer</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 font-mono text-[9px] text-white/55">
            <dt>event</dt><dd>r 30 M · θ 70°</dd>
            <dt>lapse α</dt><dd>{selected.observer.lapse.toPrecision(8)}</dd>
            <dt>frame drag ω</dt><dd>{selected.observer.frameDraggingAngularVelocity.toExponential(5)}</dd>
            <dt>browser tetrad residual</dt><dd>{selected.observer.replayOrthonormalResidual.toExponential(3)}</dd>
            <dt>Carter / KS residual</dt><dd>{Math.max(selected.observer.carterArtifactResidual, selected.observer.kerrSchildArtifactResidual).toExponential(3)}</dd>
          </dl>
        </div>
        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-white/45">Circular disk emitter</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 font-mono text-[9px] text-white/55">
            <dt>emission radius</dt><dd>{selected.emitter.radiusM.toFixed(7)} M</dd>
            <dt>Ω / uᵗ / uᵠ</dt><dd>{selected.emitter.angularVelocity.toExponential(3)} / {selected.emitter.uT.toFixed(6)} / {selected.emitter.uPhi.toExponential(3)}</dd>
            <dt>E / Lz</dt><dd>{selected.emitter.photonEnergy.toFixed(6)} / {selected.emitter.photonAngularMomentumZ.toFixed(6)}</dd>
            <dt>-k·u emitter</dt><dd>{selected.emitter.photonFrequencyMinusKDotU.toPrecision(9)}</dd>
            <dt>g factor</dt><dd>{selected.emitter.storedRedshiftFactor.toPrecision(9)}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-2 grid gap-1 sm:grid-cols-4" aria-label="Four-ray redshift comparison">
        {view.records.map((record) => (
          <div key={record.rayId} className="rounded border border-white/8 bg-black/10 px-2 py-1.5">
            <div className="flex justify-between font-mono text-[8px] text-white/45"><span>{record.rayId}</span><span>g {record.emitter.storedRedshiftFactor.toFixed(5)}</span></div>
            <div className="mt-1 h-1 overflow-hidden rounded bg-white/5">
              <div className="h-full rounded bg-gradient-to-r from-cyan-300/55 to-fuchsia-300/70" style={{ width: `${Math.min(100, Math.max(2, record.emitter.storedRedshiftFactor * 55))}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40">
        <span>Δg replay {view.maxima.redshiftReplayDifference.toExponential(2)} · Carter/KS {view.maxima.formulationRedshiftDifference.toExponential(2)}</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-cyan-100/65 underline decoration-cyan-100/20 underline-offset-2">查看 bounded replay JSON</a>
      </div>
      <p className="mt-1.5 text-[8px] leading-3 text-amber-100/48">仅 4 条 canonical disk ray；不是 3,097-ray dense transfer map，也不改变实时 physicsEngine。</p>
    </section>
  );
}
