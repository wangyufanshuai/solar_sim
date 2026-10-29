"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getKerrScienceObservatorySnapshotV329,
  retainKerrScienceObservatoryV329,
  subscribeKerrScienceObservatoryV329,
} from "../lib/kerrScienceObservatoryStoreV329";

function rgb(value: readonly [number, number, number]): string {
  return `rgb(${value[0]} ${value[1]} ${value[2]})`;
}

function rgba(value: readonly [number, number, number, number]): string {
  return `rgb(${value[0]} ${value[1]} ${value[2]} / ${(value[3] / 255).toFixed(3)})`;
}

export default function KerrScienceCinematicABV327({ mode }: { readonly mode: "science" | "cinematic" }) {
  const observatory = useSyncExternalStore(
    subscribeKerrScienceObservatoryV329,
    getKerrScienceObservatorySnapshotV329,
    getKerrScienceObservatorySnapshotV329,
  );
  useEffect(() => {
    if (mode !== "science") return;
    return retainKerrScienceObservatoryV329();
  }, [mode]);
  if (mode !== "science") return null;
  const view = observatory.cinematicAB;
  const status = view ? "ready" : observatory.status === "unavailable" ? "unavailable" : "loading";
  return (
    <div
      className="mt-2 rounded border border-fuchsia-100/10 bg-fuchsia-100/[0.018] px-2 py-1.5"
      data-kerr-science-cinematic-ab-v327={status}
      data-kerr-science-cinematic-ab-isolation={view ? "science-immutable-buffers-disjoint" : "pending"}
      data-kerr-science-cinematic-ab-default="legacy-v9"
      data-kerr-science-observatory-store-v329={observatory.status}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[8px] uppercase tracking-[0.12em] text-fuchsia-100/45">Science ↔ Cinematic color response</div>
          <div className="mt-0.5 font-mono text-[8px] text-white/42">same four rays · production v305 mapping · deterministic seeds</div>
        </div>
        <span className="font-mono text-[7px] text-white/35">{status}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 font-mono text-[7px]">
        <span />
        <span className="text-center text-cyan-100/45">Science</span>
        <span className="text-center text-fuchsia-100/45">V5</span>
        <span className="text-center text-violet-100/45">V6</span>
        {view?.swatches.flatMap((swatch) => [
          <span key={`${swatch.rayIndex}-label`} className="self-center text-white/38">r{swatch.rayIndex} · a{swatch.spinA.toFixed(1)}</span>,
          <span key={`${swatch.rayIndex}-science`} className="h-4 rounded-sm border border-white/10" style={{ backgroundColor: rgb(swatch.scienceDisplayRgb8) }} title={`Science g=${swatch.redshiftFactor.toFixed(6)}`} />,
          <span key={`${swatch.rayIndex}-v5`} className="h-4 rounded-sm border border-white/10" style={{ backgroundColor: rgba(swatch.v5CinematicRgba8) }} title={`V5 g=${swatch.redshiftFactor.toFixed(6)}`} />,
          <span key={`${swatch.rayIndex}-v6`} className="h-4 rounded-sm border border-white/10" style={{ backgroundColor: rgba(swatch.v6CinematicRgba8) }} title={`V6 g=${swatch.redshiftFactor.toFixed(6)}`} />,
        ])}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1 font-mono text-[7px] text-white/28">
        <span>{view ? `V5 ${view.tokens.v5.exposure.toFixed(2)} / bloom ${view.tokens.v5.bloom.toFixed(2)} / seed ${view.tokens.v5.detailSeed}` : "V5 pending"}</span>
        <span>{view ? `V6 ${view.tokens.v6.exposure.toFixed(2)} / bloom ${view.tokens.v6.bloom.toFixed(2)} / seed ${view.tokens.v6.detailSeed}` : "V6 pending"}</span>
      </div>
      <div className="mt-1 font-mono text-[7px] text-white/25">presentation copies only · Science RGB and measurements remain unchanged</div>
    </div>
  );
}
