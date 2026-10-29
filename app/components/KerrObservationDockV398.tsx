"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V377, ATLAS_VISUAL_PROFILE_CANDIDATE_V400, resolveAtlasVisualProfileV299, type AtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import type { KerrPhysicalObservationIntakeArtifactV398 } from "../lib/kerrPhysicalObservationIntakeV398";
import { loadAtlasObservationEvidenceStageV401 } from "../lib/atlasObservationEvidenceCacheV401";

const GROUPS = Object.freeze([
  Object.freeze({ id: "pack", label: "PACK", count: 1, tone: "cyan" }),
  Object.freeze({ id: "data", label: "SOURCE DATA", count: 3, tone: "cyan" }),
  Object.freeze({ id: "provenance", label: "PROVENANCE", count: 3, tone: "teal" }),
  Object.freeze({ id: "terms", label: "LICENSE SNAPSHOTS", count: 3, tone: "amber" }),
  Object.freeze({ id: "cross", label: "CROSS EVIDENCE", count: 3, tone: "amber" }),
]);

export default function KerrObservationDockV398() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return null;
  return <ObservationDock profileId={profile} />;
}

function ObservationDock({ profileId }: Readonly<{ profileId: AtlasVisualProfileV299 }>) {
  const profile = resolveAtlasVisualProfileV299(profileId);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v398-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrObservationDockV398", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<KerrPhysicalObservationIntakeArtifactV398 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    let active = true;
    void loadAtlasObservationEvidenceStageV401("intake")
      .then((value) => { if (active) { setArtifact(value); setPhase("ready"); } })
      .catch(() => { if (active) setPhase("unavailable"); });
    return () => { active = false; };
  }, []);
  const style = { "--atlas-v398-grid": tokens.metrologyGridOpacity, "--atlas-v398-signal": tokens.authorityGateLuminance } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-orange-100/13 bg-[radial-gradient(ellipse_at_15%_100%,rgba(249,115,22,.10),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(34,211,238,.07),transparent_25%),linear-gradient(125deg,#0d0703,#070909_55%,#02080a)] p-3 text-[8px] text-white/55"
      data-atlas-observation-dock-v398
      data-atlas-v398-phase={phase}
      data-atlas-v398-staging-manifest="absent"
      data-atlas-v398-present-files="0"
      data-atlas-v398-expected-files="13"
      data-atlas-v398-compile-executed="false"
      data-atlas-v398-candidate-published="false"
      data-atlas-v398-measured-authority="false"
      data-atlas-v398-network-attempted="false"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v398-grid)] [background-image:linear-gradient(120deg,transparent_0_47%,rgba(254,215,170,.045)_48%_49%,transparent_50%),repeating-linear-gradient(90deg,rgba(165,243,252,.035)_0_1px,transparent_1px_36px)] [background-size:54px_54px,36px_36px]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.26em] text-orange-100/45">v398 · bounded local intake / atomic candidate compiler</div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.15em] text-orange-50/92">Observation dock</h3>
          <p className="mt-1 max-w-[84ch] font-mono text-[6px] leading-relaxed text-white/35">A thirteen-file cargo graph must arrive intact. Paths, bytes, SHA, license snapshots and cross evidence are checked before the compiler can create a non-runtime candidate.</p>
        </div>
        <div className="border border-orange-100/14 bg-orange-100/[.035] px-3 py-2 font-mono text-right">
          <div className="text-[16px] leading-none text-orange-100/68">00 / 13</div>
          <div className="mt-1 text-[5px] uppercase tracking-[.15em] text-white/27">dock occupancy</div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {GROUPS.map((group, groupIndex) => (
            <article key={group.id} className="border border-white/8 bg-black/28 p-2" data-atlas-v398-file-group={group.id}>
              <div className="flex items-center justify-between font-mono text-[6px]">
                <span className={group.tone === "cyan" ? "text-cyan-100/50" : group.tone === "teal" ? "text-teal-100/50" : "text-orange-100/52"}>{group.label}</span>
                <span className="text-white/25">0/{group.count}</span>
              </div>
              <div className="mt-2 space-y-1">
                {Array.from({ length: group.count }, (_, index) => (
                  <div key={index} className="relative h-8 overflow-hidden border border-white/7 bg-white/[.012]">
                    <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-orange-100/12" />
                    <div className="flex h-full items-center justify-between px-2 font-mono text-[6px]">
                      <span className="text-white/28">SLOT {String(groupIndex * 3 + index + 1).padStart(2, "0")}</span>
                      <span className="text-orange-100/38">empty</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="border border-cyan-100/9 bg-cyan-100/[.018] p-2.5 font-mono">
          <div className="text-[6px] uppercase tracking-[.16em] text-cyan-100/42">compiler interlocks</div>
          <div className="mt-2 space-y-1 text-[6px] text-white/36">
            <Interlock label="relative paths only" />
            <Interlock label="64 MiB total cap" />
            <Interlock label="pack canonical SHA" />
            <Interlock label="v397 admission" />
            <Interlock label="atomic no-overwrite" />
          </div>
          <div className="mt-3 border-l-2 border-orange-100/24 bg-orange-100/[.025] px-2 py-2 text-[6px] leading-relaxed text-orange-50/45">Compiler output remains a candidate awaiting independent validation. It cannot publish runtime data or grant measured authority.</div>
        </aside>
      </div>

      <div className="relative mt-3 grid gap-px bg-white/7 font-mono sm:grid-cols-4">
        <Metric label="manifest" value={artifact?.inspect.stagingManifestPresent ? "present" : "absent"} tone="orange" />
        <Metric label="contract" value={artifact ? "qualified" : phase} tone="cyan" />
        <Metric label="compiler" value={artifact?.qualification.atomicCompilerImplemented ? "implemented" : "—"} tone="cyan" />
        <Metric label="authority" value="not granted" tone="orange" />
      </div>

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/7 pt-2 font-mono text-[6px] leading-relaxed">
        <p className="m-0 max-w-[88ch] text-white/37">The staging manifest is absent, so no source file was read, no attempt was consumed and compile did not run. A single bounded compile becomes available only after the user explicitly supplies the complete physical pack.</p>
        <code className="border border-white/8 bg-black/30 px-2 py-1 text-[6px] text-cyan-100/45">measurement-authority-v398-compile</code>
      </footer>
    </section>
  );
}

function Interlock({ label }: Readonly<{ label: string }>) { return <div className="flex items-center gap-2 border-b border-white/6 pb-1"><span className="h-1.5 w-1.5 rounded-full border border-cyan-100/25" /><span>{label}</span></div>; }
function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "cyan" | "orange" }>) { return <div className="bg-black/30 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.12em] text-white/25">{label}</div><div className={`mt-0.5 text-[7px] ${tone === "cyan" ? "text-cyan-100/58" : "text-orange-100/58"}`}>{value}</div></div>; }
