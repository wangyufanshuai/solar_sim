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
  parseKerrConditionalTemperatureIntervalArtifactV389,
  type ConditionalTemperatureIntervalRowV389,
  type KerrConditionalTemperatureIntervalArtifactV389,
} from "../lib/kerrConditionalTemperatureIntervalV389";

const BAND_LABELS = Object.freeze({
  visible: "VISIBLE",
  euv: "EUV",
  "soft-x-ray": "SOFT X",
});

export default function KerrConditionalTemperatureIntervalSurfaceV389() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <IntervalLoom />;
}

function IntervalLoom() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v389-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrConditionalTemperatureIntervalSurfaceV389",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrConditionalTemperatureIntervalArtifactV389 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v389/temperature-interval",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v389-temperature-interval-unavailable");
        }
        return parseKerrConditionalTemperatureIntervalArtifactV389(
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
    "--atlas-v389-grid": tokens.metrologyGridOpacity,
    "--atlas-v389-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[radial-gradient(ellipse_at_92%_5%,rgba(103,232,249,.11),transparent_31%),radial-gradient(ellipse_at_4%_92%,rgba(251,191,36,.08),transparent_29%),linear-gradient(123deg,#02090b,#05080a_58%,#100b03)] p-3 text-[8px] text-white/56"
      data-atlas-conditional-temperature-interval-v389
      data-atlas-v389-phase={phase}
      data-atlas-v389-exact-endpoint-propagation="true"
      data-atlas-v389-confidence-interval="false"
      data-atlas-v389-probability-content="false"
      data-atlas-v389-absolute-temperature-authority="false"
      data-atlas-v389-rss="false"
      data-atlas-v389-science-payload-mutation="false"
      data-atlas-v389-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v389-grid)] [background-image:linear-gradient(90deg,rgba(165,243,252,.055)_1px,transparent_1px),linear-gradient(rgba(165,243,252,.035)_1px,transparent_1px)] [background-size:37px_100%,100%_17px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.26em] text-cyan-100/42">
            v389 · exact nonlinear endpoint propagation
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-cyan-50/92">
            Interval loom
          </h3>
          <p className="mt-1 max-w-[68ch] font-mono text-[6px] leading-relaxed text-white/34">
            Photon radius → monotonic gT inversion → positive interval division
            by Kerr g. Page–Thorne flux follows a separate fourth-root thread.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/8 font-mono text-[6px] uppercase tracking-[.11em]">
          <BoundaryCell label="confidence" value="none" tone="stop" />
          <BoundaryCell label="probability" value="none" tone="stop" />
          <BoundaryCell label="endpoint gate" value="qualified" tone="pass" />
          <BoundaryCell label="absolute T" value="withheld" tone="stop" />
        </div>
      </header>

      <div className="relative mt-3 border-y border-cyan-100/10 bg-black/28">
        <div className="grid grid-cols-[52px_1fr_70px] gap-2 border-b border-white/7 px-2 py-1.5 font-mono text-[6px] uppercase tracking-[.13em] text-cyan-100/35">
          <span>band</span>
          <span>independent interval threads</span>
          <span className="text-right">radius</span>
        </div>
        {rows.map((row) => (
          <IntervalRow key={row.bandId} row={row} />
        ))}
        {phase !== "ready" ? (
          <div className="px-2 py-4 font-mono text-[7px] uppercase tracking-[.14em] text-white/32">
            {phase === "loading"
              ? "Reading SHA-locked local evidence…"
              : "Interval artifact unavailable"}
          </div>
        ) : null}
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="intervals" value={`${artifact.counts.intervalCount} / 12`} />
          <Metric
            label="overlap"
            value={`${artifact.counts.overlapCount} / ${artifact.counts.intervalCount}`}
          />
          <Metric
            label="max numerical radius"
            value={artifact.maxima.conditionedTemperatureNumericalRelativeRadius.toExponential(
              3,
            )}
          />
          <Metric
            label="Python Δ"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(3)}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[80ch] text-cyan-50/46">
          两条细线仅表示冻结数值链和 Page–Thorne 模型内的确定性端点范围。
          探测器协方差、几何物理系统误差与非 Planck 光谱系统误差尚不可用，
          因此不赋予置信度、概率覆盖或绝对温度资格。
        </p>
        <p className="m-0 border-l border-amber-100/18 pl-3 text-right uppercase tracking-[.12em] text-amber-100/48">
          exact endpoints
          <br />
          incomplete physics
        </p>
      </footer>
    </section>
  );
}

function IntervalRow({ row }: Readonly<{ row: ConditionalTemperatureIntervalRowV389 }>) {
  const numericalPpm = row.conditionedTemperatureNumericalRelativeRadius * 1e6;
  const modelPpm = row.sourceModelTemperatureRelativeRadius * 1e6;
  const numericalWidth = Math.max(5, Math.min(45, numericalPpm * 35));
  const modelWidth = Math.max(5, Math.min(45, modelPpm * 35));
  return (
    <div className="grid grid-cols-[52px_1fr_70px] items-center gap-2 border-b border-white/6 px-2 py-2 last:border-b-0">
      <span className="font-mono text-[7px] tracking-[.08em] text-white/52">
        {BAND_LABELS[row.bandId]}
      </span>
      <div className="space-y-1.5">
        <IntervalRail
          label="NUM"
          width={numericalWidth}
          tone="cyan"
          title={`Numerical ${row.conditionedTemperatureNumericalIntervalK.lower.toFixed(5)}–${row.conditionedTemperatureNumericalIntervalK.upper.toFixed(5)} K`}
        />
        <IntervalRail
          label="PT"
          width={modelWidth}
          tone="amber"
          title={`Page–Thorne ${row.sourceModelTemperatureIntervalK.lower.toFixed(5)}–${row.sourceModelTemperatureIntervalK.upper.toFixed(5)} K`}
        />
      </div>
      <div className="text-right font-mono text-[6px] leading-relaxed">
        <div className="text-cyan-100/58">{numericalPpm.toFixed(3)} ppm</div>
        <div className="text-amber-100/52">{modelPpm.toFixed(3)} ppm</div>
      </div>
    </div>
  );
}

function IntervalRail({
  label,
  width,
  tone,
  title,
}: Readonly<{
  label: string;
  width: number;
  tone: "cyan" | "amber";
  title: string;
}>) {
  const rail = tone === "cyan" ? "bg-cyan-100/55" : "bg-amber-100/48";
  const text = tone === "cyan" ? "text-cyan-100/38" : "text-amber-100/38";
  return (
    <div className="grid grid-cols-[25px_1fr] items-center gap-1.5" title={title}>
      <span className={`font-mono text-[5px] tracking-[.12em] ${text}`}>{label}</span>
      <div className="relative h-[5px] bg-white/[.035]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/35" />
        <div
          className={`absolute left-1/2 top-[1px] h-[3px] -translate-x-1/2 ${rail}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function BoundaryCell({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone: "pass" | "stop" }>) {
  return (
    <div className="min-w-[82px] bg-black/36 px-2 py-1.5">
      <div className="text-white/25">{label}</div>
      <div className={tone === "pass" ? "mt-0.5 text-cyan-100/68" : "mt-0.5 text-amber-100/58"}>
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-cyan-50/68">
        {value}
      </div>
    </div>
  );
}
