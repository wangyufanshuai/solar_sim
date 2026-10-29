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
  type KerrAuxiliaryConstraintArtifactV396,
} from "../lib/kerrAuxiliaryConstraintDesignV396";
import { loadAtlasObservationEvidenceStageV401 } from "../lib/atlasObservationEvidenceCacheV401";

const SOCKETS = Object.freeze(Array.from({ length: 12 }, (_, index) => index));
const STRATEGY_LABELS = Object.freeze({
  "photon-anchor": "Photon anchor",
  "redshift-anchor": "Redshift anchor",
  "balanced-photon-redshift-anchor": "Balanced P / Z",
  "flux-only-control": "Flux-only control",
  "replicated-conditioned-temperature-control": "Replicated T control",
} as const);

export default function KerrConstraintForgeV396() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 && profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400) return null;
  return <ConstraintForge profileId={profile} />;
}

function ConstraintForge({ profileId }: Readonly<{ profileId: AtlasVisualProfileV299 }>) {
  const profile = resolveAtlasVisualProfileV299(profileId);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v396-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrConstraintForgeV396",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const [artifact, setArtifact] =
    useState<KerrAuxiliaryConstraintArtifactV396 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    let active = true;
    void loadAtlasObservationEvidenceStageV401("constraints")
      .then((value) => {
        if (active) {
          setArtifact(value);
          setPhase("ready");
        }
      })
      .catch(() => {
        if (active) setPhase("unavailable");
      });
    return () => { active = false; };
  }, []);

  const strategies = artifact?.design.strategies ?? [];
  const style = {
    "--atlas-v396-grid": tokens.metrologyGridOpacity,
    "--atlas-v396-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-amber-100/15 bg-[radial-gradient(circle_at_13%_6%,rgba(251,191,36,.10),transparent_25%),radial-gradient(circle_at_91%_89%,rgba(45,212,191,.07),transparent_29%),linear-gradient(130deg,#0b0803,#080807_55%,#020908)] p-3 text-[8px] text-white/56"
      data-atlas-constraint-forge-v396
      data-atlas-v396-phase={phase}
      data-atlas-v396-baseline-rank="24"
      data-atlas-v396-full-rank="36"
      data-atlas-v396-minimum-constraints="12"
      data-atlas-v396-instrument-feasibility="false"
      data-atlas-v396-physical-recommendation="false"
      data-atlas-v396-science-payload-mutation="false"
      data-atlas-v396-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v396-grid)] [background-image:linear-gradient(rgba(254,243,199,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(254,243,199,.055)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-amber-100/48">
            v396 · structural measurement design / normalized rows
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.13em] text-amber-50/92">
            Constraint forge
          </h3>
          <p className="mt-1 max-w-[78ch] font-mono text-[6px] leading-relaxed text-white/36">
            Twelve independent sockets can lift twelve exact null directions.
            Structural rank is proven; instrument feasibility is unavailable.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/8 font-mono">
          <Metric label="rank" value="24 → 36" tone="amber" />
          <Metric label="sockets" value="12 / 12" tone="teal" />
          <Metric
            label="κ max"
            value={
              artifact
                ? artifact.design.maximumQualifiedStructuralConditionNumber.toFixed(3)
                : "—"
            }
            tone="neutral"
          />
        </div>
      </header>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="border border-amber-100/10 bg-black/28 p-3">
          <div className="flex items-center justify-between font-mono text-[6px] uppercase tracking-[.16em] text-amber-100/42">
            <span>null-direction sockets</span>
            <span>+12 rank</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {SOCKETS.map((socket) => (
              <div
                key={socket}
                className="group grid aspect-square place-items-center rounded-full border border-amber-100/18 bg-[radial-gradient(circle,rgba(251,191,36,.12)_0_24%,rgba(0,0,0,.7)_26%_52%,rgba(45,212,191,.08)_54%_57%,transparent_59%)] font-mono text-[7px] text-amber-100/55 shadow-[inset_0_0_12px_rgba(251,191,36,.04)]"
                data-atlas-v396-constraint-socket={socket}
              >
                {String(socket + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
          <div className="mt-3 border-l-2 border-amber-200/30 bg-amber-200/[.035] px-2 py-2 font-mono text-[6px] leading-relaxed text-amber-50/48">
            Partial coverage is exact: rank = 24 + k and nullity = 12 − k for
            k admitted independent constraints.
          </div>
        </div>

        <div className="space-y-1.5">
          {strategies.map((strategy) => (
            <StrategyLane key={strategy.id} strategy={strategy} />
          ))}
          {!artifact ? (
            <div className="border border-white/7 bg-black/26 px-3 py-5 font-mono text-[7px] uppercase tracking-[.12em] text-white/30">
              {phase === "loading"
                ? "Resolving structural constraint lattice…"
                : "Constraint-design artifact unavailable"}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-white/7 pt-2 font-mono text-[6px] leading-relaxed">
        <p className="m-0 max-w-[86ch] text-white/38">
          Three candidate observation rows prove only non-orthogonality to null-space directions;
          two negative controls prove the existing row span is not counted twice. Instrument response,
          noise covariance, Fisher information, posterior inference and measurement recommendations remain unavailable.
        </p>
        <p className="m-0 text-right uppercase tracking-[.13em] text-teal-100/45">
          structure qualified
          <br />
          physical admission absent
        </p>
      </footer>
    </section>
  );
}

function StrategyLane({
  strategy,
}: Readonly<{
  strategy: KerrAuxiliaryConstraintArtifactV396["design"]["strategies"][number];
}>) {
  const candidate = strategy.role === "rank-lifting-candidate";
  return (
    <div
      className={
        candidate
          ? "border border-teal-100/12 bg-teal-100/[.025] p-2"
          : "border border-white/8 bg-black/24 p-2 opacity-75"
      }
      data-atlas-v396-strategy={strategy.id}
      data-atlas-v396-strategy-role={strategy.role}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[6px]">
        <span className={candidate ? "text-teal-50/68" : "text-white/43"}>
          {STRATEGY_LABELS[strategy.id]}
        </span>
        <span className={candidate ? "text-teal-100/50" : "text-white/30"}>
          {candidate ? "STRUCTURAL CANDIDATE" : "NEGATIVE CONTROL"}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex h-1.5 min-w-0 flex-1 gap-px bg-white/5">
          {SOCKETS.map((socket) => (
            <span
              key={socket}
              className={
                socket < strategy.liftedBlockCount
                  ? "h-full flex-1 bg-teal-200/55"
                  : "h-full flex-1 bg-white/7"
              }
            />
          ))}
        </div>
        <span className="w-10 text-right font-mono text-[7px] text-white/47">
          +{strategy.liftedBlockCount}
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: Readonly<{
  label: string;
  value: string;
  tone: "amber" | "teal" | "neutral";
}>) {
  const color =
    tone === "amber"
      ? "text-amber-100/70"
      : tone === "teal"
        ? "text-teal-100/67"
        : "text-white/52";
  return (
    <div className="min-w-[74px] bg-black/38 px-2 py-1.5">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/28">
        {label}
      </div>
      <div className={`mt-0.5 text-[9px] ${color}`}>{value}</div>
    </div>
  );
}
