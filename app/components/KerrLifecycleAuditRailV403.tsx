import type { AtlasObservationEvidenceLifecycleSnapshotV402, AtlasObservationEvidenceStageIdV401 } from "../lib/atlasObservationEvidenceCacheV401";
import KerrLifecycleReplaySummaryV404 from "./KerrLifecycleReplaySummaryV404";

const LANES = Object.freeze([
  Object.freeze({ id: "constraints", code: "C1", label: "constraints" }),
  Object.freeze({ id: "admission", code: "A2", label: "admission" }),
  Object.freeze({ id: "intake", code: "I3", label: "intake" }),
  Object.freeze({ id: "provenance", code: "P4", label: "provenance" }),
] as const satisfies readonly Readonly<{ id: AtlasObservationEvidenceStageIdV401; code: string; label: string }>[]);

export default function KerrLifecycleAuditRailV403({ snapshot }: Readonly<{ snapshot: AtlasObservationEvidenceLifecycleSnapshotV402 }>) {
  return (
    <section
      className="relative mt-3 overflow-hidden border border-emerald-100/10 bg-[linear-gradient(90deg,rgba(16,185,129,.035),rgba(0,0,0,.22)_32%,rgba(245,158,11,.025))] px-2.5 py-2 font-mono"
      data-atlas-lifecycle-audit-rail-v403
      data-atlas-v403-cache-at-baseline={String(snapshot.cacheAtBaseline)}
      data-atlas-v403-lifetime-requests={snapshot.lifetimeRequestCount}
      data-atlas-v403-released-pending={snapshot.releasedPendingRequestCount}
      data-atlas-v403-browser-soak-qualified="false"
      data-atlas-v403-science-buffer-mutation="false"
      data-atlas-v403-canvas-created="false"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,transparent_0_31px,rgba(167,243,208,.035)_32px)] [background-size:32px_100%]" />
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-1.5">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${snapshot.cacheAtBaseline ? "bg-emerald-200/70 shadow-[0_0_12px_rgba(110,231,183,.34)]" : "animate-pulse bg-cyan-200/65"}`} />
          <span className="text-[6px] uppercase tracking-[.18em] text-emerald-100/48">Lifecycle audit rail</span>
          <span className="text-[5px] uppercase tracking-[.12em] text-white/22">runtime ledger / browser soak pending</span>
        </div>
        <div className="flex items-center gap-3 text-[5px] uppercase tracking-[.1em] text-white/28">
          <span>scope {snapshot.activeScopeCount}</span>
          <span>gen {snapshot.scopeGeneration}</span>
          <span>release {snapshot.releaseCount}</span>
          <span className={snapshot.cacheAtBaseline ? "text-emerald-100/52" : "text-cyan-100/52"}>{snapshot.cacheEntryCount} entries / {snapshot.cachedBytes} B</span>
        </div>
      </div>
      <div className="relative mt-2 grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-4">
        {LANES.map((lane) => {
          const audit = snapshot.stages[lane.id];
          return (
            <article key={lane.id} className="grid grid-cols-[28px_1fr] gap-2 bg-black/28 px-2 py-1.5" data-atlas-v403-audit-stage={lane.id} data-atlas-v403-audit-terminal={audit.lastTerminalStatus}>
              <div className="grid h-7 place-items-center border border-emerald-100/12 text-[7px] text-emerald-100/48">{lane.code}</div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-[6px] uppercase tracking-[.1em] text-white/40">{lane.label}</span><span className="text-[5px] text-white/22">{audit.lifetimeRequestCount} req</span></div>
                <div className="mt-1 flex gap-2 text-[5px]"><span className="text-emerald-100/52">{audit.successCount} ok</span><span className="text-amber-100/48">{audit.failureCount} fail</span><span className="text-cyan-100/42">{audit.releasedPendingCount} release</span></div>
              </div>
            </article>
          );
        })}
      </div>
      <KerrLifecycleReplaySummaryV404 surface="audit-rail" />
    </section>
  );
}
