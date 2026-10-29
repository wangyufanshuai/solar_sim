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
  parseKerrTemperatureTrustRegionArtifactV391,
  V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT,
  V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT,
  type KerrTemperatureTrustRegionArtifactV391,
  type KerrTemperatureTrustRegionRowV391,
} from "../lib/kerrTemperatureTrustRegionV391";

const BAND_LABELS = Object.freeze({
  visible: "VISIBLE",
  euv: "EUV",
  "soft-x-ray": "SOFT X",
});

export default function KerrTemperatureCurvatureRelayV391() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <CurvatureRelay />;
}

function CurvatureRelay() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v391-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrTemperatureCurvatureRelayV391",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrTemperatureTrustRegionArtifactV391 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v391/trust-region", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v391-trust-region-unavailable");
        }
        return parseKerrTemperatureTrustRegionArtifactV391(value.artifact);
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
    "--atlas-v391-grid": tokens.metrologyGridOpacity,
    "--atlas-v391-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-lime-100/15 bg-[radial-gradient(circle_at_88%_12%,rgba(163,230,53,.11),transparent_28%),radial-gradient(circle_at_8%_92%,rgba(14,165,233,.08),transparent_30%),linear-gradient(122deg,#050a02,#070907_58%,#02080c)] p-3 text-[8px] text-white/56"
      data-atlas-temperature-trust-region-v391
      data-atlas-v391-phase={phase}
      data-atlas-v391-analytic-curvature="true"
      data-atlas-v391-linear-trust-qualified="true"
      data-atlas-v391-quadratic-trust-qualified="true"
      data-atlas-v391-stress-grid-physical-uncertainty="false"
      data-atlas-v391-probability-content="false"
      data-atlas-v391-physical-systematic-vector-admitted="false"
      data-atlas-v391-covariance-projection="false"
      data-atlas-v391-absolute-temperature-authority="false"
      data-atlas-v391-science-payload-mutation="false"
      data-atlas-v391-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v391-grid)] [background-image:linear-gradient(90deg,rgba(217,249,157,.045)_1px,transparent_1px),linear-gradient(rgba(186,230,253,.035)_1px,transparent_1px)] [background-size:29px_100%,100%_23px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-lime-100/42">
            v391 · inverse-Planck curvature / exact replay
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-lime-50/92">
            Curvature relay
          </h3>
          <p className="mt-1 max-w-[72ch] font-mono text-[6px] leading-relaxed text-white/34">
            Linear transfer trips at the 0.3% trust boundary. The second-order
            relay remains qualified through the 1% validation radius.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/8 font-mono text-[6px] uppercase tracking-[.11em]">
          <TrustCell label="linear trust" value="0.003" tone="linear" />
          <TrustCell label="quadratic trust" value="0.010" tone="quadratic" />
          <TrustCell label="grid meaning" value="validation" tone="neutral" />
          <TrustCell label="probability" value="none" tone="neutral" />
        </div>
      </header>

      <div className="relative mt-3 space-y-2">
        {rows.map((row) => (
          <RelayTrace key={row.bandId} row={row} />
        ))}
        {phase !== "ready" ? (
          <div className="border border-white/7 bg-black/25 px-2 py-4 font-mono text-[7px] uppercase tracking-[.14em] text-white/30">
            {phase === "loading"
              ? "Replaying nonlinear transfer grid…"
              : "Curvature artifact unavailable"}
          </div>
        ) : null}
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="axis replay" value={String(artifact.counts.axisReplayCount)} />
          <Metric
            label="mixed corners"
            value={String(artifact.counts.mixedCornerReplayCount)}
          />
          <Metric
            label="max linear residual"
            value={artifact.maxima.linearAbsoluteLogResidual.toExponential(3)}
          />
          <Metric
            label="max quadratic residual"
            value={artifact.maxima.quadraticAbsoluteLogResidual.toExponential(3)}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[82ch] text-lime-50/46">
          可信半径只描述近似误差，不描述自然界参数的分布。物理 covariance、置信区间和绝对温度资格仍未建立；
          stress grid 不得进入 Science payload 的测量字段。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-sky-100/44">
          local model bounded
          <br />
          physical prior absent
        </p>
      </footer>
    </section>
  );
}

function RelayTrace({ row }: Readonly<{ row: KerrTemperatureTrustRegionRowV391 }>) {
  return (
    <div className="grid gap-2 border border-lime-100/9 bg-black/28 p-2 sm:grid-cols-[60px_1fr_72px] sm:items-end">
      <div className="font-mono">
        <div className="text-[7px] tracking-[.1em] text-white/52">
          {BAND_LABELS[row.bandId]}
        </div>
        <div className="mt-1 text-[5px] uppercase text-lime-100/32">
          κ {row.photonInverseLogCurvature.toExponential(2)}
        </div>
      </div>
      <div className="grid h-12 grid-cols-9 items-end gap-[2px] border-b border-white/10">
        {row.grid.map((entry) => {
          const linearHeight = Math.max(
            2,
            Math.min(
              100,
              (entry.maximumLinearAbsoluteLogResidual /
                V391_LINEAR_ABSOLUTE_LOG_RESIDUAL_LIMIT) *
                70,
            ),
          );
          const quadraticHeight = Math.max(
            2,
            Math.min(
              100,
              (entry.maximumQuadraticAbsoluteLogResidual /
                V391_QUADRATIC_ABSOLUTE_LOG_RESIDUAL_LIMIT) *
                70,
            ),
          );
          return (
            <div
              className="relative h-full"
              key={entry.logRadius}
              title={`δ=${entry.logRadius}; linear=${entry.maximumLinearAbsoluteLogResidual}; quadratic=${entry.maximumQuadraticAbsoluteLogResidual}`}
            >
              <div
                className="absolute bottom-0 left-[12%] w-[34%] bg-sky-200/42"
                style={{ height: `${linearHeight}%` }}
              />
              <div
                className="absolute bottom-0 right-[12%] w-[34%] bg-lime-200/58"
                style={{ height: `${quadraticHeight}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="font-mono text-right text-[6px] leading-relaxed">
        <div className="text-sky-100/52">L {row.linearTrustRadius.toFixed(3)}</div>
        <div className="text-lime-100/60">Q {row.quadraticTrustRadius.toFixed(3)}</div>
      </div>
    </div>
  );
}

function TrustCell({
  label,
  value,
  tone,
}: Readonly<{
  label: string;
  value: string;
  tone: "linear" | "quadratic" | "neutral";
}>) {
  const color =
    tone === "linear"
      ? "text-sky-100/62"
      : tone === "quadratic"
        ? "text-lime-100/68"
        : "text-white/42";
  return (
    <div className="min-w-[88px] bg-black/36 px-2 py-1.5">
      <div className="text-white/24">{label}</div>
      <div className={`mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-lime-50/68">{value}</div>
    </div>
  );
}
