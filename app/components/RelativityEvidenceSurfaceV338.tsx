"use client";

import { useEffect, useState } from "react";
import { parseRelativityEvidenceResponseV338, type AtlasRelativityEvidenceSnapshotV338, type RelativityEvidenceLoadStatusV285 } from "../lib/relativityWorkbenchEvidenceV338";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { createRelativityProvenanceBundleV339, serializeRelativityProvenanceCsvV339, serializeRelativityProvenanceJsonV339 } from "../lib/relativityProvenanceV339";

function shortSha(value: string | null): string { return value == null ? "unavailable" : `${value.slice(0, 10)}…${value.slice(-8)}`; }

export default function RelativityEvidenceSurfaceV338() {
  const [snapshot, setSnapshot] = useState<AtlasRelativityEvidenceSnapshotV338 | null>(null);
  const [status, setStatus] = useState<RelativityEvidenceLoadStatusV285>("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v338", { cache: "no-store", signal: controller.signal })
      .then(async (response) => parseRelativityEvidenceResponseV338(await response.json()))
      .then((result) => { setSnapshot(result.snapshot); setStatus(result.available && result.snapshot ? "ready" : result.reason === "lite-boundary" ? "unavailable" : "corrupt"); })
      .catch(() => { if (!controller.signal.aborted) { setSnapshot(null); setStatus("error"); } });
    return () => controller.abort();
  }, []);
  const v336 = snapshot?.current.v336;
  const v337 = snapshot?.current.v337;
  const download = (format: "json" | "csv") => {
    if (!snapshot || typeof document === "undefined") return;
    const bundle = createRelativityProvenanceBundleV339(snapshot);
    const content = format === "json" ? serializeRelativityProvenanceJsonV339(bundle) : serializeRelativityProvenanceCsvV339(bundle);
    const mime = format === "json" ? "application/json" : "text/csv;charset=utf-8";
    const filename = `orbit-atlas-relativity-v339.${format}`;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const release = acquireAtlasResource("object-url", "relativity-lab", `relativity-v339:${format}`, { owner: "v339-provenance-export", estimatedBytes: blob.size });
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    queueMicrotask(() => { URL.revokeObjectURL(url); release(); });
  };
  return (
    <aside className="mt-2 rounded border border-cyan-100/10 bg-cyan-100/[0.02] p-2 font-mono text-[8px] text-white/48" data-atlas-relativity-evidence-v338 data-atlas-relativity-evidence-v338-status={status} data-atlas-relativity-v336-status={v336?.status ?? "unavailable"} data-atlas-relativity-v337-status={v337?.status ?? "unavailable"} data-atlas-relativity-v339-provenance={snapshot ? "ready" : "unavailable"}>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="uppercase tracking-[0.14em] text-cyan-100/64">Live authority envelope v338</span><span className={status === "ready" ? "text-emerald-100/70" : "text-amber-100/65"}>{status === "loading" ? "loading" : status === "ready" ? "read-only evidence" : status === "unavailable" ? "Lite boundary" : "evidence unavailable"}</span></div>
      <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
        <div className="rounded border border-white/8 px-2 py-1.5"><div className="text-white/64">v336 profile/state replay</div><div className="mt-0.5">{v336 ? `${v336.sequence.join(" → ")} / Δ${v336.sceneRevisionDelta} / camera ${v336.cameraLeaseBaseline ? "baseline" : "drift"} / Canvas ${v336.singleCanvasStable ? "1" : "pending"}` : "unavailable"}</div><div className="mt-0.5 text-white/30">artifact {shortSha(v336?.artifactSha256 ?? null)}</div></div>
        <div className="rounded border border-white/8 px-2 py-1.5"><div className="text-white/64">v337 Science/Cinematic buffers</div><div className="mt-0.5">{v337 ? `${v337.sampleCount} rays / ${v337.scientificBufferFieldCount} fields / Science ${v337.scienceOutputProfileInvariant ? "invariant" : "pending"} / Cinematic ${v337.cinematicProfileOutputsDistinct ? "distinct" : "pending"}` : "unavailable"}</div><div className="mt-0.5 text-white/30">V5 {shortSha(v337?.v5CinematicOutputDigest ?? null)} · V6 {shortSha(v337?.v6CinematicOutputDigest ?? null)}</div></div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-white/36"><span>dense v314: 0/49 · aggregate unavailable</span><span>browser: not run</span><span>CPU float64 authority</span></div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button type="button" disabled={!snapshot} onClick={() => download("json")} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-[8px] text-cyan-50/68 disabled:opacity-35">Export sanitized JSON</button>
        <button type="button" disabled={!snapshot} onClick={() => download("csv")} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-[8px] text-cyan-50/68 disabled:opacity-35">Export CSV</button>
      </div>
    </aside>
  );
}
