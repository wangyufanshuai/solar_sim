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
  parseMeasuredAuthorityReadinessMatrixV379,
  type MeasuredAuthorityReadinessEntryV379,
  type MeasuredAuthorityReadinessMatrixV379,
} from "../lib/measuredAuthorityReadinessV379";

export default function MeasuredAuthorityReadinessSurfaceV379() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v379-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredAuthorityReadinessSurfaceV379",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const [artifact, setArtifact] = useState<MeasuredAuthorityReadinessMatrixV379 | null>(
    null,
  );
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v379/measured-authority-readiness",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v379-readiness-unavailable");
        }
        return parseMeasuredAuthorityReadinessMatrixV379(value.artifact);
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
  const groups = useMemo(
    () => ({
      detector: artifact?.entries.filter((entry) => entry.lane === "detector") ?? [],
      geometry: artifact?.entries.filter((entry) => entry.lane === "geometry") ?? [],
    }),
    [artifact],
  );
  const style = {
    "--atlas-v379-grid": tokens.metrologyGridOpacity,
    "--atlas-v379-rail": tokens.shaRailOpacity,
    "--atlas-v379-alert": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-amber-100/14 bg-[linear-gradient(132deg,rgba(3,15,19,.98),rgba(5,9,13,.99)_52%,rgba(24,13,3,.97))] p-3 text-[8px] text-white/55"
      data-atlas-measured-authority-readiness-v379
      data-atlas-v379-phase={phase}
      data-atlas-v379-contracts={artifact?.schemaContractQualifiedCount ?? "loading"}
      data-atlas-v379-present-inputs={artifact?.presentInputCount ?? "loading"}
      data-atlas-v379-automatic-promotion="false"
      data-atlas-v379-science-buffer-mutation="false"
      data-atlas-v379-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v379-grid)] [background-image:linear-gradient(rgba(207,250,254,.05)_1px,transparent_1px)] [background-size:100%_17px]"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-cyan-100/40">
            v379 · qualification breakers
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','Arial_Narrow',sans-serif] text-[17px] font-light uppercase tracking-[.09em] text-cyan-50/88">
            Contract ready / authority open
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-white/[.07] bg-white/[.07] font-mono text-[7px]">
          <Metric label="contracts" value={artifact ? `${artifact.schemaContractQualifiedCount}/7` : phase} />
          <Metric label="measured inputs" value={artifact ? `${artifact.presentInputCount}/7` : phase} warning />
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-2">
        <BreakerBank label="Detector chain" entries={groups.detector} phase={phase} />
        <BreakerBank label="Geometry chain" entries={groups.geometry} phase={phase} />
      </div>

      <div className="relative mt-2 grid gap-px overflow-hidden rounded border border-amber-100/10 bg-amber-100/10 sm:grid-cols-3">
        <Impact label="v375 envelope" value="WITHHELD" />
        <Impact label="v376 science image" value="WITHHELD" />
        <Impact label="observed counts" value="UNAVAILABLE" />
      </div>
      <div className="relative mt-2 flex flex-wrap justify-between gap-2 border-t border-white/[.06] pt-2 font-mono text-[7px] text-white/32">
        <span>file SHA + canonical SHA + instrument identity + independent validation</span>
        <span className="text-amber-100/[var(--atlas-v379-alert)]">
          contract qualification never grants measured authority
        </span>
      </div>
    </section>
  );
}

function BreakerBank({
  label,
  entries,
  phase,
}: Readonly<{
  label: string;
  entries: readonly MeasuredAuthorityReadinessEntryV379[];
  phase: string;
}>) {
  return (
    <div className="rounded-[9px] border border-cyan-100/[.08] bg-black/20 p-2">
      <div className="mb-2 flex items-center gap-2 font-mono text-[6px] uppercase tracking-[.2em] text-cyan-100/32">
        {label}<i className="h-px flex-1 bg-cyan-100/15 opacity-[var(--atlas-v379-rail)]" />
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {entries.length > 0 ? entries.map((entry) => (
          <div key={entry.id} className="rounded border border-amber-100/10 bg-amber-100/[.018] px-2 py-1.5" data-atlas-v379-breaker={entry.id} data-atlas-v379-breaker-state="contract-qualified-input-missing">
            <div className="truncate text-[7px] text-white/52">{entry.label}</div>
            <div className="mt-0.5 flex justify-between gap-2 font-mono text-[6px] uppercase tracking-[.1em]">
              <span className="text-cyan-100/48">schema + bounded</span>
              <span className="text-amber-100/62">input missing</span>
            </div>
          </div>
        )) : (
          <div className="rounded border border-white/[.05] px-2 py-2 font-mono text-[7px] text-white/20">{phase}</div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, warning = false }: Readonly<{ label: string; value: string; warning?: boolean }>) {
  return <div className="bg-black/35 px-2.5 py-2"><div className="text-[6px] uppercase tracking-[.16em] text-white/25">{label}</div><div className={`mt-0.5 text-[10px] ${warning ? "text-amber-100/75" : "text-cyan-50/70"}`}>{value}</div></div>;
}

function Impact({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="bg-[#100d08] px-2.5 py-2 font-mono"><div className="text-[6px] uppercase tracking-[.14em] text-white/25">{label}</div><div className="mt-0.5 text-[8px] text-amber-100/62">{value}</div></div>;
}
