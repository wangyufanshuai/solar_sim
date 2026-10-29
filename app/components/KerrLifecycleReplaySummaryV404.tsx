"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404 } from "../lib/atlasObservationLifecycleReplaySummaryV404";
import {
  getRelativityLifecycleEvidenceSnapshotV404,
  loadRelativityLifecycleEvidenceV404,
  subscribeRelativityLifecycleEvidenceV404,
} from "../lib/relativityLifecycleEvidenceClientV404";

const STAGE_LABELS = Object.freeze({
  constraints: "Constraint",
  admission: "Admission",
  intake: "Intake",
  provenance: "Provenance",
} as const);

export default function KerrLifecycleReplaySummaryV404({ surface }: Readonly<{ surface: "workbench" | "audit-rail" }>) {
  const state = useSyncExternalStore(
    subscribeRelativityLifecycleEvidenceV404,
    getRelativityLifecycleEvidenceSnapshotV404,
    getRelativityLifecycleEvidenceSnapshotV404,
  );
  useEffect(() => { void loadRelativityLifecycleEvidenceV404().catch(() => undefined); }, []);
  const summary = state.summary;
  return (
    <section
      className="relative mt-2 overflow-hidden border border-cyan-100/10 bg-[linear-gradient(100deg,rgba(34,211,238,.035),rgba(0,0,0,.19)_45%,rgba(245,158,11,.025))] px-2.5 py-2 font-mono"
      data-atlas-lifecycle-replay-summary-v404={surface}
      data-atlas-v404-status={state.status}
      data-atlas-v404-request-count={state.requestCount}
      data-atlas-v404-response-bytes={state.responseBytes}
      data-atlas-v404-cycle-details-in-react-state="false"
      data-atlas-v404-browser-soak-qualified="false"
      data-atlas-v404-production-lifecycle-qualified="false"
      data-atlas-v404-science-buffer-mutation="false"
      data-atlas-v404-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,transparent_0_39px,rgba(165,243,252,.035)_40px)] [background-size:40px_100%]" />
      <header className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-cyan-200/70 shadow-[0_0_10px_rgba(103,232,249,.32)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/55" : "bg-amber-200/55"}`} />
          <span className="text-[6px] uppercase tracking-[.17em] text-cyan-100/48">V404 replay evidence</span>
          <span className="text-[5px] uppercase tracking-[.1em] text-white/24">fixture only · browser soak not run</span>
        </div>
        <span className="text-[5px] uppercase tracking-[.1em] text-amber-100/42">production qualification: no</span>
      </header>
      {!summary ? (
        <div className="relative mt-2 border-l-2 border-amber-100/20 bg-amber-100/[.025] px-2 py-1.5 text-[6px] text-amber-50/45">
          {state.status === "loading" || state.status === "idle" ? "Reading bounded lifecycle summary…" : `Lifecycle summary unavailable · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-2 grid gap-px bg-white/6 sm:grid-cols-4">
            <Metric label="cycles / baseline" value={`${summary.replay.cycleCount} / ${summary.replay.baselineCycleCount}`} />
            <Metric label="requests" value={String(summary.replay.totalRequestCount)} />
            <Metric label="ok / unavailable" value={`${summary.replay.successCount} / ${summary.replay.failureCount}`} />
            <Metric label="released pending" value={String(summary.replay.releasedPendingRequestCount)} />
          </div>
          <div className="relative mt-px grid gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-4">
            {ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404.map((stage) => {
              const audit = summary.stages[stage];
              return <div key={stage} className="bg-black/25 px-2 py-1.5" data-atlas-v404-stage={stage}><div className="text-[5px] uppercase tracking-[.1em] text-white/28">{STAGE_LABELS[stage]}</div><div className="mt-0.5 text-[6px] text-cyan-50/52">{audit.successCount} ok · {audit.failureCount} fail · {audit.releasedPendingCount} release</div></div>;
            })}
          </div>
          <div className="relative mt-1.5 flex flex-wrap justify-between gap-2 text-[5px] text-white/25">
            <span>max cache {summary.replay.maximumCacheEntryCount} entries / {summary.replay.maximumCachedBytes} B</span>
            <span>artifact {summary.source.replayArtifactSha256.slice(0, 12)}…</span>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="bg-black/28 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.1em] text-white/24">{label}</div><div className="mt-0.5 text-[7px] text-cyan-100/55">{value}</div></div>;
}
