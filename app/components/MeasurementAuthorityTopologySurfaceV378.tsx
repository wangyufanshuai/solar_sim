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
  parseMeasurementAuthorityTopologyV378,
  type MeasurementAuthorityLaneV378,
  type MeasurementAuthorityNodeV378,
  type MeasurementAuthorityTopologyV378,
} from "../lib/measurementAuthorityTopologyV378";

const LANES: readonly MeasurementAuthorityLaneV378[] = [
  "photon",
  "detector",
  "geometry",
  "fusion",
  "image",
];
const LANE_LABELS: Readonly<Record<MeasurementAuthorityLaneV378, string>> = {
  photon: "Photon authority",
  detector: "Detector authority",
  geometry: "Geometry authority",
  fusion: "Dual-authority fusion",
  image: "Science image",
};

export default function MeasurementAuthorityTopologySurfaceV378() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v378-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasurementAuthorityTopologySurfaceV378",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const [artifact, setArtifact] = useState<MeasurementAuthorityTopologyV378 | null>(
    null,
  );
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v378/measurement-authority-topology",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v378-topology-unavailable");
        }
        return parseMeasurementAuthorityTopologyV378(value.artifact);
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
  const lanes = useMemo(
    () =>
      LANES.map((lane) => ({
        lane,
        nodes: artifact?.nodes.filter((node) => node.lane === lane) ?? [],
      })),
    [artifact],
  );
  const style = {
    "--atlas-v378-grid": tokens.metrologyGridOpacity,
    "--atlas-v378-rail": tokens.shaRailOpacity,
    "--atlas-v378-gate": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[linear-gradient(105deg,rgba(2,15,20,.98),rgba(3,10,15,.99)_60%,rgba(20,12,3,.97))] p-3 text-[8px] text-cyan-50/55 shadow-[inset_0_1px_0_rgba(207,250,254,.06)]"
      data-atlas-measurement-authority-topology-v378
      data-atlas-v378-phase={phase}
      data-atlas-v378-present-inputs={artifact?.presentInputCount ?? "loading"}
      data-atlas-v378-observed-counts-node="false"
      data-atlas-v378-synthetic-fallback="false"
      data-atlas-v378-science-buffer-mutation="false"
      data-atlas-v378-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v378-grid)] [background-image:linear-gradient(90deg,rgba(207,250,254,.07)_1px,transparent_1px)] [background-size:13.5%_100%]"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.27em] text-cyan-100/42">
            v378 · authority cryobus
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','Arial_Narrow',sans-serif] text-[17px] font-light uppercase tracking-[.1em] text-cyan-50/90">
            Provenance before pixels
          </h3>
        </div>
        <div className="border-l border-amber-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.14em] text-amber-100/55">
          {artifact ? `${artifact.presentInputCount} / ${artifact.expectedInputCount}` : phase}
          <br />all required · no fallback
        </div>
      </div>

      <div className="relative mt-3 grid gap-1.5 lg:grid-cols-[.75fr_1fr_1.2fr_.9fr_.9fr]">
        {lanes.map(({ lane, nodes }) => (
          <div
            key={lane}
            className="min-w-0 rounded-[8px] border border-white/[.07] bg-black/20 p-2"
            data-atlas-v378-lane={lane}
          >
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[6px] uppercase tracking-[.18em] text-white/30">
              <i className="h-px flex-1 bg-cyan-100/15 opacity-[var(--atlas-v378-rail)]" />
              {LANE_LABELS[lane]}
            </div>
            <div className="space-y-1">
              {nodes.length > 0 ? (
                nodes.map((node) => <AuthorityNode key={node.id} node={node} />)
              ) : (
                <div className="rounded border border-white/[.05] px-2 py-2 font-mono text-[7px] text-white/20">
                  {phase}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-100/10 pt-2 font-mono text-[7px] text-white/34">
        <span>10 nodes · 9 required edges · acyclic</span>
        <span className="text-amber-100/[var(--atlas-v378-gate)]">
          observed counts are outside this graph
        </span>
      </div>
    </section>
  );
}

function AuthorityNode({ node }: Readonly<{ node: MeasurementAuthorityNodeV378 }>) {
  const tone =
    node.status === "qualified"
      ? "border-cyan-100/20 bg-cyan-100/[.045] text-cyan-50/75"
      : node.status === "withheld"
        ? "border-amber-100/16 bg-amber-100/[.025] text-amber-50/58"
        : "border-white/[.06] bg-black/15 text-white/33";
  return (
    <div className={`rounded border px-2 py-1.5 ${tone}`} data-atlas-v378-node={node.id} data-atlas-v378-node-status={node.status}>
      <div className="truncate text-[7px]">{node.label}</div>
      <div className="mt-0.5 truncate font-mono text-[6px] uppercase tracking-[.12em] opacity-60">
        {node.status} · {node.reason}
      </div>
    </div>
  );
}
