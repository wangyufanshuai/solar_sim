"use client";

import { useEffect, useState } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { createRelativityProvenanceBundleV339, serializeRelativityProvenanceCsvV339, serializeRelativityProvenanceJsonV339 } from "../lib/relativityProvenanceV339";
import { parseRelativityEvidenceResponseV341, type AtlasRelativityEvidenceSnapshotV341, type RelativityEvidenceResponseV341 } from "../lib/relativityWorkbenchEvidenceV341";

function short(value: string | null): string { return value == null ? "unavailable" : `${value.slice(0, 10)}…${value.slice(-8)}`; }
function download(snapshot: AtlasRelativityEvidenceSnapshotV341, format: "json" | "csv"): void {
  if (typeof document === "undefined") return;
  const bundle = createRelativityProvenanceBundleV339(snapshot.base);
  const content = format === "json" ? serializeRelativityProvenanceJsonV339(bundle) : serializeRelativityProvenanceCsvV339(bundle);
  const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const release = acquireAtlasResource("object-url", "relativity-lab", `relativity-v341:${format}`, { owner: "v341-observation-export", estimatedBytes: blob.size });
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `orbit-atlas-relativity-v341.${format}`; anchor.click();
  queueMicrotask(() => { URL.revokeObjectURL(url); release(); });
}

export default function RelativityEvidenceSurfaceV341() {
  const [response, setResponse] = useState<RelativityEvidenceResponseV341>({ version: "v341-relativity-evidence-response", available: false, reason: "evidence-unavailable", snapshot: null });
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v341", { cache: "no-store", signal: controller.signal })
      .then(async (value) => parseRelativityEvidenceResponseV341(await value.json()))
      .then(setResponse)
      .catch(() => { if (!controller.signal.aborted) setResponse({ version: "v341-relativity-evidence-response", available: false, reason: "evidence-corrupt", snapshot: null }); });
    return () => controller.abort();
  }, []);
  const snapshot = response.snapshot;
  const visual = snapshot?.current.v340;
  const observation = snapshot?.current.v341;
  const ready = response.available && snapshot != null;
  return (
    <section className="relative mt-2 overflow-hidden rounded-[10px] border border-cyan-100/15 bg-[linear-gradient(145deg,rgba(5,18,27,0.94),rgba(4,9,17,0.98)_68%,rgba(9,18,28,0.96))] p-3 font-mono text-[8px] text-white/52" data-atlas-relativity-evidence-v341 data-atlas-relativity-evidence-v341-status={ready ? "ready" : response.reason}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(87,214,255,0.09),transparent_35%),linear-gradient(90deg,transparent_49.8%,rgba(148,220,255,0.025)_50%,transparent_50.2%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[0.2em] text-cyan-100/40">Observation ledger v341</div><div className="mt-0.5 text-[13px] tracking-[0.045em] text-cyan-50/90">Sparse measurement product</div></div><span className={ready ? "rounded-full border border-emerald-200/25 bg-emerald-200/[0.07] px-2 py-1 text-[7px] text-emerald-100/78" : "rounded-full border border-amber-200/25 bg-amber-200/[0.07] px-2 py-1 text-[7px] text-amber-100/76"}>{ready ? "read-only authority" : response.reason === "lite-boundary" ? "Lite boundary" : response.reason === "evidence-corrupt" ? "evidence corrupt" : "loading"}</span></div>
      <div className="relative mt-3 grid gap-1.5 sm:grid-cols-3">
        <div className="rounded border border-white/[0.07] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase tracking-[0.13em] text-white/30">authority</div><div className="mt-1 text-[12px] text-cyan-50/82">{observation ? `${observation.applicableDiskRayCount}/4 rays` : "—"}</div><div className="mt-0.5 text-[7px] text-white/34">{observation ? `${observation.bandMeasurementCount} band rows · ${observation.polarizationMeasurementCount} EVPA` : "awaiting evidence"}</div></div>
        <div className="rounded border border-white/[0.07] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase tracking-[0.13em] text-white/30">error envelope</div><div className="mt-1 text-[12px] text-cyan-50/82">{observation?.maximumEnvelope == null ? "—" : observation.maximumEnvelope.toExponential(3)}</div><div className="mt-0.5 text-[7px] text-white/34">linear component sum · no RSS</div></div>
        <div className="rounded border border-white/[0.07] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase tracking-[0.13em] text-white/30">dense boundary</div><div className="mt-1 text-[12px] text-amber-100/78">{observation?.denseStatus ?? "0/49"}</div><div className="mt-0.5 text-[7px] text-white/34">aggregate unavailable · no dense image</div></div>
      </div>
      <div className="relative mt-2 grid gap-1.5 sm:grid-cols-2">
        <div className="rounded border border-white/[0.06] bg-white/[0.018] px-2 py-1.5"><div className="text-white/35">Science contract</div><div className="mt-0.5 text-emerald-100/70">{observation?.scienceProfileInvariant ? "V5 / V6 / V7 measurements invariant" : "pending"}</div><div className="mt-0.5 text-white/27">digest {short(observation?.scienceDigest ?? null)} · EVPA max {observation?.maximumEvpaDifferenceDeg == null ? "—" : `${observation.maximumEvpaDifferenceDeg.toExponential(2)}°`}</div></div>
        <div className="rounded border border-white/[0.06] bg-white/[0.018] px-2 py-1.5"><div className="text-white/35">Cinematic contract</div><div className="mt-0.5 text-cyan-100/70">{observation?.cinematicPairwiseDistinct ? "seeded copies distinct" : "pending"}</div><div className="mt-0.5 text-white/27">source product {observation?.sourceProductByteIdentical ? "unchanged" : "drift"} · buffers {observation?.presentationCopiesDisjoint ? "disjoint" : "shared"}</div></div>
      </div>
      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2"><span className="text-white/30">V7 {visual?.runtimeMatrixRows ?? 0}/24 token rows · {visual?.assetSelector ?? "no asset intent"} · browser not run</span><span className="flex gap-1.5"><button type="button" disabled={!ready} onClick={() => snapshot && download(snapshot, "json")} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-[7px] text-cyan-50/70 disabled:opacity-35">JSON</button><button type="button" disabled={!ready} onClick={() => snapshot && download(snapshot, "csv")} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-[7px] text-cyan-50/70 disabled:opacity-35">CSV</button></span></div>
    </section>
  );
}
