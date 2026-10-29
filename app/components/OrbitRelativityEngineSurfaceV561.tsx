"use client";

import { useEffect, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { parseOrbitRelativityEngineApiV561, type OrbitRelativityEngineImportV561 } from "../lib/orbitRelativityEngineV561";

type LoadState = "idle" | "loading" | "ready" | "unavailable" | "error";

export default function OrbitRelativityEngineSurfaceV561({ active = true }: { active?: boolean }) {
  const [status, setStatus] = useState<LoadState>("idle");
  const [artifact, setArtifact] = useState<OrbitRelativityEngineImportV561 | null>(null);
  useEffect(() => {
    if (!active || getAtlasDeliveryProfile() !== "local-shadow") {
      setStatus("idle");
      setArtifact(null);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    void fetch("/api/atlas/relativity-evidence/v561/engine", { cache: "no-store", signal: controller.signal })
      .then(async (response) => parseOrbitRelativityEngineApiV561(await response.json()))
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result.available) {
          setStatus("unavailable");
          setArtifact(null);
          return;
        }
        setArtifact(result.summary);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("error");
          setArtifact(null);
        }
      });
    return () => controller.abort();
  }, [active]);
  return <section className="mt-3 rounded border border-violet-100/10 bg-violet-100/[0.025] p-3" data-atlas-orbit-relativity-engine-v561 data-atlas-v561-engine-status={status} data-atlas-v561-engine-measured={artifact?.qualification.measuredAuthority ?? false} data-atlas-v561-engine-grmhd={artifact?.qualification.grmhd ?? false} data-atlas-v561-engine-transport={artifact?.boundary.transportStatus ?? "unavailable"}>
    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-violet-50/65">Orbit Relativity Engine · V561</div>
    {status === "idle" ? <p className="mt-1 text-[9px] text-white/40">CPU Kerr reference engine; readable only in local-shadow.</p> : null}
    {status === "loading" ? <p className="mt-1 text-[9px] text-white/45">Reading the engine manifest…</p> : null}
    {status === "unavailable" ? <p className="mt-1 text-[9px] text-amber-100/60">The current delivery profile does not expose the reference engine.</p> : null}
    {status === "error" ? <p className="mt-1 text-[9px] text-rose-100/65">The engine artifact is unavailable or failed its SHA boundary.</p> : null}
    {status === "ready" && artifact ? <div className="mt-2 grid gap-1 text-[9px] text-white/55 sm:grid-cols-2"><span>metric: {artifact.summary.metric} · spin: {artifact.summary.spin}</span><span>{artifact.summary.rayCount} CPU rays · {artifact.summary.counts.frequencyCount} frequency values</span><span>Schwarzschild photon sphere: {String(artifact.summary.benchmarks.schwarzschildPhotonSphereRadiusM)} M</span><span>Kerr prograde ISCO: {String(artifact.summary.benchmarks.kerrProgradeIscoRadiusM)} M</span><span className="text-lime-100/60 sm:col-span-2">transport: sparse CPU reference qualified · WP/PT differential {artifact.summary.transport?.maxIndependentEvpaDifferenceRad.toExponential(2) ?? "unavailable"} rad</span><span className="text-amber-100/60 sm:col-span-2">measured: unavailable · GRMHD/radiative-transfer: blocked · no Science payload writeback.</span></div> : null}
  </section>;
}
