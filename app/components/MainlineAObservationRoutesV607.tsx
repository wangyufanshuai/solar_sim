"use client";

import { getMainlineAObservationRoutesForObjectV607, getMainlineAObservationStepCatalogIdV607 } from "../data/mainlineAObservationRoutesV607";

export default function MainlineAObservationRoutesV607({ objectId, onSelectObject }: { objectId: string; onSelectObject?: (catalogId: string) => void }) {
  const routes = getMainlineAObservationRoutesForObjectV607(objectId);
  if (!routes.length) return null;
  return <section className="mt-4 border-t border-amber-100/15 pt-3" aria-label="推荐观测路线" data-mainline-a-observation-routes>
    <h4 className="text-[11px] tracking-wide text-amber-100/75">沿着一个问题，继续探索</h4>
    {routes.map((route) => <details key={route.id} className="mt-2 rounded border border-slate-500/25 bg-[#090f18]" data-mainline-a-route={route.id}>
      <summary className="min-h-10 cursor-pointer px-3 py-2 text-[12px] text-slate-200">{route.titleCn}</summary>
      <div className="px-3 pb-3">
        <p className="text-[11px] leading-5 text-amber-100/75">{route.questionCn}</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-400">{route.summaryCn}</p>
        <ol className="mt-3 grid gap-2">
          {route.steps.map((step, index) => {
            const catalogId = getMainlineAObservationStepCatalogIdV607(step);
            const current = step.objectId === objectId || catalogId === objectId;
            return <li key={step.id} className="border-l border-slate-500/35 pl-3" data-mainline-a-route-step={step.id}>
              <button type="button" disabled={!onSelectObject || !catalogId || current} onClick={() => { if (catalogId) onSelectObject?.(catalogId); }} aria-current={current ? "step" : undefined} className="min-h-10 w-full rounded text-left text-[11px] text-cyan-100 hover:bg-white/5 disabled:text-amber-100" data-mainline-a-route-target={catalogId}>
                <span className="mr-2 font-mono text-slate-500">{String(index + 1).padStart(2, "0")}</span>{step.titleCn}{current ? " · 当前" : " →"}
              </button>
              <p className="text-[10px] leading-4 text-slate-300">{step.whyCn}</p>
              <p className="mt-1 text-[9px] leading-4 text-slate-400"><span className="text-slate-300">{step.relationType}</span> · {step.relationNoteCn}</p>
            </li>;
          })}
        </ol>
      </div>
    </details>)}
  </section>;
}
