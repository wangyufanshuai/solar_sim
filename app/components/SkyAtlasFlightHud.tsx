"use client";

import type { SkyAtlasObject, SkyAtlasRoute } from "../lib/skyAtlas";

export default function SkyAtlasFlightHud({
  target,
  route,
  routeStopIndex,
}: {
  target: SkyAtlasObject | null;
  route: SkyAtlasRoute | null;
  routeStopIndex: number;
}) {
  if (!target) return null;
  const nextStop = route?.stops[(routeStopIndex + 1) % Math.max(1, route.stops.length)];
  return (
    <div
      data-solar-atlas-flight-hud
      className="pointer-events-none fixed right-3 top-3 z-[94] w-[min(92vw,22rem)] rounded-[var(--ui-radius)] border border-cyan-200/12 bg-black/35 p-3 text-white/72 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-100/64">Sky Atlas Flight</div>
          <div className="mt-1 truncate text-[15px] font-semibold text-white/88">{target.name}</div>
          <div className="mt-0.5 font-mono text-[8px] uppercase text-white/38">
            {target.type} / {target.distancePc == null ? "distance n/a" : `${target.distancePc.toFixed(target.distancePc < 10 ? 2 : 0)} pc`}
          </div>
        </div>
        <div className="rounded-[4px] border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[8px] uppercase text-white/48">
          {route ? `${routeStopIndex + 1}/${route.stops.length}` : "target"}
        </div>
      </div>
      <div className="relative mt-3 h-20 overflow-hidden rounded-[5px] border border-white/[0.07] bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,0.22),rgba(255,255,255,0.02)_26%,transparent_48%)]">
        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/50 shadow-[0_0_28px_rgba(103,232,249,0.28)]" />
        <div className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 bg-cyan-100/22" />
        <div className="absolute left-1/2 top-1/2 h-16 w-px -translate-y-1/2 bg-cyan-100/22" />
        <div className="absolute bottom-2 left-2 font-mono text-[7px] uppercase text-cyan-100/52">
          RA {target.raHours.toFixed(2)}h / Dec {target.decDeg.toFixed(1)}
        </div>
        {nextStop ? (
          <div className="absolute bottom-2 right-2 max-w-[9rem] truncate font-mono text-[7px] uppercase text-white/34">
            next {nextStop.objectId.replace(/^[^:]+:/, "")}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex gap-1">
        {(route?.stops ?? [null]).map((stop, index) => (
          <span key={stop?.id ?? "single"} className={`h-1 flex-1 rounded-full ${index <= routeStopIndex ? "bg-cyan-200/62" : "bg-white/12"}`} />
        ))}
      </div>
    </div>
  );
}
