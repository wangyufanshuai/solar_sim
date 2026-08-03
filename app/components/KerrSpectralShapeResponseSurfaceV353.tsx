"use client";

import { useEffect, useState } from "react";
import {
  parseKerrSpectralShapeResponseArtifactV353,
  type KerrSpectralShapeResponseArtifactV353,
} from "../lib/kerrSpectralShapeResponseV353";

type SurfaceState = "loading" | "ready" | "unavailable" | "error";

export default function KerrSpectralShapeResponseSurfaceV353() {
  const [artifact, setArtifact] = useState<KerrSpectralShapeResponseArtifactV353 | null>(null);
  const [state, setState] = useState<SurfaceState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v353/spectral-shape", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = await response.json() as {
          available?: boolean;
          reason?: string;
          artifact?: unknown;
        };
        if (response.ok && value.available === false && value.reason === "lite-boundary") return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v353-spectral-shape-unavailable");
        }
        return parseKerrSpectralShapeResponseArtifactV353(value.artifact);
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
      className="mt-2 rounded-[10px] border border-violet-100/15 bg-[linear-gradient(145deg,rgba(23,10,39,.92),rgba(7,9,16,.98))] p-3 font-mono text-[8px] text-white/52"
      data-atlas-spectral-shape-response-v353
      data-atlas-spectral-shape-response-status={state}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-violet-100/46">Spectral shape fixture v353</div>
          <div className="mt-0.5 text-[13px] text-violet-50/90">Energy-normalized frequency tilt</div>
        </div>
        <div className="text-right text-[7px] text-violet-100/60">
          {artifact?.denseCampaignStatus ?? "dense unavailable"}
          <br />
          {state}
        </div>
      </div>
      {artifact ? (
        <>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-4">
            <Metric label="rows" value={String(artifact.counts.rowCount)} detail="24 tilt executions" />
            <Metric label="energy" value={artifact.maxima.energyConservationRelativeDifference.toExponential(2)} detail="normalized conservation" />
            <Metric label="photon shift" value={artifact.maxima.photonShiftAbsoluteRelative.toExponential(2)} detail="frequency-shape sensitivity" />
            <Metric label="authority" value="UNCHANGED" detail="fixture, not measurement" />
          </div>
          <div className="mt-2 rounded border border-violet-100/10 bg-violet-100/[.025] px-2 py-1.5 text-[7px] text-white/36">
            Fixture only · no calibrated spectral uncertainty · full response envelope unavailable · no RSS · never cinematic color input
          </div>
        </>
      ) : (
        <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[8px] text-white/38">
          {state === "loading" ? "Loading bounded spectral-shape fixture..." : state === "unavailable" ? "Lite boundary" : "Spectral fixture unavailable; fail closed."}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
      <div className="text-[7px] uppercase text-white/30">{label}</div>
      <div className="mt-1 text-[11px] text-violet-50/84">{value}</div>
      <div className="text-[7px] text-white/30">{detail}</div>
    </div>
  );
}
