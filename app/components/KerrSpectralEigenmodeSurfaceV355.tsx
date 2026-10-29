"use client";

import { useEffect, useState } from "react";
import {
  parseKerrSpectralEigenmodeAuditArtifactV355,
  type KerrSpectralEigenmodeAuditArtifactV355,
} from "../lib/kerrSpectralEigenmodeAuditV355";

type SurfaceState = "loading" | "ready" | "unavailable" | "error";

export default function KerrSpectralEigenmodeSurfaceV355() {
  const [artifact, setArtifact] = useState<KerrSpectralEigenmodeAuditArtifactV355 | null>(null);
  const [state, setState] = useState<SurfaceState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v355/spectral-eigenmodes", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = await response.json() as { available?: boolean; reason?: string; artifact?: unknown };
        if (response.ok && value.available === false && value.reason === "lite-boundary") return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v355-spectral-eigenmodes-unavailable");
        }
        return parseKerrSpectralEigenmodeAuditArtifactV355(value.artifact);
      })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (!value) {
          setState("unavailable");
          return;
        }
        setArtifact(value);
        setState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-emerald-100/15 bg-[linear-gradient(145deg,rgba(5,29,24,.92),rgba(7,9,16,.98))] p-3 font-mono text-[8px] text-white/52"
      data-atlas-spectral-eigenmodes-v355
      data-atlas-spectral-eigenmodes-status={state}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-emerald-100/46">Response eigenmodes v355</div>
          <div className="mt-0.5 text-[13px] text-emerald-50/90">Principal axes / uncertainty ellipses</div>
        </div>
        <div className="text-right text-[7px] text-emerald-100/60">
          {artifact?.denseCampaignStatus ?? "dense unavailable"}
          <br />
          {state}
        </div>
      </div>
      {artifact ? (
        <>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-4">
            <Metric label="modes" value={String(artifact.counts.eigenmodeCount)} detail="4 rays × 3 axes" />
            <Metric label="ellipses" value={String(artifact.counts.ellipseCount)} detail="three band pairs" />
            <Metric label="reconstruct" value={artifact.maxima.reconstructionRelativeDifference.toExponential(2)} detail="covariance relative" />
            <Metric label="condition" value={artifact.maxima.conditionNumber.toFixed(2)} detail="maximum λ ratio" />
          </div>
          <div className="mt-2 rounded border border-emerald-100/10 bg-emerald-100/[.025] px-2 py-1.5 text-[7px] text-white/36">
            Deterministic Jacobi decomposition · trace and eigen-residual conserved · synthetic covariance axes, not measured instrument modes · never cinematic input
          </div>
        </>
      ) : (
        <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[8px] text-white/38">
          {state === "loading" ? "Loading bounded eigenmode audit..." : state === "unavailable" ? "Lite boundary" : "Eigenmode audit unavailable; fail closed."}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
      <div className="text-[7px] uppercase text-white/30">{label}</div>
      <div className="mt-1 text-[11px] text-emerald-50/84">{value}</div>
      <div className="text-[7px] text-white/30">{detail}</div>
    </div>
  );
}
