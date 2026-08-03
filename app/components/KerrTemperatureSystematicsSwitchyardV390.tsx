"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  parseKerrTemperatureSystematicsTransferArtifactV390,
  type KerrTemperatureSystematicsTransferArtifactV390,
  type KerrTemperatureSystematicsTransferRowV390,
} from "../lib/kerrTemperatureSystematicsTransferV390";

const BAND_LABELS = Object.freeze({
  visible: "VISIBLE",
  euv: "EUV",
  "soft-x-ray": "SOFT X",
});

export default function KerrTemperatureSystematicsSwitchyardV390() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <SystematicsSwitchyard />;
}

function SystematicsSwitchyard() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v390-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrTemperatureSystematicsSwitchyardV390",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrTemperatureSystematicsTransferArtifactV390 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v390/systematics-transfer",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v390-systematics-transfer-unavailable");
        }
        return parseKerrTemperatureSystematicsTransferArtifactV390(
          value.artifact,
        );
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
  const rows = useMemo(
    () => artifact?.rows.filter((row) => row.rayIndex === 12) ?? [],
    [artifact],
  );
  const style = {
    "--atlas-v390-grid": tokens.metrologyGridOpacity,
    "--atlas-v390-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-orange-100/15 bg-[radial-gradient(circle_at_4%_10%,rgba(251,146,60,.12),transparent_26%),radial-gradient(circle_at_96%_88%,rgba(34,211,238,.08),transparent_32%),linear-gradient(125deg,#0b0703,#070807_58%,#02090b)] p-3 text-[8px] text-white/56"
      data-atlas-temperature-systematics-transfer-v390
      data-atlas-v390-phase={phase}
      data-atlas-v390-transfer-operator-qualified="true"
      data-atlas-v390-physical-systematic-vector-admitted="false"
      data-atlas-v390-covariance-projection="false"
      data-atlas-v390-unknown-systematics-zero="false"
      data-atlas-v390-rss="false"
      data-atlas-v390-confidence-interval="false"
      data-atlas-v390-absolute-temperature-authority="false"
      data-atlas-v390-science-payload-mutation="false"
      data-atlas-v390-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v390-grid)] [background-image:linear-gradient(90deg,rgba(254,215,170,.05)_1px,transparent_1px),linear-gradient(rgba(165,243,252,.03)_1px,transparent_1px)] [background-size:43px_100%,100%_21px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-orange-100/44">
            v390 · three-input / two-output log transfer
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.11em] text-orange-50/92">
            Systematics switchyard
          </h3>
          <p className="mt-1 max-w-[72ch] font-mono text-[6px] leading-relaxed text-white/34">
            The wiring is qualified. Physical covariance is not connected.
            Every open breaker remains an explicit unavailable input.
          </p>
        </div>
        <div className="border border-orange-100/12 bg-black/38 px-3 py-2 font-mono text-right">
          <div className="text-[6px] uppercase tracking-[.14em] text-white/28">
            operator state
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-orange-100/72">
            rank 2 · open bus
          </div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[1.25fr_.75fr]">
        <div className="border border-orange-100/10 bg-black/30 p-2.5">
          <div className="mb-2 grid grid-cols-[48px_1fr_1fr_1fr] gap-1 font-mono text-[6px] uppercase tracking-[.12em] text-orange-100/36">
            <span>band</span>
            <span>photon → T</span>
            <span>Kerr g → T</span>
            <span>PT flux → Tₛ</span>
          </div>
          {rows.map((row) => (
            <TransferRow key={row.bandId} row={row} />
          ))}
          {phase !== "ready" ? (
            <div className="border-t border-white/6 py-4 font-mono text-[7px] uppercase tracking-[.14em] text-white/30">
              {phase === "loading"
                ? "Tracing SHA-locked transfer bus…"
                : "Transfer operator unavailable"}
            </div>
          ) : null}
        </div>

        <div className="border border-cyan-100/10 bg-cyan-100/[.018] p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.15em] text-cyan-100/40">
            physical admission breakers
          </div>
          <div className="mt-2 space-y-1">
            <Breaker label="detector covariance" />
            <Breaker label="geometry model systematic" />
            <Breaker label="disk flux systematic" />
            <Breaker label="non-Planck spectrum" />
            <Breaker label="cross covariance" />
          </div>
          <div className="mt-3 border-l-2 border-orange-200/28 bg-orange-200/[.035] px-2 py-2 font-mono text-[6px] leading-relaxed text-orange-50/48">
            OPEN BUS：没有真实输入就不执行 covariance projection，不以零替代未知项，
            也不把导数验证步长解释为物理误差。
          </div>
        </div>
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="transfers" value={`${artifact.counts.transferCount} / 12`} />
          <Metric label="coefficients" value={String(artifact.counts.coefficientCount)} />
          <Metric
            label="max condition"
            value={artifact.maxima.conditionNumber.toFixed(4)}
          />
          <Metric
            label="Python Δ"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(3)}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[82ch] text-orange-50/46">
          已验证的是系统误差如何传播，而不是系统误差有多大。v389 的精确数值端点仍可用；
          绝对科学区间必须等待可追溯的探测器、几何、盘模型与光谱协方差。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-cyan-100/44">
          transfer qualified
          <br />
          covariance unavailable
        </p>
      </footer>
    </section>
  );
}

function TransferRow({
  row,
}: Readonly<{ row: KerrTemperatureSystematicsTransferRowV390 }>) {
  return (
    <div className="grid grid-cols-[48px_1fr_1fr_1fr] items-center gap-1 border-t border-white/6 py-2 first:border-t-0">
      <span className="font-mono text-[6px] tracking-[.08em] text-white/48">
        {BAND_LABELS[row.bandId]}
      </span>
      <GainCell value={row.transferMatrix[0][0]} tone="orange" />
      <GainCell value={row.transferMatrix[0][1]} tone="cyan" />
      <GainCell value={row.transferMatrix[1][2]} tone="amber" />
    </div>
  );
}

function GainCell({
  value,
  tone,
}: Readonly<{ value: number; tone: "orange" | "cyan" | "amber" }>) {
  const color =
    tone === "orange"
      ? "border-orange-100/14 text-orange-100/68"
      : tone === "cyan"
        ? "border-cyan-100/14 text-cyan-100/62"
        : "border-amber-100/14 text-amber-100/62";
  return (
    <div className={`relative overflow-hidden border bg-white/[.02] px-2 py-1.5 font-mono ${color}`}>
      <div className="absolute inset-y-0 left-0 w-[2px] bg-current opacity-40" />
      <div className="text-[8px]">{value.toFixed(6)}</div>
      <div className="mt-0.5 text-[5px] uppercase opacity-45">d ln / d ln</div>
    </div>
  );
}

function Breaker({ label }: Readonly<{ label: string }>) {
  return (
    <div className="grid grid-cols-[18px_1fr_auto] items-center gap-2 border-b border-white/6 py-1.5 font-mono text-[6px] uppercase tracking-[.08em]">
      <span className="relative block h-2 w-4 border border-red-100/18">
        <span className="absolute left-[2px] top-[-2px] h-px w-3 rotate-[-24deg] bg-red-100/48" />
      </span>
      <span className="text-white/36">{label}</span>
      <span className="text-red-100/48">unavailable</span>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-orange-50/68">
        {value}
      </div>
    </div>
  );
}
