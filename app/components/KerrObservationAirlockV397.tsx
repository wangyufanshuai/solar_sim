"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  resolveAtlasVisualProfileV299,
  type AtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";
import {
  type KerrPhysicalObservationAdmissionArtifactV397,
} from "../lib/kerrPhysicalObservationAdmissionV397";
import { loadAtlasObservationEvidenceStageV401 } from "../lib/atlasObservationEvidenceCacheV401";

const SOURCE_BAYS = Object.freeze([
  Object.freeze({ id: "radiance", code: "Rλ", label: "Detector radiance", requirement: "calibration + response" }),
  Object.freeze({ id: "redshift", code: "GZ", label: "Geometry redshift", requirement: "validated observer frame" }),
  Object.freeze({ id: "flux", code: "PT", label: "Page–Thorne flux", requirement: "model validation" }),
]);
const CROSS_LINKS = Object.freeze(["Rλ → GZ", "Rλ → PT", "GZ → PT"]);

export default function KerrObservationAirlockV397() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return null;
  return <ObservationAirlock profileId={profile} />;
}

function ObservationAirlock({ profileId }: Readonly<{ profileId: AtlasVisualProfileV299 }>) {
  const profile = resolveAtlasVisualProfileV299(profileId);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v397-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrObservationAirlockV397", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<KerrPhysicalObservationAdmissionArtifactV397 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    let active = true;
    void loadAtlasObservationEvidenceStageV401("admission")
      .then((value) => { if (active) { setArtifact(value); setPhase("ready"); } })
      .catch(() => { if (active) setPhase("unavailable"); });
    return () => { active = false; };
  }, []);
  const style = {
    "--atlas-v397-grid": tokens.metrologyGridOpacity,
    "--atlas-v397-signal": tokens.authorityGateLuminance,
  } as CSSProperties;
  const admission = artifact?.productionAdmission;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/14 bg-[radial-gradient(circle_at_90%_8%,rgba(34,211,238,.09),transparent_27%),radial-gradient(circle_at_8%_91%,rgba(251,191,36,.07),transparent_30%),linear-gradient(135deg,#02090b,#060807_52%,#0b0702)] p-3 text-[8px] text-white/55"
      data-atlas-observation-airlock-v397
      data-atlas-v397-phase={phase}
      data-atlas-v397-physical-pack="unavailable"
      data-atlas-v397-available-sources="0"
      data-atlas-v397-available-cross-links="0"
      data-atlas-v397-publication-allowed="false"
      data-atlas-v397-measured-authority="false"
      data-atlas-v397-science-payload-mutation="false"
      data-atlas-v397-cinematic-consumer="false"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v397-grid)] [background-image:repeating-linear-gradient(90deg,rgba(165,243,252,.045)_0_1px,transparent_1px_31px),repeating-linear-gradient(0deg,rgba(165,243,252,.035)_0_1px,transparent_1px_31px)]" />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.26em] text-cyan-100/44">v397 · provenance / licensing / covariance admission</div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.14em] text-cyan-50/91">Observation airlock</h3>
          <p className="mt-1 max-w-[82ch] font-mono text-[6px] leading-relaxed text-white/35">Three physical source families and three cross-source links must clear identity, terms, frame, epoch and PSD gates before any structural constraint becomes a measurement.</p>
        </div>
        <div className="flex items-center gap-2 border border-amber-100/13 bg-amber-100/[.035] px-2.5 py-2 font-mono">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-amber-100/20 text-[9px] text-amber-100/66">0/3</span>
          <div>
            <div className="text-[5px] uppercase tracking-[.14em] text-white/28">physical sources</div>
            <div className="mt-0.5 text-[7px] text-amber-100/55">AIRLOCK CLOSED</div>
          </div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="grid gap-2 sm:grid-cols-3">
          {SOURCE_BAYS.map((bay, index) => (
            <article key={bay.id} className="relative overflow-hidden border border-cyan-100/10 bg-black/30 p-2.5" data-atlas-v397-source-bay={bay.id}>
              <div aria-hidden="true" className="absolute right-0 top-0 h-12 w-12 bg-[linear-gradient(135deg,transparent_49%,rgba(34,211,238,.09)_50%,transparent_52%)]" />
              <div className="flex items-center justify-between gap-2">
                <span className="font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] tracking-[.12em] text-cyan-100/65">{bay.code}</span>
                <span className="font-mono text-[6px] text-white/26">BAY {String(index + 1).padStart(2, "0")}</span>
              </div>
              <h4 className="mt-2 font-mono text-[7px] uppercase tracking-[.12em] text-white/52">{bay.label}</h4>
              <p className="mt-1 font-mono text-[6px] text-white/28">{bay.requirement}</p>
              <div className="mt-3 space-y-1 font-mono text-[6px]">
                <Gate label="artifact SHA" />
                <Gate label="provenance SHA" />
                <Gate label="explicit terms" />
                <Gate label="12 observation rows" />
              </div>
            </article>
          ))}
        </div>

        <aside className="border border-white/8 bg-black/24 p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.16em] text-white/35">cross-source lattice</div>
          <div className="mt-2 space-y-1.5">
            {CROSS_LINKS.map((link) => (
              <div key={link} className="flex items-center gap-2 border border-white/7 bg-white/[.018] px-2 py-1.5 font-mono text-[6px]">
                <span className="h-1.5 w-1.5 rounded-full border border-amber-100/28" />
                <span className="flex-1 text-white/40">{link}</span>
                <span className="text-amber-100/45">missing</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-l-2 border-cyan-100/24 bg-cyan-100/[.025] px-2 py-2 font-mono text-[6px] leading-relaxed text-cyan-50/44">Correlation evidence must be a joint estimator or an explicit independence argument. Zero is never imputed.</div>
        </aside>
      </div>

      <div className="relative mt-3 grid gap-px bg-white/7 font-mono sm:grid-cols-4">
        <Metric label="contract" value={artifact ? "qualified" : phase} tone="cyan" />
        <Metric label="fixture attacks" value={artifact ? "9 / 9 rejected" : "—"} tone="neutral" />
        <Metric label="source rows" value={artifact ? `${artifact.schema.rowCountPerSource} required` : "—"} tone="neutral" />
        <Metric label="physical admission" value={admission?.physicalObservationPackAvailable ? "ready" : "unavailable"} tone="amber" />
      </div>

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/7 pt-2 font-mono text-[6px] leading-relaxed">
        <p className="m-0 max-w-[88ch] text-white/37">Only the admission contract and synthetic adversarial fixtures are qualified. Without a physical observation pack, license evidence or cross-source correlation, no physical covariance, auxiliary constraint, confidence interval or measured authority is produced.</p>
        <p className="m-0 text-right uppercase tracking-[.13em] text-amber-100/48">contract qualified<br />physical pack absent</p>
      </footer>
    </section>
  );
}

function Gate({ label }: Readonly<{ label: string }>) {
  return <div className="flex items-center justify-between gap-2 border-b border-white/6 pb-1"><span className="text-white/32">{label}</span><span className="text-amber-100/42">● pending</span></div>;
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "cyan" | "amber" | "neutral" }>) {
  const color = tone === "cyan" ? "text-cyan-100/62" : tone === "amber" ? "text-amber-100/58" : "text-white/48";
  return <div className="bg-black/30 px-2 py-1.5"><div className="text-[5px] uppercase tracking-[.12em] text-white/25">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
