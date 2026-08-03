"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  acquireAtlasObservationEvidenceCacheScopeV402,
  getAtlasObservationEvidenceCacheSnapshotV401,
  getAtlasObservationEvidenceLifecycleSnapshotV402,
  subscribeAtlasObservationEvidenceCacheV401,
} from "../lib/atlasObservationEvidenceCacheV401";
import { getAtlasResourceSnapshot, subscribeAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import KerrConstraintForgeV396 from "./KerrConstraintForgeV396";
import KerrLifecycleAuditRailV403 from "./KerrLifecycleAuditRailV403";
import KerrObservationAirlockV397 from "./KerrObservationAirlockV397";
import KerrObservationDockV398 from "./KerrObservationDockV398";
import KerrProvenanceRailV399 from "./KerrProvenanceRailV399";
import KerrEvidenceObservatoryV405 from "./KerrEvidenceObservatoryV405";

const STAGES = Object.freeze([
  Object.freeze({ id: "constraints", index: "01", label: "Constraint design" }),
  Object.freeze({ id: "admission", index: "02", label: "Physical admission" }),
  Object.freeze({ id: "intake", index: "03", label: "Local intake" }),
  Object.freeze({ id: "provenance", index: "04", label: "Provenance" }),
] as const);
type StageIdV400 = (typeof STAGES)[number]["id"];

export default function KerrObservationHubV400() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V405) return <KerrEvidenceObservatoryV405 />;
  if (profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V377) {
    return <LegacyObservationWorkflowV402 />;
  }
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return null;
  return <ObservationHub />;
}

function LegacyObservationWorkflowV402() {
  useEffect(() => acquireAtlasObservationEvidenceCacheScopeV402("v11-measurement-lab"), []);
  return <><KerrConstraintForgeV396 /><KerrObservationAirlockV397 /><KerrObservationDockV398 /><KerrProvenanceRailV399 /></>;
}

