"use client";

import { lazy, Suspense } from "react";
import { useResearchOverlayBoundaryV266 } from "../lib/useResearchOverlayBoundaryV266";

const GaiaScienceAnalysisPanel = lazy(() => import("./GaiaScienceAnalysisPanel"));

export default function GaiaScienceAnalysisBoundaryV259() {
  const overlay = useResearchOverlayBoundaryV266("gaia-analysis");
  return (
    <div ref={overlay.panelRef} tabIndex={-1} className="fixed right-3 top-24 z-[71] sm:right-48 sm:top-14" data-atlas-gaia-analysis="v266-exclusive-research-boundary" data-atlas-research-sheet={overlay.isOpen ? "gaia-analysis" : "none"}>
      {!overlay.isOpen && overlay.activeOverlay === "none" ? (
        <button ref={overlay.triggerRef} type="button" onClick={overlay.open} className="rounded-full border border-white/15 bg-[#080b10]/90 px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-slate-200 shadow-xl backdrop-blur-xl transition hover:border-cyan-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Gaia 误差分析</button>
      ) : overlay.isOpen ? (
        <Suspense fallback={<div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-xs text-slate-300">正在加载 Analysis Worker…</div>}>
          <GaiaScienceAnalysisPanel onClose={overlay.close} />
        </Suspense>
      ) : null}
    </div>
  );
}
