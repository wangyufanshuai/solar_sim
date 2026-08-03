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
  parseKerrGlobalCovariancePropagationArtifactV394,
  type KerrGlobalCovariancePropagationArtifactV394,
} from "../lib/kerrGlobalCovariancePropagationV394";

const CELLS = Object.freeze(
  Array.from({ length: 144 }, (_, index) => {
    const row = Math.floor(index / 12);
    const column = index % 12;
    const diagonal = row === column;
    const sharedRay = Math.floor(row / 3) === Math.floor(column / 3);
    const modeSignal = ((row * 5 + column * 7) % 11) / 10;
    return Object.freeze({ row, column, diagonal, sharedRay, modeSignal });
  }),
);

export default function KerrCovarianceLatticeV394() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <CovarianceLattice />;
}

function CovarianceLattice() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v394-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrCovarianceLatticeV394",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrGlobalCovariancePropagationArtifactV394 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v394/global-covariance", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v394-global-covariance-unavailable");
        }
        return parseKerrGlobalCovariancePropagationArtifactV394(value.artifact);
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
    "--atlas-v394-grid": tokens.metrologyGridOpacity,
    "--atlas-v394-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-indigo-100/15 bg-[radial-gradient(circle_at_84%_16%,rgba(129,140,248,.12),transparent_26%),radial-gradient(circle_at_12%_88%,rgba(34,211,238,.07),transparent_30%),linear-gradient(126deg,#03040b,#06070a_58%,#02090a)] p-3 text-[8px] text-white/56"
      data-atlas-covariance-lattice-v394
      data-atlas-v394-phase={phase}
      data-atlas-v394-global-infrastructure-qualified="true"
      data-atlas-v394-input-dimension="36"
      data-atlas-v394-output-dimension="24"
      data-atlas-v394-physical-global-covariance="false"
      data-atlas-v394-production-propagation="false"
      data-atlas-v394-block-independence-assumed="false"
      data-atlas-v394-missing-cross-row-zero="false"
      data-atlas-v394-probability-content="false"
      data-atlas-v394-science-payload-mutation="false"
      data-atlas-v394-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v394-grid)] [background-image:linear-gradient(90deg,rgba(199,210,254,.04)_1px,transparent_1px),linear-gradient(rgba(165,243,252,.025)_1px,transparent_1px)] [background-size:23px_100%,100%_23px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-indigo-100/46">
            v394 · 36 input covariance / 24 output propagation
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-indigo-50/92">
            Covariance lattice
          </h3>
          <p className="mt-1 max-w-[75ch] font-mono text-[6px] leading-relaxed text-white/35">
            A block Jacobian carries explicit cross-ray and cross-band nuisance
            modes into the 24-dimensional output covariance.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/8 font-mono">
          <Metric label="input space" value="36" tone="indigo" />
          <Metric label="output space" value="24" tone="cyan" />
          <Metric label="input C" value="1,296" tone="neutral" />
          <Metric label="output C" value="576" tone="neutral" />
        </div>
      </header>

      <div className="relative mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="border border-indigo-100/10 bg-black/30 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[6px] uppercase tracking-[.12em]">
            <span className="text-indigo-100/45">synthetic mode topology · 12 × 12 blocks</span>
            <span className="text-amber-100/48">validation only</span>
          </div>
          <div className="grid aspect-[1.9/1] grid-cols-12 gap-[2px] border border-white/7 bg-[#020309] p-1.5">
            {CELLS.map((cell) => {
              const opacity = cell.diagonal
                ? 0.78
                : cell.sharedRay
                  ? 0.34
                  : 0.08 + cell.modeSignal * 0.16;
              const color = cell.diagonal
                ? "rgb(165 180 252)"
                : cell.sharedRay
                  ? "rgb(103 232 249)"
                  : "rgb(129 140 248)";
              return (
                <span
                  aria-hidden="true"
                  key={`${cell.row}:${cell.column}`}
                  className="min-h-[3px] border border-white/[.025]"
                  style={{ backgroundColor: color, opacity }}
                />
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[5px] uppercase tracking-[.09em] text-white/30">
            <span>mode 01 · detector gain</span>
            <span className="text-center">mode 02 · frame</span>
            <span className="text-right">mode 03 · disk tilt</span>
          </div>
        </div>

        <div className="border border-cyan-100/10 bg-cyan-100/[.018] p-2.5 font-mono">
          <div className="text-[6px] uppercase tracking-[.15em] text-cyan-100/42">
            propagation audit
          </div>
          <div className="mt-2 space-y-1.5">
            <AuditRow label="base blocks" value="12 / 12" ready />
            <AuditRow label="synthetic modes" value={artifact ? String(artifact.selfTest.nuisanceModeCount) : "—"} ready />
            <AuditRow label="adversarial" value={artifact ? `${artifact.validator.rejectedAdversarialFixtureCount}/9` : "—"} ready />
            <AuditRow label="physical modes" value="unavailable" ready={false} />
            <AuditRow label="production output" value="not run" ready={false} />
          </div>
          <div className="mt-3 border-l-2 border-indigo-200/28 bg-indigo-200/[.035] px-2 py-2 text-[6px] leading-relaxed text-indigo-50/48">
            The heat lattice depicts only the deterministic validator fixture.
            It is never exposed as a measured covariance or Science payload.
          </div>
        </div>
      </div>

      {phase !== "ready" ? (
        <div className="relative mt-2 border border-white/7 bg-black/25 px-2 py-3 font-mono text-[7px] uppercase tracking-[.14em] text-white/30">
          {phase === "loading"
            ? "Assembling global covariance lattice…"
            : "Global covariance artifact unavailable"}
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[84ch] text-indigo-50/46">
          当前只证明跨 ray、跨波段相关结构能够以低秩模式进入 36×36 covariance，并经 block Jacobian 传播到 24×24 输出。没有真实全局系统误差模型，因此不假设各块独立、不补零、不生成置信区间。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-cyan-100/42">
          propagation qualified
          <br />
          physical lattice absent
        </p>
      </footer>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: Readonly<{
  label: string;
  value: string;
  tone: "indigo" | "cyan" | "neutral";
}>) {
  const color =
    tone === "indigo"
      ? "text-indigo-100/68"
      : tone === "cyan"
        ? "text-cyan-100/64"
        : "text-white/51";
  return (
    <div className="min-w-[74px] bg-black/35 px-2 py-1.5">
      <div className="text-[5px] uppercase tracking-[.1em] text-white/26">
        {label}
      </div>
      <div className={`mt-0.5 text-[9px] ${color}`}>{value}</div>
    </div>
  );
}

function AuditRow({
  label,
  value,
  ready,
}: Readonly<{ label: string; value: string; ready: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/6 pb-1.5 text-[6px] uppercase tracking-[.08em]">
      <span className="text-white/33">{label}</span>
      <span className={ready ? "text-cyan-100/57" : "text-amber-100/49"}>
        {value}
      </span>
    </div>
  );
}
