"use client";

import { useEffect, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { parseIxpeMetadataProbeApiV563, type IxpeMetadataProbeV563 } from "../lib/ixpeMetadataProbeV563";

type State = "idle" | "loading" | "ready" | "unavailable" | "error";

export default function IxpeMetadataProbeSurfaceV563() {
  const [state, setState] = useState<State>("idle");
  const [artifact, setArtifact] = useState<IxpeMetadataProbeV563 | null>(null);
  useEffect(() => {
    if (getAtlasDeliveryProfile() !== "local-shadow") return;
    const controller = new AbortController();
    setState("loading");
    void fetch("/api/atlas/relativity-evidence/v563/ixpe-metadata", { cache: "no-store", signal: controller.signal })
      .then(async (response) => parseIxpeMetadataProbeApiV563(await response.json()))
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result.available) { setState("unavailable"); return; }
        setArtifact(result.summary);
        setState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  return <section className="mt-3 rounded border border-sky-100/10 bg-sky-100/[0.025] p-3" data-atlas-ixpe-metadata-v563 data-atlas-v563-metadata-status={state} data-atlas-v563-metadata-probe-status={artifact?.status ?? "unavailable"} data-atlas-v563-metadata-authority={artifact?.qualification.measuredAuthorityGranted ?? false} data-atlas-v563-metadata-conflict={artifact?.probe.mirrorIdentityConflict ?? false}>
    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-sky-50/65">IXPE archive metadata · V563</div>
    {state === "idle" ? <p className="mt-1 text-[9px] text-white/40">HEAD-only metadata probe · HEASARC + NASA mirror · no payload read.</p> : null}
    {state === "loading" ? <p className="mt-1 text-[9px] text-white/45">Reading the metadata receipt…</p> : null}
    {state === "unavailable" ? <p className="mt-1 text-[9px] text-amber-100/60">Metadata probe is unavailable outside local-shadow.</p> : null}
    {state === "error" ? <p className="mt-1 text-[9px] text-rose-100/65">Metadata receipt failed closed.</p> : null}
    {state === "ready" && artifact ? <div className="mt-2 grid gap-1 text-[9px] text-white/55 sm:grid-cols-2"><span>target: {artifact.target}</span><span>method: {artifact.probe.method}</span><span>network: {artifact.probe.networkAttempted ? "single pass executed" : "not executed"}</span><span>sources: {artifact.probe.sourceCount} / 2</span><span>payload: {artifact.probe.payloadRead ? "read" : "not read"}</span><span>automatic retry: {artifact.probe.automaticRetry ? "on" : "off"}</span>{artifact.probe.mirrorIdentityConflict ? <span className="text-rose-100/65 sm:col-span-2">HEASARC / NASA mirror identity conflict · fail-closed.</span> : null}<span className="text-amber-100/60 sm:col-span-2">metadata available: {artifact.qualification.metadataAvailable ? "yes" : "no"} · measured authority: blocked.</span></div> : null}
  </section>;
}
