"use client";

import { lazy, Suspense } from "react";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import { useResearchOverlayBoundaryV266 } from "../lib/useResearchOverlayBoundaryV266";

const ObservingPlannerPanel = lazy(() => import("./ObservingPlannerPanel"));

export default function ObservingPlannerBoundaryV258({
  selectedObjectId,
  gaiaIndex,
}: {
  selectedObjectId: string;
  gaiaIndex: readonly GaiaIndexedStar[];
}) {
  const overlay = useResearchOverlayBoundaryV266("observing-planner");
  return (
    <div ref={overlay.panelRef} tabIndex={-1} className="fixed right-3 top-14 z-[72] sm:right-48 sm:top-3" data-atlas-observing-planner="v258-lazy-boundary" data-atlas-observing-planner-version="v266-lazy-worker-boundary" data-atlas-research-sheet={overlay.isOpen ? "observing-planner" : "none"}>
      {!overlay.isOpen && overlay.activeOverlay === "none" ? (
        <button
          ref={overlay.triggerRef}
          type="button"
          onClick={overlay.open}
          className="rounded-full border border-cyan-300/25 bg-[#071014]/90 px-3 py-2 text-[11px] font-medium tracking-[0.14em] text-cyan-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-cyan-200/50 hover:bg-[#0a171d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          今晚可见性
        </button>
      ) : overlay.isOpen ? (
        <Suspense fallback={<div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-xs text-slate-300">正在加载离线星历…</div>}>
          <ObservingPlannerPanel
            selectedObjectId={selectedObjectId}
            gaiaIndex={gaiaIndex}
            onClose={overlay.close}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
