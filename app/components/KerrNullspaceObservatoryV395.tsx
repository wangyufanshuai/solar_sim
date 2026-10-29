"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";
import {
  parseKerrGlobalObservabilityArtifactV395,
  type KerrGlobalObservabilityArtifactV395,
} from "../lib/kerrGlobalObservabilityV395";

const SPOKES = Object.freeze(
  Array.from({ length: 12 }, (_, index) => ({
    index,
    rotation: index * 30,
    length: 34 + ((index * 7) % 5) * 4,
  })),
);

export default function KerrNullspaceObservatoryV395() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <NullspaceObservatory />;
}

function NullspaceObservatory() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v395-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrNullspaceObservatoryV395",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrGlobalObservabilityArtifactV395 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v395/observability", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v395-observability-unavailable");
        }
        return parseKerrGlobalObservabilityArtifactV395(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setArtifact(value);
          setPhase("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase("unavailable");
      });
    return () => controller.abort();
  }, []);
  const style = {
    "--atlas-v395-grid": tokens.metrologyGridOpacity,
    "--atlas-v395-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-violet-100/15 bg-[radial-gradient(circle_at_18%_14%,rgba(167,139,250,.12),transparent_25%),radial-gradient(circle_at_86%_86%,rgba(45,212,191,.07),transparent_29%),linear-gradient(127deg,#07030c,#07070a_56%,#020908)] p-3 text-[8px] text-white/56"
      data-atlas-nullspace-observatory-v395
      data-atlas-v395-phase={phase}
      data-atlas-v395-structural-observability-qualified="true"
      data-atlas-v395-rank="24"
      data-atlas-v395-nullity="12"
      data-atlas-v395-physical-mode-attribution="false"
      data-atlas-v395-nullspace-prior="false"
      data-atlas-v395-unobservable-zero="false"
      data-atlas-v395-probability-content="false"
      data-atlas-v395-science-payload-mutation="false"
      data-atlas-v395-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v395-grid)] [background-image:radial-gradient(circle,rgba(221,214,254,.08)_1px,transparent_1px)] [background-size:19px_19px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-violet-100/45">
            v395 · analytic pseudoinverse / structural nullspace
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-violet-50/92">
            Nullspace observatory
          </h3>
          <p className="mt-1 max-w-[76ch] font-mono text-[6px] leading-relaxed text-white/35">
            Twelve exact dark directions preserve conditioned temperature while
            the remaining 24 dimensions are structurally observable.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/8 font-mono">
          <Metric label="rank" value="24" tone="teal" />
          <Metric label="nullity" value="12" tone="violet" />
          <Metric label="input" value="36" tone="neutral" />
          <Metric label="condition" value={artifact ? artifact.structure.maximumConditionNumber.toFixed(4) : "—"} tone="neutral" />
        </div>
      </header>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid min-h-[205px] place-items-center border border-violet-100/10 bg-black/30 p-3">
          <div className="relative h-40 w-40 rounded-full border border-violet-100/15 bg-[radial-gradient(circle,rgba(196,181,253,.09)_0_8%,transparent_9%_28%,rgba(94,234,212,.04)_29%_30%,transparent_31%_54%,rgba(196,181,253,.04)_55%_56%,transparent_57%)] shadow-[inset_0_0_32px_rgba(139,92,246,.06)]">
            {SPOKES.map((spoke) => (
              <span
                aria-hidden="true"
                key={spoke.index}
                className="absolute left-1/2 top-1/2 h-px origin-left bg-gradient-to-r from-violet-100/62 via-violet-100/26 to-transparent"
                style={{
                  width: `${spoke.length}%`,
                  transform: `rotate(${spoke.rotation}deg)`,
                }}
              />
            ))}
            <div className="absolute inset-[32%] grid place-items-center rounded-full border border-teal-100/16 bg-[#03080a]/92 text-center font-mono">
              <div>
                <div className="text-[18px] leading-none text-violet-100/78">12</div>
                <div className="mt-1 text-[5px] uppercase tracking-[.14em] text-white/30">
                  dark axes
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-teal-100/10 bg-teal-100/[.018] p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.15em] text-teal-100/42">
            synthetic mode decomposition
          </div>
          <div className="mt-2 space-y-2">
            {(artifact?.syntheticModeAudit.modes ?? []).map((mode) => (
              <ModeBar key={mode.modeId} mode={mode} />
            ))}
            {!artifact ? (
              <div className="border border-white/7 bg-black/24 px-2 py-4 font-mono text-[7px] uppercase tracking-[.12em] text-white/28">
                {phase === "loading"
                  ? "Resolving analytic projectors…"
                  : "Observability artifact unavailable"}
              </div>
            ) : null}
          </div>
          <div className="mt-3 border-l-2 border-amber-200/28 bg-amber-200/[.03] px-2 py-2 font-mono text-[6px] leading-relaxed text-amber-50/47">
            Fractions shown here belong only to the three synthetic v394 modes.
            No physical nuisance vector has been admitted or decomposed.
          </div>
        </div>
      </div>

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[84ch] text-violet-50/46">
          Null direction `[1, a, 0]` 只表达观测算子的结构性不可辨识：photon 与 redshift 的联合扰动可以保持条件温度不变。它不是先验分布，也不代表真实误差为零；Page–Thorne flux 不属于该暗方向。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-teal-100/42">
          structure qualified
          <br />
          physical modes absent
        </p>
      </footer>
    </section>
  );
}

function ModeBar({
  mode,
}: Readonly<{
  mode: KerrGlobalObservabilityArtifactV395["syntheticModeAudit"]["modes"][number];
}>) {
  return (
    <div className="border border-white/7 bg-black/28 p-2 font-mono">
      <div className="flex items-center justify-between gap-2 text-[6px]">
        <span className="truncate text-white/48">{mode.modeId}</span>
        <span className="text-violet-100/60">
          null {(mode.nullFraction * 100).toFixed(2)}%
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden bg-white/6">
        <span
          className="h-full bg-teal-200/45"
          style={{ width: `${mode.observableFraction * 100}%` }}
        />
        <span
          className="h-full bg-violet-200/58"
          style={{ width: `${mode.nullFraction * 100}%` }}
        />
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
  tone: "teal" | "violet" | "neutral";
}>) {
  const color =
    tone === "teal"
      ? "text-teal-100/67"
      : tone === "violet"
        ? "text-violet-100/69"
        : "text-white/52";
  return (
    <div className="min-w-[75px] bg-black/35 px-2 py-1.5">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/27">
        {label}
      </div>
      <div className={`mt-0.5 text-[9px] ${color}`}>{value}</div>
    </div>
  );
}
