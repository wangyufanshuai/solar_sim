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
  parseKerrGeometryConditionedTemperatureArtifactV388,
  type KerrGeometryConditionedTemperatureArtifactV388,
} from "../lib/kerrGeometryConditionedTemperatureV388";

const BAND_LABELS = Object.freeze({
  visible: "VISIBLE",
  euv: "EUV",
  "soft-x-ray": "SOFT X",
});

export default function KerrGeometryConditionedTemperatureSurfaceV388() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <GeodesicPriorKey />;
}

function GeodesicPriorKey() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v388-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrGeometryConditionedTemperatureSurfaceV388",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrGeometryConditionedTemperatureArtifactV388 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v388/conditioned-temperature",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v388-conditioned-temperature-unavailable");
        }
        return parseKerrGeometryConditionedTemperatureArtifactV388(
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
    "--atlas-v388-grid": tokens.metrologyGridOpacity,
    "--atlas-v388-signal": tokens.authorityGateLuminance,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-emerald-100/15 bg-[radial-gradient(circle_at_15%_18%,rgba(52,211,153,.1),transparent_27%),linear-gradient(117deg,#020908,#030707_60%,#130b02)] p-3 text-[8px] text-white/56"
      data-atlas-conditioned-temperature-v388
      data-atlas-v388-phase={phase}
      data-atlas-v388-spectral-rank="1"
      data-atlas-v388-conditioned-rank="2"
      data-atlas-v388-conditional-replay="true"
      data-atlas-v388-absolute-temperature-authority="false"
      data-atlas-v388-rss="false"
      data-atlas-v388-unknown-as-zero="false"
      data-atlas-v388-science-payload-mutation="false"
      data-atlas-v388-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v388-grid)] [background-image:linear-gradient(90deg,rgba(167,243,208,.045)_1px,transparent_1px),linear-gradient(rgba(167,243,208,.035)_1px,transparent_1px)] [background-size:31px_100%,100%_19px]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-emerald-100/42">
            v388 · dual-formulation geodesic prior
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.09em] text-emerald-50/92">
            Geodesic prior key
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.12em]">
          <RankBadge label="spectrum" rank="1" tone="locked" />
          <span className="text-emerald-100/30">+</span>
          <RankBadge label="Kerr g" rank="1" tone="key" />
          <span className="text-emerald-100/30">→</span>
          <RankBadge label="joint" rank="2" tone="open" />
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 md:grid-cols-[1.25fr_.75fr]">
        <div className="border border-emerald-100/10 bg-black/30 p-2.5">
          <div className="grid grid-cols-[58px_1fr_1fr] gap-x-2 font-mono text-[6px] uppercase tracking-[.13em] text-emerald-100/38">
            <span>band</span>
            <span>Carter T</span>
            <span>KS T</span>
            {rows.map((row) => (
              <div
                className="col-span-3 grid grid-cols-[58px_1fr_1fr] items-center gap-x-2 border-t border-white/6 py-2"
                key={row.bandId}
              >
                <span className="text-[7px] text-white/48">
                  {BAND_LABELS[row.bandId]}
                </span>
                <TemperatureReadout
                  value={row.conditionedTemperatureCarterK}
                  reference={row.sourceEffectiveTemperatureK}
                />
                <TemperatureReadout
                  value={row.conditionedTemperatureKerrSchildK}
                  reference={row.sourceEffectiveTemperatureK}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 border-t border-emerald-100/10 pt-2 font-mono text-[6px] uppercase tracking-[.09em] text-emerald-50/42">
            <span>ln T = ln(gT) − ln g</span>
            <span>12 monotonic inversions</span>
            <span>dual geometry retained</span>
          </div>
        </div>

        <div className="border border-red-100/12 bg-red-200/[.02] p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.15em] text-red-100/42">
            qualification split
          </div>
          <div className="mt-3 space-y-1.5">
            <GateLine label="conditional replay" state="qualified" tone="pass" />
            <GateLine label="augmented rank" state="2 / 2" tone="pass" />
            <GateLine label="geometry model systematic" state="missing" tone="stop" />
            <GateLine label="disk model systematic" state="missing" tone="stop" />
            <GateLine label="detector covariance" state="missing" tone="stop" />
          </div>
          <div className="mt-3 border border-dashed border-red-100/16 p-2 font-mono text-[6px] leading-relaxed text-red-100/40">
            数值退化已解除，但绝对温度权威仍被物理模型与测量协方差阻断。已知分量线性相加，不使用 RSS。
          </div>
        </div>
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="inversions" value="12 / 12" />
          <Metric
            label="temperature replay Δrel"
            value={artifact.maxima.temperatureReplayRelativeDifference.toExponential(
              3,
            )}
          />
          <Metric
            label="known numerical upper"
            value={artifact.maxima.knownNumericalUpperBoundRelative.toExponential(
              3,
            )}
          />
          <Metric
            label="Python oracle Δrel"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(
              3,
            )}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[78ch] text-emerald-50/48">
          v296 Kerr redshift 与光子连续谱来自独立计算路径，因此能够在冻结 Page–Thorne/Planck 模型内条件化恢复有效温度；该 replay 不等同于真实仪器测温。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          computationally identifiable
          <br />
          scientifically incomplete
        </p>
      </footer>
    </section>
  );
}

function RankBadge({
  label,
  rank,
  tone,
}: Readonly<{ label: string; rank: string; tone: "locked" | "key" | "open" }>) {
  const color =
    tone === "open"
      ? "border-emerald-100/25 text-emerald-100/72"
      : tone === "key"
        ? "border-amber-100/20 text-amber-100/62"
        : "border-red-100/16 text-red-100/48";
  return (
    <div className={`border px-2 py-1 text-center ${color}`}>
      <div className="text-[5px] opacity-60">{label}</div>
      <div className="text-[10px]">R{rank}</div>
    </div>
  );
}

function TemperatureReadout({
  value,
  reference,
}: Readonly<{ value: number; reference: number }>) {
  const relative = Math.abs(value - reference) / reference;
  return (
    <div className="relative overflow-hidden border border-emerald-100/9 bg-white/[.025] px-2 py-1.5">
      <div className="text-[8px] text-emerald-50/66">
        {(value / 1e3).toFixed(3)} kK
      </div>
      <div className="mt-0.5 text-[5px] text-white/26">
        Δ {relative.toExponential(2)}
      </div>
    </div>
  );
}

function GateLine({
  label,
  state,
  tone,
}: Readonly<{ label: string; state: string; tone: "pass" | "stop" }>) {
  return (
    <div className="flex items-center justify-between border-b border-white/6 py-1.5 font-mono text-[6px] uppercase tracking-[.08em]">
      <span className="text-white/35">{label}</span>
      <span className={tone === "pass" ? "text-emerald-100/64" : "text-red-100/52"}>
        {state}
      </span>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-emerald-50/68">
        {value}
      </div>
    </div>
  );
}
