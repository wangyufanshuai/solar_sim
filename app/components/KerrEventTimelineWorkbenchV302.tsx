"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrEventTimelineViewV302,
  type KerrEventTimelineViewV302,
  type KerrFormulaTimelineV302,
} from "../lib/kerrEventTimelineV302";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v302-event-timelines";
const MAX_RESPONSE_BYTES = 32 * 1024;

function eventColor(kind: "capture" | "escape" | "disk-hit", valid: boolean): string {
  if (!valid) return "bg-white/25 ring-white/15";
  if (kind === "capture") return "bg-slate-300 ring-slate-200/30";
  if (kind === "escape") return "bg-cyan-300 ring-cyan-200/30";
  return "bg-fuchsia-300 ring-fuchsia-200/30";
}

function FormulaTimeline({ title, timeline }: { readonly title: string; readonly timeline: KerrFormulaTimelineV302 }) {
  const endpoint = Math.max(...timeline.events.map((event) => event.parameter));
  return (
    <div className="rounded border border-white/8 bg-black/15 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase tracking-[0.1em] text-white/55">{title}</span>
        <span className="font-mono text-[8px] text-white/35">{timeline.parameterization}</span>
      </div>
      <div className="relative mx-2 mt-4 h-5 border-t border-white/12">
        {timeline.events.map((event) => (
          <div key={`${event.sequence}:${event.kind}:${event.parameter}`} className="absolute top-[-5px] -translate-x-1/2" style={{ left: `${Math.max(0, Math.min(100, event.parameter / endpoint * 100))}%` }}>
            <span className={`block size-2.5 rounded-full ring-2 ${eventColor(event.kind, event.valid)}`} />
          </div>
        ))}
      </div>
      <div className="grid gap-1 font-mono text-[8px] text-white/45">
        {timeline.events.map((event) => (
          <div key={`${event.sequence}:label`} className="flex items-center justify-between gap-2">
            <span className={event.valid ? "text-white/60" : "text-white/30 line-through"}>{event.kind} · {event.valid ? "valid" : "outside disk"}</span>
            <span>λ {event.parameter.toPrecision(6)} · r {event.radiusM.toPrecision(7)} M</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 grid gap-1 text-[8px] text-white/35 sm:grid-cols-2">
        <span>radial turns · {timeline.radialTurningPoints.length ? timeline.radialTurningPoints.map((point) => point.toPrecision(4)).join(", ") : "none"}</span>
        <span>polar turns · {timeline.polarTurningPoints.length ? timeline.polarTurningPoints.map((point) => point.toPrecision(4)).join(", ") : "none"}</span>
      </div>
    </div>
  );
}

export default function KerrEventTimelineWorkbenchV302({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrEventTimelineViewV302 | null>(null);
  const [selectedRayId, setSelectedRayId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("event-timeline-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("event-timeline-response-size-boundary");
        return parseKerrEventTimelineViewV302(JSON.parse(text));
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
    return view.timelines.find((timeline) => timeline.rayId === selectedRayId)
      ?? view.timelines.reduce((nearest, timeline) => Math.abs(timeline.spinA - spinA) < Math.abs(nearest.spinA - spinA) ? timeline : nearest);
  }, [selectedRayId, spinA, view]);

  if (!view || !selected) {
    return <div className="mt-2 rounded border border-cyan-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-event-timeline-v302={status}>{status === "loading" ? "正在重组 Carter / Kerr–Schild 事件时间线…" : "事件时间线不可用；分类保持 unavailable。"}</div>;
  }

  return (
    <section
      className="mt-2 rounded border border-cyan-100/12 bg-black/10 p-2.5"
      data-atlas-event-timeline-v302="ready"
      data-atlas-event-timeline-authority-sha={view.geometryEvidenceSha256}
      data-atlas-event-timeline-ray-count={view.rayCount}
      data-atlas-event-timeline-dense-boundary={view.denseBoundary}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-cyan-50/80">Canonical geodesic event order</div>
          <p className="mt-0.5 text-[9px] text-white/42">最早有效事件决定分类；盘外 crossing 保留但不可成为 selected event。</p>
        </div>
        <select value={selected.rayId} onChange={(event) => setSelectedRayId(event.target.value)} className="atlas-accessible-focus rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[9px] text-cyan-50/75" aria-label="Canonical Kerr ray">
          {view.timelines.map((timeline) => <option key={timeline.rayId} value={timeline.rayId}>{timeline.rayId} · a {timeline.spinA.toFixed(1)} · {timeline.classification}</option>)}
        </select>
      </div>
      <div className="mt-2 grid gap-1.5 lg:grid-cols-2">
        <FormulaTimeline title="Carter–Mino" timeline={selected.carter} />
        <FormulaTimeline title="Cartesian Kerr–Schild" timeline={selected.kerrSchild} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40">
        <span>classification {selected.classification} · selected Δr {selected.selectedRadiusDifferenceM.toExponential(2)} M · 16/16 agree</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-cyan-100/65 underline decoration-cyan-100/20 underline-offset-2">查看 bounded timelines JSON</a>
      </div>
      <p className="mt-1.5 text-[8px] leading-3 text-amber-100/48">Carter Mino parameter 与 KS Hamiltonian affine parameter 不作数值横向比较；只比较事件类别与物理半径。</p>
    </section>
  );
}