function ObservationHub() {
  const [stage, setStage] = useState<StageIdV400>("constraints");
  const telemetryRef = useRef<HTMLElement | null>(null);
  const evidenceCache = useSyncExternalStore(
    subscribeAtlasObservationEvidenceCacheV401,
    getAtlasObservationEvidenceCacheSnapshotV401,
    getAtlasObservationEvidenceCacheSnapshotV401,
  );
  const evidenceLifecycle = useSyncExternalStore(
    subscribeAtlasObservationEvidenceCacheV401,
    getAtlasObservationEvidenceLifecycleSnapshotV402,
    getAtlasObservationEvidenceLifecycleSnapshotV402,
  );
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
  const tokens = profile.runtimeTokens.hud.observationHubV12;
  if (!tokens) throw new Error("v400-observation-hub-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrObservationHubV400", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  useEffect(() => acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub"), []);
  useEffect(() => {
    const publish = () => {
      const node = telemetryRef.current;
      if (!node) return;
      const snapshot = getAtlasResourceSnapshot();
      node.dataset.atlasV400Workers = String(snapshot.workers);
      node.dataset.atlasV400Textures = String(snapshot.textures);
      node.dataset.atlasV400GpuBuffers = String(snapshot.gpuBuffers);
      node.dataset.atlasV400ObjectUrls = String(snapshot.objectUrls);
      node.dataset.atlasV400CameraLeases = String(snapshot.cameraLocks);
      node.dataset.atlasV400ResourceRevision = String(snapshot.revision);
    };
    publish();
    return subscribeAtlasResourceSnapshot(publish);
  }, []);
  const style = {
    "--atlas-v400-panel": tokens.panelOpacity,
    "--atlas-v400-trace": tokens.topologyTraceOpacity,
    "--atlas-v400-bay": tokens.sourceBayOpacity,
    "--atlas-v400-boundary": tokens.boundaryLuminance,
    "--atlas-v400-missing": tokens.missingPulseOpacity,
    "--atlas-v400-grid": tokens.dockingGridOpacity,
    "--atlas-v400-rail": tokens.stageRailOpacity,
  } as CSSProperties;

  return (
    <section
      ref={telemetryRef}
      style={style}
      className="relative mt-2 overflow-hidden rounded-[14px] border border-emerald-100/16 bg-[radial-gradient(ellipse_at_12%_0%,rgba(52,211,153,.11),transparent_30%),radial-gradient(circle_at_95%_96%,rgba(251,146,60,.07),transparent_28%),linear-gradient(132deg,rgba(1,10,8,var(--atlas-v400-panel)),rgba(6,8,8,var(--atlas-v400-panel))_56%,rgba(10,6,2,var(--atlas-v400-panel)))] p-3 text-[8px] text-white/56 shadow-[0_22px_70px_rgba(0,0,0,.26)]"
      data-atlas-observation-hub-v400
      data-atlas-v400-profile="science-cinematic-v12-v400"
      data-atlas-v400-active-stage={stage}
      data-atlas-v400-single-stage-mounted="true"
      data-atlas-v400-science-buffer-mutation="false"
      data-atlas-v400-cinematic-buffer-mutation="false"
      data-atlas-v400-scene-revision-mutation="false"
      data-atlas-v400-canvas-created="false"
      data-atlas-v400-workers="0"
      data-atlas-v400-textures="0"
      data-atlas-v400-gpu-buffers="0"
      data-atlas-v400-object-urls="0"
      data-atlas-v400-camera-leases="0"
      data-atlas-v400-resource-revision="0"
      data-atlas-v401-evidence-cache-entries={evidenceCache.cacheEntryCount}
      data-atlas-v401-evidence-request-count={evidenceCache.requestCount}
      data-atlas-v401-evidence-cached-bytes={evidenceCache.cachedBytes}
      data-atlas-v401-evidence-automatic-retry={String(evidenceCache.automaticRetryAllowed)}
      data-atlas-v402-evidence-active-scopes={evidenceLifecycle.activeScopeCount}
      data-atlas-v402-evidence-lifetime-requests={evidenceLifecycle.lifetimeRequestCount}
      data-atlas-v402-evidence-release-count={evidenceLifecycle.releaseCount}
      data-atlas-v402-evidence-cache-at-baseline={String(evidenceLifecycle.cacheAtBaseline)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v400-grid)] [background-image:linear-gradient(rgba(167,243,208,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(167,243,208,.04)_1px,transparent_1px)] [background-size:25px_25px]" />
      <header className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/7 pb-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.29em] text-emerald-100/46">Science Cinematic V12 · local-shadow observation command</div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[23px] font-light uppercase tracking-[.16em] text-emerald-50/94">Observation hub</h3>
          <p className="mt-1 max-w-[88ch] font-mono text-[6px] leading-relaxed text-white/35">One mounted stage, one evidence request, zero Canvas or physics mutations. Structural qualification and physical absence remain visually distinct.</p>
        </div>
        <div className="flex items-center gap-2 border border-amber-100/13 bg-amber-100/[.03] px-3 py-2 font-mono">
          <span className="h-2 w-2 rounded-full border border-amber-100/35 shadow-[0_0_12px_rgba(251,191,36,var(--atlas-v400-missing))]" />
          <div><div className="text-[5px] uppercase tracking-[.14em] text-white/26">physical authority</div><div className="mt-0.5 text-[7px] text-amber-100/53">UNAVAILABLE · FAIL CLOSED</div></div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[205px_minmax(0,1fr)]">
        <nav className="space-y-1" aria-label="V12 observation stages">
          {STAGES.map((item) => {
            const active = stage === item.id;
            const evidence = evidenceCache.stages[item.id];
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                aria-label={`${item.label}: ${evidence.summary}`}
                onClick={() => setStage(item.id)}
                className={`atlas-accessible-focus group grid w-full grid-cols-[32px_1fr] gap-2 border px-2 py-2 text-left transition-colors ${active ? "border-emerald-100/20 bg-emerald-100/[.065]" : "border-white/7 bg-black/20 hover:bg-white/[.025]"}`}
                data-atlas-v400-stage={item.id}
                data-atlas-v401-stage-evidence-status={evidence.status}
                data-atlas-v401-stage-evidence-request-count={evidence.requestCount}
              >
                <span className={`relative grid h-8 place-items-center font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[13px] ${active ? "text-emerald-100/72" : "text-white/28"}`}>
                  {item.index}
                  <span aria-hidden="true" className={`absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ${evidence.status === "ready" ? "bg-emerald-200/65" : evidence.status === "loading" ? "animate-pulse bg-cyan-200/60" : evidence.status === "unavailable" ? "bg-amber-200/60" : "border border-white/18"}`} />
                </span>
                <span className="min-w-0 font-mono"><span className={`block truncate text-[7px] ${active ? "text-emerald-50/68" : "text-white/42"}`}>{item.label}</span><span className={`mt-1 block truncate text-[5px] uppercase tracking-[.09em] ${evidence.status === "unavailable" ? "text-amber-100/43" : evidence.status === "ready" ? "text-emerald-100/40" : "text-white/24"}`}>{evidence.summary}</span></span>
              </button>
            );
          })}
          <div className="border-l-2 border-emerald-100/20 bg-emerald-100/[.02] px-2 py-2 font-mono text-[6px] leading-relaxed text-emerald-50/38">Stage changes only mount or unmount bounded HUD surfaces. Resource telemetry writes directly to this DOM node.</div>
        </nav>

        <div className="min-w-0 border-l border-white/7 pl-3" role="region" aria-live="polite" data-atlas-v400-stage-region={stage}>
          {stage === "constraints" ? <KerrConstraintForgeV396 /> : null}
          {stage === "admission" ? <KerrObservationAirlockV397 /> : null}
          {stage === "intake" ? <KerrObservationDockV398 /> : null}
          {stage === "provenance" ? <KerrProvenanceRailV399 /> : null}
        </div>
      </div>

      <KerrLifecycleAuditRailV403 snapshot={evidenceLifecycle} />

      <footer className="relative mt-3 grid gap-px bg-white/7 font-mono sm:grid-cols-5">
        <Metric label="profile" value="V12 manual" />
        <Metric label="science display" value="linear / 1·0·0" />
        <Metric label="mounted stage" value="1 / 4" />
        <Metric label="evidence cache" value={`${evidenceCache.requestCount} live / ${evidenceLifecycle.lifetimeRequestCount} life`} />
        <Metric label="default" value="Legacy V9" />
      </footer>
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="bg-black/30 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.12em] text-white/24">{label}</div><div className="mt-0.5 text-[7px] text-emerald-100/53">{value}</div></div>;
}
