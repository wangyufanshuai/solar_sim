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
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  type KerrPhotonSourceIdentifiabilityArtifactV387,
} from "../lib/kerrPhotonSourceIdentifiabilityV387";

const BAND_LABELS = Object.freeze({
  visible: "VISIBLE",
  euv: "EUV",
  "soft-x-ray": "SOFT X",
});

export default function KerrPhotonIdentifiabilitySurfaceV387() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <RankCollapseSpectrometer />;
}

function RankCollapseSpectrometer() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v387-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrPhotonIdentifiabilitySurfaceV387",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrPhotonSourceIdentifiabilityArtifactV387 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v387/photon-identifiability",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v387-photon-identifiability-unavailable");
        }
        return parseKerrPhotonSourceIdentifiabilityArtifactV387(value.artifact);
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
  const maximum = Math.max(
    Number.MIN_VALUE,
    ...rows.map((row) => row.logTemperatureSensitivity),
  );
  const style = {
    "--atlas-v387-grid": tokens.metrologyGridOpacity,
    "--atlas-v387-signal": tokens.authorityGateLuminance,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-sky-100/15 bg-[radial-gradient(ellipse_at_12%_0%,rgba(56,189,248,.1),transparent_34%),radial-gradient(ellipse_at_88%_100%,rgba(251,191,36,.07),transparent_32%),#030809] p-3 text-[8px] text-white/56"
      data-atlas-photon-identifiability-v387
      data-atlas-v387-phase={phase}
      data-atlas-v387-global-rank="1"
      data-atlas-v387-continuum-breaks-degeneracy="false"
      data-atlas-v387-covariance-validator="true"
      data-atlas-v387-covariance-pack="false"
      data-atlas-v387-uncertainty-projection="false"
      data-atlas-v387-measured-authority="false"
      data-atlas-v387-science-payload-mutation="false"
      data-atlas-v387-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v387-grid)] [background-image:linear-gradient(115deg,transparent_49.7%,rgba(186,230,253,.1)_50%,transparent_50.3%),linear-gradient(rgba(186,230,253,.035)_1px,transparent_1px)] [background-size:100%_100%,100%_18px]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-sky-100/42">
            v387 · three-band null-space audit
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.09em] text-sky-50/92">
            Rank-collapse spectrometer
          </h3>
        </div>
        <div className="border-l border-red-100/18 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-red-100/58">
          3 continuum bands
          <br />2 parameters · rank 1
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 md:grid-cols-[1.2fr_.8fr]">
        <div className="border border-sky-100/10 bg-black/30 p-2.5">
          <div className="grid grid-cols-[62px_1fr_1fr] gap-x-2 font-mono text-[6px] uppercase tracking-[.13em] text-sky-100/38">
            <span>band</span>
            <span>∂lnN / ∂lnT</span>
            <span>∂lnN / ∂lng</span>
            {rows.map((row) => {
              const width = Math.max(
                4,
                (row.logTemperatureSensitivity / maximum) * 100,
              );
              return (
                <div
                  className="col-span-3 grid grid-cols-[62px_1fr_1fr] items-center gap-x-2 border-t border-white/6 py-2"
                  key={row.bandId}
                >
                  <span className="text-[7px] text-white/50">
                    {BAND_LABELS[row.bandId]}
                  </span>
                  <ResponseRail width={width} value={row.logTemperatureSensitivity} />
                  <ResponseRail width={width} value={row.logRedshiftSensitivity} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-[62px_1fr] items-center gap-2 border-t border-sky-100/12 pt-2 font-mono text-[6px] uppercase tracking-[.11em]">
            <span className="text-white/30">null</span>
            <div className="relative h-[18px] overflow-hidden border border-red-100/12 bg-red-300/[.025]">
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-red-100/16" />
              <div className="absolute left-1/2 top-1/2 h-[30px] w-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-200/60 shadow-[0_0_10px_rgba(254,202,202,.28)]" />
              <div className="absolute inset-0 flex items-center justify-center text-red-50/52">
                δlnT = −δlng
              </div>
            </div>
          </div>
        </div>

        <div className="border border-amber-100/12 bg-amber-100/[.025] p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.15em] text-amber-100/42">
            14-pin covariance backplane
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, index) => (
              <div
                className="aspect-square rounded-full border border-amber-100/20 bg-black/50 shadow-[inset_0_0_0_2px_rgba(0,0,0,.7)]"
                key={index}
                title={
                  index < 12
                    ? `throughput bin ${index}`
                    : index === 12
                      ? "ln effective temperature"
                      : "ln redshift factor"
                }
              />
            ))}
          </div>
          <div className="mt-3 border-l-2 border-amber-100/26 bg-black/24 px-2 py-2">
            <div className="font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[13px] uppercase tracking-[.08em] text-amber-50/70">
              Validator armed · pack absent
            </div>
            <p className="m-0 mt-1 font-mono text-[6px] leading-relaxed text-amber-100/38">
              12×12 throughput、2×2 source 与 12×2 cross block 必须有限、对称且联合 PSD；省略 cross block 必须附独立性证据。
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-px bg-white/8 font-mono text-[6px] uppercase tracking-[.08em]">
            <StatusCell label="identity SHA" value="required" />
            <StatusCell label="projection" value="locked" />
            <StatusCell label="fixture" value="nonpublishable" />
            <StatusCell label="authority" value="withheld" />
          </div>
        </div>
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="measurements" value="12" />
          <Metric label="global rank" value="1 / 2" />
          <Metric
            label="Python oracle Δrel"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(
              3,
            )}
          />
          <Metric
            label="artifact SHA"
            value={`${artifact.artifactSha256.slice(0, 16)}…`}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[78ch] text-sky-50/48">
          Liouville 不变量下，g³Bν(ν/g,T)=Bν(ν,gT)。因此更多纯 Planck 连续谱波段仍无法独立恢复 T 与 g；必须引入独立先验、静止系谱线或非 Planck 物理。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          more bands ≠ more rank
          <br />
          no covariance · no uncertainty
        </p>
      </footer>
    </section>
  );
}

function ResponseRail({
  width,
  value,
}: Readonly<{ width: number; value: number }>) {
  return (
    <div className="relative h-[14px] overflow-hidden border border-sky-100/8 bg-white/[.025]">
      <div
        className="absolute inset-y-0 left-0 border-r border-sky-50/70 bg-[linear-gradient(90deg,rgba(14,165,233,.06),rgba(125,211,252,.38))]"
        style={{ width: `${width}%` }}
      />
      <span className="absolute inset-y-0 right-1 flex items-center text-[5px] text-sky-50/52">
        {value.toFixed(6)}
      </span>
    </div>
  );
}

function StatusCell({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/34 px-2 py-2">
      <div className="text-white/26">{label}</div>
      <div className="mt-1 text-amber-100/58">{value}</div>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-sky-50/68">
        {value}
      </div>
    </div>
  );
}
