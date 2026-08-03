"use client";

import { useEffect, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { parseIxpeMeasuredIntakeApiV562, type IxpeMeasuredIntakeV562 } from "../lib/ixpeMeasuredIntakeV562";

type LoadState = "idle" | "loading" | "ready" | "unavailable" | "error";

export default function IxpeMeasuredIntakeSurfaceV562() {
  const [state, setState] = useState<LoadState>("idle");
  const [artifact, setArtifact] = useState<IxpeMeasuredIntakeV562 | null>(null);
  useEffect(() => {
    if (getAtlasDeliveryProfile() !== "local-shadow") return;
    const controller = new AbortController();
    setState("loading");
    void fetch("/api/atlas/relativity-evidence/v562/ixpe-intake", { cache: "no-store", signal: controller.signal })
      .then(async (response) => parseIxpeMeasuredIntakeApiV562(await response.json()))
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result.available) { setState("unavailable"); return; }
        setArtifact(result.summary);
        setState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  return <section className="mt-3 rounded border border-cyan-100/10 bg-cyan-100/[0.025] p-3" data-atlas-ixpe-intake-v562 data-atlas-v562-ixpe-status={state} data-atlas-v562-ixpe-authority={artifact?.qualification.measuredAuthorityGranted ?? false}>
    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-50/65">IXPE measured intake · V562</div>
    {state === "idle" ? <p className="mt-1 text-[9px] text-white/40">Local-shadow only · explicit HEASARC acquisition required.</p> : null}
    {state === "loading" ? <p className="mt-1 text-[9px] text-white/45">Reading immutable intake receipt…</p> : null}
    {state === "unavailable" ? <p className="mt-1 text-[9px] text-amber-100/60">The measured lane is unavailable outside local-shadow.</p> : null}
    {state === "error" ? <p className="mt-1 text-[9px] text-rose-100/65">Intake receipt failed closed (missing or corrupt).</p> : null}
    {state === "ready" && artifact ? <div className="mt-2 grid gap-1 text-[9px] text-white/55 sm:grid-cols-2"><span>target: {artifact.target}</span><span>instrument: {artifact.instrumentId}</span><span>files: {artifact.inspect.readyFileCount} / {artifact.inspect.requiredFileCount}</span><span>holdout: {artifact.inspect.missingFileIds.includes("independent-holdout") ? "missing" : "present"}</span><span className="text-amber-100/60 sm:col-span-2">measured authority: blocked · no synthetic counts · no automatic target replacement or retry.</span></div> : null}
  </section>;
}
