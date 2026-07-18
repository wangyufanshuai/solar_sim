"use client";

import { Database, ExternalLink, LogOut, MapPinned, Ruler, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { atlasSafeRectFromOccluder } from "../lib/atlasCameraFrameSolverV5";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import type { CelestialObjectPassport, CelestialObjectPassportMetric } from "../lib/simulationDiagnosticsTypes";

type PassportView = "portrait" | "spectrum" | "data";
type Props = {
  passport: CelestialObjectPassport | null;
  onClose: () => void;
  onExitFocus?: () => void;
  onOpenEvidenceLedger?: () => void;
};

export default function CelestialObjectPassportPanel({ passport, onClose, onExitFocus, onOpenEvidenceLedger }: Props) {
  const [view, setView] = useState<PassportView>("portrait");
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => setView("portrait"), [passport?.objectId]);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !passport) return;
    const publishSafeRect = () => {
      const rect = panel.getBoundingClientRect();
      const dockHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--ui-dock-height"),
      ) || 78;
      atlasRuntimeStore.setSafeViewportRect(atlasSafeRectFromOccluder({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        occluder: rect,
        dockHeight,
      }));
    };
    publishSafeRect();
    const observer = new ResizeObserver(publishSafeRect);
    observer.observe(panel);
    window.addEventListener("resize", publishSafeRect, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publishSafeRect);
      atlasRuntimeStore.setSafeViewportRect(null);
    };
  }, [passport]);

  if (!passport) return null;

  return (
    <aside
      ref={panelRef}
      className="pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] z-[103] max-h-[calc(100dvh-var(--ui-dock-height)-28px-env(safe-area-inset-bottom))] overflow-hidden rounded-lg border border-white/12 bg-[rgba(9,12,15,0.92)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-16 sm:w-[24rem] sm:max-w-[calc(100vw-2rem)]"
      data-celestial-object-passport-version={passport.version}
      data-celestial-object-passport-open="true"
      data-celestial-object-passport-id={passport.objectId}
      data-celestial-object-passport-kind={passport.kind}
      data-celestial-object-passport-source={passport.source}
      data-celestial-object-passport-view={view}
      data-atlas-camera-safe-occluder="passport"
      aria-label="天体档案"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase text-cyan-100/58"><Database className="h-3.5 w-3.5" />天体档案</div>
          <h2 className="mt-1 truncate text-[15px] font-semibold text-white/90">{passport.title}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5"><Pill text={passport.kind} /><Pill text={passport.source} /><Pill text={passport.catalogName} /></div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onExitFocus ? <button type="button" onClick={onExitFocus} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[10px] text-cyan-50/58 hover:bg-cyan-100/8 hover:text-cyan-50/86" aria-label="退出聚焦"><LogOut className="h-3.5 w-3.5" /><span>退出聚焦</span></button> : null}
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-white/48 hover:bg-white/8 hover:text-white/86" aria-label="关闭天体档案"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <nav className="grid grid-cols-3 border-b border-white/10 p-1" aria-label="档案视图">
        {(["portrait", "spectrum", "data"] as const).map((id) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`h-8 rounded text-[11px] ${view === id ? "bg-cyan-100/10 text-cyan-50" : "text-white/42 hover:bg-white/5 hover:text-white/70"}`} aria-pressed={view === id}>
            {id === "portrait" ? "肖像" : id === "spectrum" ? "光谱" : "数据"}
          </button>
        ))}
      </nav>

      <div className="max-h-[calc(100dvh-var(--ui-dock-height)-150px-env(safe-area-inset-bottom))] overflow-y-auto px-4 py-3 sm:max-h-[calc(100dvh-14rem)]">
        {view === "portrait" ? (
          <>
            <div className="mb-3 flex items-center gap-3 rounded-md border border-white/9 bg-white/[0.035] p-3">
              <span className="h-10 w-10 shrink-0 rounded-full border border-white/12 shadow-[0_0_24px_rgba(125,211,252,0.18)]" style={{ backgroundColor: passport.color }} aria-hidden />
              <div className="min-w-0"><div className="truncate text-[12px] text-white/80">{passport.catalogName}</div><div className="mt-0.5 text-[11px] text-white/42">{passport.subtitle}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2"><SummaryBand icon={<MapPinned className="h-3.5 w-3.5" />} label="坐标系" value={passport.coordinateFrame} /><SummaryBand icon={<ShieldCheck className="h-3.5 w-3.5" />} label="证据" value={passport.relatedEvidenceClaimId} /></div>
            {(passport.kind === "nearby-star" || passport.kind === "bright-star") ? <p className="mt-3 rounded-md border border-cyan-100/10 bg-cyan-100/[0.035] px-3 py-2 text-[10px] leading-4 text-cyan-50/54">恒星外观由目录参数派生，仅用于科学可视化，不代表已解析的真实表面。</p> : null}
          </>
        ) : null}

        {view === "spectrum" ? <section className="grid gap-2" aria-label="光谱与观测量">{passport.metrics.slice(0, Math.max(3, Math.ceil(passport.metrics.length / 2))).map((metric) => <MetricRow key={metric.id} metric={metric} />)}</section> : null}
        {view === "data" ? <div className="grid gap-2">{passport.metrics.map((metric) => <MetricRow key={metric.id} metric={metric} />)}{passport.sections.map((section) => <section key={section.id} className="rounded-md border border-white/9 bg-white/[0.03] p-3" data-celestial-object-passport-section={section.id}><h3 className="text-[10px] uppercase text-white/38">{section.title}</h3><p className="mt-1 break-words text-[11px] leading-4 text-white/66">{section.body}</p></section>)}</div> : null}
        {onOpenEvidenceLedger ? <button type="button" onClick={onOpenEvidenceLedger} className="mt-3 flex h-9 w-full items-center justify-between rounded-md border border-cyan-100/18 bg-cyan-100/[0.055] px-3 text-[11px] text-cyan-50/78 hover:bg-cyan-100/[0.09]"><span className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" />打开目录证据</span><span className="ui-instrument truncate text-[9px] text-cyan-50/42">{passport.relatedEvidenceClaimId}</span></button> : null}
      </div>
    </aside>
  );
}

function MetricRow({ metric }: { metric: CelestialObjectPassportMetric }) {
  return <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 rounded-md border border-white/8 bg-black/16 px-3 py-2 text-[11px] leading-4"><dt className="flex items-center gap-1.5 text-white/38"><Ruler className="h-3 w-3" />{metric.label}</dt><dd className="min-w-0 break-words text-white/72">{metric.value}</dd></div>;
}

function SummaryBand({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="min-w-0 rounded-md border border-white/8 bg-black/16 p-2"><div className="flex items-center gap-1.5 text-[9px] uppercase text-white/32">{icon}{label}</div><div className="mt-1 truncate text-[11px] text-white/68">{value}</div></div>;
}

function Pill({ text }: { text: string }) {
  return <span className="max-w-full truncate rounded border border-white/10 bg-white/[0.045] px-1.5 py-0.5 text-[9px] uppercase text-white/44">{text}</span>;
}
