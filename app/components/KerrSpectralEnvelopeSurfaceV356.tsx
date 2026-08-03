"use client";

import { useEffect, useState } from "react";
import { parseKerrSpectralEnvelopeArtifactV356, serializeKerrSpectralEnvelopeCsvV356, serializeKerrSpectralEnvelopeJsonV356, type KerrSpectralEnvelopeArtifactV356 } from "../lib/kerrSpectralEnvelopeV356";

type SurfaceState = "loading" | "ready" | "unavailable" | "error";

export default function KerrSpectralEnvelopeSurfaceV356() {
  const [artifact, setArtifact] = useState<KerrSpectralEnvelopeArtifactV356 | null>(null);
  const [state, setState] = useState<SurfaceState>("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v356/spectral-envelope", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const value = await response.json() as { available?: boolean; reason?: string; artifact?: unknown };
      if (response.ok && value.available === false && value.reason === "lite-boundary") return null;
      if (!response.ok || value.available !== true || !value.artifact) throw new Error("v356-envelope-unavailable");
      return parseKerrSpectralEnvelopeArtifactV356(value.artifact);
    }).then((value) => { if (controller.signal.aborted) return; if (!value) { setState("unavailable"); return; } setArtifact(value); setState("ready"); }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  const download = (format: "json" | "csv") => {
    if (!artifact) return;
    const content = format === "json" ? serializeKerrSpectralEnvelopeJsonV356(artifact) : serializeKerrSpectralEnvelopeCsvV356(artifact);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbit-atlas-v356-envelope.${format}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return <section className="mt-2 rounded-[10px] border border-sky-100/15 bg-[linear-gradient(145deg,rgba(7,19,39,.92),rgba(7,9,16,.98))] p-3 font-mono text-[8px] text-white/52" data-atlas-spectral-envelope-v356 data-atlas-spectral-envelope-status={state}><div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[.2em] text-sky-100/46">Uncertainty envelope v356</div><div className="mt-0.5 text-[13px] text-sky-50/90">Provenance / 2D–3D reconstruction</div></div><div className="text-right text-[7px] text-sky-100/60">{artifact?.denseCampaignStatus ?? "dense unavailable"}<br />{state}</div></div>{artifact ? <><div className="mt-3 grid gap-1.5 sm:grid-cols-4"><Metric label="2D contours" value={String(artifact.counts.envelope2DCount)} detail="48 points each" /><Metric label="3D surface" value={String(artifact.counts.envelope3DPointCount)} detail="42 points each ray" /><Metric label="reconstruct" value={artifact.maxima.reconstructionRelativeDifference.toExponential(2)} detail="axis-probe covariance" /><Metric label="provenance" value="SANITIZED" detail="paths/PID/time excluded" /></div><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => download("json")} className="rounded border border-sky-100/15 px-2 py-1 text-[8px] text-sky-50/80">Export JSON</button><button type="button" onClick={() => download("csv")} className="rounded border border-sky-100/15 px-2 py-1 text-[8px] text-sky-50/80">Export CSV</button></div><div className="mt-2 rounded border border-sky-100/10 bg-sky-100/[.025] px-2 py-1.5 text-[7px] text-white/36">Synthetic covariance envelope · no FITS/PNG generated · no absolute paths · no machine metadata · never cinematic color input</div></> : <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[8px] text-white/38">{state === "loading" ? "Loading bounded uncertainty envelope..." : state === "unavailable" ? "Lite boundary" : "Envelope unavailable; fail closed."}</div>}</section>;
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) { return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className="mt-1 text-[11px] text-sky-50/84">{value}</div><div className="text-[7px] text-white/30">{detail}</div></div>; }
