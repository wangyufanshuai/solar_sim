"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V377, ATLAS_VISUAL_PROFILE_CANDIDATE_V400, resolveAtlasVisualProfileV299, type AtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import type { KerrPhysicalObservationTemplateArtifactV399 } from "../lib/kerrPhysicalObservationTemplateV399";
import { loadAtlasObservationEvidenceStageV401 } from "../lib/atlasObservationEvidenceCacheV401";

const LANES = Object.freeze([
  Object.freeze({ code: "Rλ", label: "Photon radiance", accent: "cyan" }),
  Object.freeze({ code: "GZ", label: "Geometry redshift", accent: "teal" }),
  Object.freeze({ code: "PT", label: "Page–Thorne flux", accent: "orange" }),
]);

export default function KerrProvenanceRailV399() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return null;
  return <ProvenanceRail profileId={profile} />;
}

function ProvenanceRail({ profileId }: Readonly<{ profileId: AtlasVisualProfileV299 }>) {
  const profile = resolveAtlasVisualProfileV299(profileId);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v399-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrProvenanceRailV399", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<KerrPhysicalObservationTemplateArtifactV399 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    let active = true;
    void loadAtlasObservationEvidenceStageV401("provenance")
      .then((value) => { if (active) { setArtifact(value); setPhase("ready"); } })
      .catch(() => { if (active) setPhase("unavailable"); });
    return () => { active = false; };
  }, []);
  const style = { "--atlas-v399-grid": tokens.metrologyGridOpacity, "--atlas-v399-signal": tokens.authorityGateLuminance } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-emerald-100/13 bg-[radial-gradient(circle_at_4%_12%,rgba(45,212,191,.09),transparent_26%),radial-gradient(circle_at_94%_88%,rgba(249,115,22,.07),transparent_28%),linear-gradient(132deg,#020b09,#070807_55%,#0b0603)] p-3 text-[8px] text-white/55"
      data-atlas-provenance-rail-v399
      data-atlas-v399-phase={phase}
      data-atlas-v399-template-only="true"
      data-atlas-v399-observation-values="false"
      data-atlas-v399-compile-eligible="false"
      data-atlas-v399-missing-files="13"
      data-atlas-v399-actual-sources="0"
      data-atlas-v399-measured-authority="false"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v399-grid)] [background-image:radial-gradient(circle,rgba(167,243,208,.055)_1px,transparent_1px)] [background-size:21px_21px]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.27em] text-emerald-100/44">v399 · source topology / empty-slot diagnostics</div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.15em] text-emerald-50/92">Provenance rail</h3>
          <p className="mt-1 max-w-[84ch] font-mono text-[6px] leading-relaxed text-white/35">A value-free route map from source documents to the Science boundary. Every rail is required; none is currently occupied.</p>
        </div>
        <a href="/api/atlas/relativity-evidence/v399/intake-template" download className="atlas-accessible-focus border border-emerald-100/18 bg-emerald-100/[.045] px-3 py-2 font-mono text-[6px] uppercase tracking-[.13em] text-emerald-100/62 hover:bg-emerald-100/[.08]">Download value-free template</a>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_185px]">
        <div className="space-y-2 border border-white/7 bg-black/24 p-2.5">
          {LANES.map((lane) => (
            <div key={lane.code} className="grid items-center gap-1 sm:grid-cols-[42px_1fr_1fr_1fr_30px]" data-atlas-v399-provenance-lane={lane.code}>
              <div className={`grid h-9 place-items-center border font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[13px] tracking-[.1em] ${lane.accent === "cyan" ? "border-cyan-100/14 text-cyan-100/58" : lane.accent === "teal" ? "border-teal-100/14 text-teal-100/58" : "border-orange-100/14 text-orange-100/58"}`}>{lane.code}</div>
              <RailNode label="source data" />
              <RailNode label="provenance + terms" />
              <RailNode label="pack input" />
              <span aria-hidden="true" className="h-px bg-gradient-to-r from-emerald-100/28 to-transparent" />
            </div>
          ))}
          <div className="grid gap-1 border-t border-white/7 pt-2 sm:grid-cols-[42px_1fr_1fr_1fr_30px]">
            <div className="grid h-8 place-items-center border border-amber-100/12 font-mono text-[7px] text-amber-100/45">×3</div>
            <RailNode label="cross evidence" />
            <RailNode label="v397 admission" />
            <RailNode label="v398 compiler" />
            <span aria-hidden="true" className="h-px bg-gradient-to-r from-amber-100/28 to-transparent" />
          </div>
        </div>

        <aside className="border border-emerald-100/9 bg-emerald-100/[.018] p-2.5 font-mono">
          <div className="text-[6px] uppercase tracking-[.16em] text-emerald-100/42">topology checksum</div>
          <div className="mt-2 grid grid-cols-2 gap-px bg-white/7">
            <Metric label="nodes" value={artifact ? String(artifact.topology.nodeCount) : "—"} />
            <Metric label="edges" value={artifact ? String(artifact.topology.edgeCount) : "—"} />
            <Metric label="actual" value="0" />
            <Metric label="missing" value="13" />
          </div>
          <div className="mt-3 border-l-2 border-emerald-100/22 bg-emerald-100/[.025] px-2 py-2 text-[6px] leading-relaxed text-emerald-50/43">Topology describes required provenance only. It is not evidence that any source, license or observation exists.</div>
        </aside>
      </div>

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/7 pt-2 font-mono text-[6px] leading-relaxed">
        <p className="m-0 max-w-[88ch] text-white/37">The download contains no value, exampleValue or sampleValue and cannot pass the v398 compiler. Every physical source must be supplied explicitly and every SHA recomputed.</p>
        <p className="m-0 text-right uppercase tracking-[.13em] text-emerald-100/46">template only<br />zero physical sources</p>
      </footer>
    </section>
  );
}

function RailNode({ label }: Readonly<{ label: string }>) { return <div className="relative flex h-9 items-center justify-between overflow-hidden border border-white/7 bg-white/[.012] px-2 font-mono text-[6px] text-white/32"><span>{label}</span><span className="text-orange-100/38">missing</span><span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-emerald-100/22 via-white/4 to-transparent" /></div>; }
function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="bg-black/30 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.12em] text-white/24">{label}</div><div className="mt-0.5 text-[8px] text-emerald-100/55">{value}</div></div>; }
