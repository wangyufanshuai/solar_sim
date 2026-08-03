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
  parseMeasuredVisibleThroughputArtifactV383,
  type MeasuredVisibleThroughputArtifactV383,
} from "../lib/measuredVisibleThroughputV383";

export default function MeasuredVisibleThroughputSurfaceV383() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <Spectrophotometer />;
}

function Spectrophotometer() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v383-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredVisibleThroughputSurfaceV383",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredVisibleThroughputArtifactV383 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v383/visible-throughput", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v383-visible-throughput-unavailable");
        }
        return parseMeasuredVisibleThroughputArtifactV383(value.artifact);
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

  const metrics = artifact?.normalizedProfile.metrics;
  const pivotPosition = metrics
    ? ((metrics.pivotWavelengthAngstrom - 4000) / 3000) * 100
    : 50;
  const meanPosition = metrics
    ? ((metrics.throughputWeightedMeanWavelengthAngstrom - 4000) / 3000) * 100
    : 50;
  const style = {
    "--atlas-v383-grid": tokens.metrologyGridOpacity,
    "--atlas-v383-alert": tokens.authorityGateLuminance,
    "--atlas-v383-pivot": `${pivotPosition}%`,
    "--atlas-v383-mean": `${meanPosition}%`,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[radial-gradient(circle_at_58%_-20%,rgba(207,250,254,.12),transparent_42%),linear-gradient(112deg,rgba(3,12,14,.99),rgba(5,8,9,.99)_60%,rgba(13,9,3,.98))] p-3 text-[8px] text-white/56"
      data-atlas-visible-throughput-v383
      data-atlas-v383-phase={phase}
      data-atlas-v383-rows={metrics?.rowCount ?? "loading"}
      data-atlas-v383-dual-implementation={
        artifact?.dualImplementation.qualified ?? "loading"
      }
      data-atlas-v383-normalized-candidate="true"
      data-atlas-v383-authority="false"
      data-atlas-v383-observed-counts="false"
      data-atlas-v383-runtime-packaging="false"
      data-atlas-v383-science-buffer-mutation="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v383-grid)] [background-image:linear-gradient(90deg,rgba(207,250,254,.045)_1px,transparent_1px)] [background-size:10%_100%]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-cyan-100/42">
            v383 · dual-path spectrophotometer
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] font-light uppercase tracking-[.08em] text-cyan-50/90">
            Same photons. Independent arithmetic.
          </h3>
        </div>
        <div className="border-l border-cyan-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-cyan-100/58">
          {artifact
            ? `${artifact.candidate.rowCount.toLocaleString("en-US")} rows · A/B pass`
            : phase}
          <br />
          candidate only · authority open
        </div>
      </header>

      <div className="relative mt-4 px-1 pb-7 pt-4">
        <div className="h-[3px] bg-[linear-gradient(90deg,#7447d8_0%,#336ed9_18%,#38bdf8_34%,#5eead4_49%,#bef264_63%,#facc15_78%,#fb7185_100%)] opacity-70 shadow-[0_0_16px_rgba(103,232,249,.16)]" />
        <div
          className="absolute top-1 h-8 w-px bg-cyan-50/85 shadow-[0_0_10px_rgba(207,250,254,.55)]"
          style={{ left: "var(--atlas-v383-pivot)" }}
        >
          <span className="absolute -left-8 -top-3 w-16 text-center font-mono text-[5px] uppercase tracking-[.08em] text-cyan-50/66">
            pivot
          </span>
        </div>
        <div
          className="absolute top-3 h-5 w-px bg-amber-100/75"
          style={{ left: "var(--atlas-v383-mean)" }}
        >
          <span className="absolute -left-8 top-5 w-16 text-center font-mono text-[5px] uppercase tracking-[.08em] text-amber-100/55">
            weighted μ
          </span>
        </div>
        <span className="absolute bottom-0 left-0 font-mono text-[6px] text-white/36">
          400 nm
        </span>
        <span className="absolute bottom-0 right-0 font-mono text-[6px] text-white/36">
          700 nm
        </span>
      </div>

      {artifact ? (
        <div className="relative mt-2 grid gap-px bg-white/8 md:grid-cols-4">
          <Metric
            label="equivalent width"
            value={`${(metrics!.equivalentWidthAngstrom / 10).toFixed(6)} nm`}
          />
          <Metric
            label="pivot λ"
            value={`${(metrics!.pivotWavelengthAngstrom / 10).toFixed(6)} nm`}
          />
          <Metric
            label="mean throughput"
            value={metrics!.meanThroughput.toFixed(9)}
          />
          <Metric
            label="A/B max Δrel"
            value={artifact.dualImplementation.maximumMetricRelativeDifference.toExponential(3)}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[72ch] text-cyan-50/48">
          TypeScript float64 与 Python Decimal(50) 使用不同 XML parser 和积分实现；
          归一化 profile 不含插值。缺失 noise、collecting area、plate scale 与 matching geometry authority，故不得生成 measured electrons。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          source dossier 1/7
          <br />
          authority 0/3 · science payload unchanged
        </p>
      </footer>
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 text-[8px] text-cyan-50/68">{value}</div>
    </div>
  );
}
