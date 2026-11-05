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
  parseKerrPhysicalCovarianceAdmissionArtifactV392,
  type KerrPhysicalCovarianceAdmissionArtifactV392,
} from "../lib/kerrPhysicalCovarianceAdmissionV392";

const INTERLOCKS = Object.freeze([
  ["SOURCE", "SHA + identity"],
  ["ORDER", "3 inputs locked"],
  ["FINITE", "12 matrices"],
  ["SYMMETRY", "C = Cᵀ"],
  ["PSD", "λmin ≥ 0"],
  ["CROSS", "evidence required"],
] as const);

export default function KerrCovarianceInterlockV392() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <CovarianceInterlock />;
}

function CovarianceInterlock() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v392-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrCovarianceInterlockV392",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrPhysicalCovarianceAdmissionArtifactV392 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v392/covariance-admission", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v392-covariance-admission-unavailable");
        }
        return parseKerrPhysicalCovarianceAdmissionArtifactV392(value.artifact);
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
    "--atlas-v392-grid": tokens.metrologyGridOpacity,
    "--atlas-v392-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-rose-100/15 bg-[radial-gradient(circle_at_82%_18%,rgba(244,63,94,.10),transparent_26%),radial-gradient(circle_at_14%_88%,rgba(250,204,21,.065),transparent_30%),linear-gradient(126deg,#0b0305,#080707_56%,#090702)] p-3 text-[8px] text-white/56"
      data-atlas-covariance-interlock-v392
      data-atlas-v392-phase={phase}
      data-atlas-v392-validator-qualified="true"
      data-atlas-v392-physical-pack-available="false"
      data-atlas-v392-production-projection="false"
      data-atlas-v392-unknown-systematics-zero="false"
      data-atlas-v392-missing-cross-imputed-independent="false"
      data-atlas-v392-probability-content="false"
      data-atlas-v392-absolute-temperature-authority="false"
      data-atlas-v392-science-payload-mutation="false"
      data-atlas-v392-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v392-grid)] [background-image:linear-gradient(90deg,rgba(254,202,202,.04)_1px,transparent_1px),linear-gradient(rgba(253,224,71,.025)_1px,transparent_1px)] [background-size:37px_100%,100%_19px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-rose-100/44">
            v392 · physical covariance admission / fail closed
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-rose-50/92">
            Covariance interlock
          </h3>
          <p className="mt-1 max-w-[74ch] font-mono text-[6px] leading-relaxed text-white/35">
            The projection engine is armed only after source, ordering, matrix,
            and cross-covariance evidence agree. No physical pack is connected.
          </p>
        </div>
        <div className="border border-rose-100/12 bg-black/38 px-3 py-2 font-mono text-right">
          <div className="text-[6px] uppercase tracking-[.15em] text-white/28">
            production bus
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[.13em] text-rose-100/68">
            isolated · projection off
          </div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[1.35fr_.65fr]">
        <div className="relative border border-rose-100/10 bg-black/30 p-2.5">
          <div
            aria-hidden="true"
            className="absolute left-[8%] right-[8%] top-[35px] h-px bg-gradient-to-r from-transparent via-rose-100/22 to-transparent"
          />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
            {INTERLOCKS.map(([label, detail], index) => (
              <div
                key={label}
                className="relative min-h-[55px] border border-rose-100/12 bg-[#090405]/90 px-2 py-2 font-mono"
              >
                <span className="absolute -top-[3px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rotate-45 border border-rose-100/35 bg-[#0a0305]" />
                <div className="text-[6px] tracking-[.14em] text-rose-100/58">
                  {String(index + 1).padStart(2, "0")} / {label}
                </div>
                <div className="mt-2 text-[6px] leading-tight text-white/38">
                  {detail}
                </div>
                <div className="mt-1 text-[5px] uppercase tracking-[.12em] text-amber-100/48">
                  validator armed
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 font-mono text-[6px] uppercase tracking-[.11em]">
            <span className="text-white/28">J · C · Jᵀ projection channel</span>
            <span className="text-rose-100/60">physical input unavailable</span>
          </div>
        </div>

        <div className="border border-amber-100/10 bg-amber-100/[.018] p-2.5 font-mono">
          <div className="text-[6px] uppercase tracking-[.15em] text-amber-100/42">
            adversarial rack
          </div>
          <div className="mt-2 grid grid-cols-2 gap-px bg-white/7">
            <Metric
              label="rejected"
              value={artifact ? `${artifact.validator.rejectedAdversarialFixtureCount}/6` : "—"}
              tone="rose"
            />
            <Metric
              label="control"
              value={artifact ? `${artifact.validator.acceptedControlFixtureCount}/1` : "—"}
              tone="amber"
            />
            <Metric
              label="self-test rows"
              value={artifact ? String(artifact.selfTest.projectedRowCount) : "—"}
              tone="neutral"
            />
            <Metric
              label="Python Δ"
              value={
                artifact
                  ? artifact.selfTest.maximumPythonOracleRelativeDifference.toExponential(2)
                  : "—"
              }
              tone="neutral"
            />
          </div>
          <div className="mt-2 border-l-2 border-rose-200/30 bg-rose-200/[.035] px-2 py-2 text-[6px] leading-relaxed text-rose-50/48">
            Synthetic control proves only the validator and projection primitive.
            It is nonpublishable and carries no physical probability content.
          </div>
        </div>
      </div>

      {phase !== "ready" ? (
        <div className="relative mt-2 border border-white/7 bg-black/25 px-2 py-3 font-mono text-[7px] uppercase tracking-[.14em] text-white/30">
          {phase === "loading"
            ? "Checking covariance interlock…"
            : "Covariance admission artifact unavailable"}
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[84ch] text-rose-50/46">
          验证器已经证明错误的 SHA、顺序、非对称矩阵、负特征值、缺失交叉块和伪装成可发布结果的合成数据都会被拒绝。真实物理协方差尚未提供，因此不执行生产投影，不生成置信区间，也不授予绝对温度权威。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-amber-100/43">
          validator qualified
          <br />
          measurement absent
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
  tone: "rose" | "amber" | "neutral";
}>) {
  const color =
    tone === "rose"
      ? "text-rose-100/68"
      : tone === "amber"
        ? "text-amber-100/64"
        : "text-white/52";
  return (
    <div className="bg-black/34 px-2 py-2">
      <div className="text-[5px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className={`mt-0.5 truncate text-[8px] ${color}`}>{value}</div>
    </div>
  );
}
