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
  parseMeasuredVisibleSourceForensicV382R1,
  type MeasuredVisibleSourceForensicV382R1,
} from "../lib/measuredVisibleSourceForensicV382R1";

const CHANNELS = [
  "SVO profile",
  "ISR 2020",
  "ISR 2021",
  "Geometry",
  "Detector",
  "Spectral",
  "Terms",
] as const;

export default function MeasuredVisibleSourceForensicSurfaceV382R1() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <ForensicTapeDeck />;
}

function ForensicTapeDeck() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v382r1-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredVisibleSourceForensicSurfaceV382R1",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredVisibleSourceForensicV382R1 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v382/visible-source-forensic",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v382r1-visible-source-forensic-unavailable");
        }
        return parseMeasuredVisibleSourceForensicV382R1(value.artifact);
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
    "--atlas-v382-grid": tokens.metrologyGridOpacity,
    "--atlas-v382-alert": tokens.authorityGateLuminance,
    "--atlas-v382-scan": tokens.unavailableScanOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-amber-100/15 bg-[linear-gradient(108deg,rgba(5,13,14,.99),rgba(4,8,9,.99)_55%,rgba(25,11,3,.98))] p-3 text-[8px] text-white/56"
      data-atlas-visible-source-forensic-v382r1
      data-atlas-v382r1-phase={phase}
      data-atlas-v382r1-progress={
        artifact
          ? `${artifact.progress.qualifiedSourceCount}/${artifact.progress.plannedSourceCount}`
          : "loading"
      }
      data-atlas-v382r1-source-dossier="false"
      data-atlas-v382r1-authority="false"
      data-atlas-v382r1-runtime-packaging="false"
      data-atlas-v382r1-science-buffer-mutation="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v382-grid)] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_15px,rgba(254,243,199,.045)_16px)]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-amber-100/42">
            v382r1 · source tape forensic
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] font-light uppercase tracking-[.08em] text-amber-50/90">
            One reel recovered. Six remain sealed.
          </h3>
        </div>
        <div className="border-l border-amber-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-amber-100/58">
          {artifact
            ? `${artifact.progress.qualifiedSourceCount}/${artifact.progress.plannedSourceCount} source`
            : phase}
          <br />
          attempt 1 · failed · no retry
        </div>
      </header>

      <div className="relative mt-3 grid grid-cols-7 gap-1">
        {CHANNELS.map((channel, index) => {
          const recovered = index === 0 && artifact !== null;
          return (
            <div
              key={channel}
              className={`relative min-h-[70px] border px-1 py-2 text-center font-mono text-[6px] uppercase tracking-[.08em] ${
                recovered
                  ? "border-cyan-100/28 bg-cyan-300/[.055] text-cyan-50/72"
                  : "border-red-100/10 bg-red-300/[.025] text-red-100/30"
              }`}
            >
              <div
                aria-hidden="true"
                className={`mx-auto h-3 w-3 rounded-full border ${
                  recovered
                    ? "border-cyan-100/55 shadow-[0_0_16px_rgba(103,232,249,.28)]"
                    : "border-red-100/16"
                }`}
              />
              <div className="mt-2 leading-tight">{channel}</div>
              <div className="mt-1 text-[5px] tracking-[.06em]">
                {recovered ? "offline verified" : "not fetched"}
              </div>
            </div>
          );
        })}
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-2 border-y border-cyan-100/10 py-2 font-mono text-[7px] md:grid-cols-4">
          <Metric label="profile" value="HST · WFC3/UVIS1 · F350LP" />
          <Metric
            label="coverage"
            value={artifact.recoveredSource.profile.visibleCoverage400To700Nm ? "400–700 nm · yes" : "unavailable"}
          />
          <Metric
            label="rows"
            value={artifact.recoveredSource.profile.rowCount.toLocaleString("en-US")}
          />
          <Metric
            label="raw SHA"
            value={`${artifact.recoveredSource.sha256.slice(0, 12)}…`}
          />
        </div>
      ) : null}

      <footer className="relative mt-2 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[70ch] text-cyan-50/48">
          已落盘 profile 的 measured-QE 与 laboratory-throughput provenance 已离线恢复；
          原始失败证据不覆盖。六个剩余来源必须由新的显式授权恢复，不能从这一条 profile 推导 detector noise、geometry 或 measured counts。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          dossier unavailable
          <br />
          authority 0/3 · observed counts 0
        </p>
      </footer>
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 border-l border-white/10 pl-2">
      <div className="uppercase tracking-[.13em] text-white/28">{label}</div>
      <div className="mt-0.5 truncate text-cyan-50/66">{value}</div>
    </div>
  );
}
