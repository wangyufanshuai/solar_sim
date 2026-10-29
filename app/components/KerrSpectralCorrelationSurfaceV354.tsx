"use client";

import { useEffect, useState } from "react";
import {
  parseKerrSpectralCorrelationResponseArtifactV354,
  type KerrSpectralCorrelationResponseArtifactV354,
} from "../lib/kerrSpectralCorrelationResponseV354";

type SurfaceState = "loading" | "ready" | "unavailable" | "error";

export default function KerrSpectralCorrelationSurfaceV354() {
  const [artifact, setArtifact] = useState<KerrSpectralCorrelationResponseArtifactV354 | null>(null);
  const [state, setState] = useState<SurfaceState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v354/spectral-correlation", {
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
          throw new Error("v354-spectral-correlation-unavailable");
        }
        return parseKerrSpectralCorrelationResponseArtifactV354(value.artifact);
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
      className="mt-2 rounded-[10px] border border-cyan-100/15 bg-[linear-gradient(145deg,rgba(5,30,35,.92),rgba(7,9,16,.98))] p-3 font-mono text-[8px] text-white/52"
      data-atlas-spectral-correlation-v354
      data-atlas-spectral-correlation-status={state}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-cyan-100/46">Spectral covariance fixture v354</div>
          <div className="mt-0.5 text-[13px] text-cyan-50/90">Correlated basis response matrix</div>
        </div>
        <div className="text-right text-[7px] text-cyan-100/60">
          {artifact?.denseCampaignStatus ?? "dense unavailable"}
          <br />
          {state}
        </div>
      </div>
      {artifact ? (
        <>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-4">
            <Metric label="coefficients" value={String(artifact.counts.coefficientCount)} detail="3 bands × 3 modes" />
            <Metric label="executions" value={String(artifact.counts.perturbationExecutions)} detail="central differences" />
            <Metric label="max sigma" value={artifact.maxima.responseRelativeSigma.toExponential(2)} detail="synthetic relative response" />
            <Metric label="cross-band" value={artifact.maxima.responseCorrelationAbsoluteOffDiagonal.toFixed(3)} detail="max |correlation|" />
          </div>
          <div className="mt-2 rounded border border-cyan-100/10 bg-cyan-100/[.025] px-2 py-1.5 text-[7px] text-white/36">
            Explicit positive-definite synthetic covariance · quadratic-form propagation · not RSS independence · not measured calibration · never cinematic input
          </div>
        </>
      ) : (
        <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[8px] text-white/38">
          {state === "loading" ? "Loading bounded covariance fixture..." : state === "unavailable" ? "Lite boundary" : "Spectral covariance fixture unavailable; fail closed."}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
      <div className="text-[7px] uppercase text-white/30">{label}</div>
      <div className="mt-1 text-[11px] text-cyan-50/84">{value}</div>
      <div className="text-[7px] text-white/30">{detail}</div>
    </div>
  );
}
