"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import {
  getKerrUncertaintyIndependentVerificationSnapshotV517,
  loadKerrUncertaintyIndependentVerificationSummaryV517,
  subscribeKerrUncertaintyIndependentVerificationV517,
} from "../lib/kerrUncertaintyIndependentVerificationClientV517";
import {
  createKerrProvenanceConstellationEncodingV518,
  resolveKerrProvenanceConstellationProfileV518,
} from "../lib/kerrProvenanceConstellationV518";

export default function KerrProvenanceConstellationV518() {
  const evidence = useSyncExternalStore(
    subscribeKerrUncertaintyIndependentVerificationV517,
    getKerrUncertaintyIndependentVerificationSnapshotV517,
    getKerrUncertaintyIndependentVerificationSnapshotV517,
  );
  const hud = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  useEffect(() => {
    void loadKerrUncertaintyIndependentVerificationSummaryV517().catch(() => undefined);
  }, []);
  const profile = resolveKerrProvenanceConstellationProfileV518(hud.mode);
  const encoding = evidence.summary
    ? createKerrProvenanceConstellationEncodingV518(evidence.summary, hud.mode)
    : null;
  const style = {
    "--v518-panel": profile.panel,
    "--v518-raised": profile.panelRaised,
    "--v518-ink": profile.ink,
    "--v518-muted": profile.muted,
    "--v518-grid": profile.grid,
    "--v518-node-fill": profile.nodeFill,
    "--v518-node-stroke": profile.nodeStroke,
    "--v518-edge": profile.edgeStroke,
    "--v518-halo": profile.halo,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[40px] border border-white/10 bg-[var(--v518-panel)] p-5 font-mono text-[var(--v518-ink)] shadow-[0_70px_220px_rgba(0,0,0,.78)] sm:p-8"
      data-atlas-kerr-provenance-constellation-v518
      data-atlas-v518-profile-id="science-cinematic-v7r2-v518"
      data-atlas-v518-mode={hud.mode}
      data-atlas-v518-node-count="8"
      data-atlas-v518-edge-count="7"
      data-atlas-v518-numeric-scientific-style-input-count="0"
      data-atlas-v518-hash-driven-style-count="0"
      data-atlas-v518-uncertainty-driven-style-count="0"
      data-atlas-v518-scientific-mutation="false"
      data-atlas-v518-cinematic-writeback="false"
      data-atlas-v518-canvas-created="false"
      data-atlas-v518-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(var(--v518-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v518-grid)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
            V518 / Science Cinematic V7.2 / provenance constellation
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
            同一条证明轨道，两种观看方式
          </h2>
          <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
            八个节点对应八个已验证 checkpoint。Science 与 Cinematic 共享完全相同的几何和科研身份；电影模式只能改变固定 token、光晕与节奏。
          </p>
        </div>
        <div className="flex gap-2" aria-label="Provenance constellation visual mode">
          {(["science", "cinematic"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAtlasCalibrationHudModeV506(mode)}
              className={
                hud.mode === mode
                  ? "border border-white/30 bg-white/10 px-4 py-2 text-[9px] uppercase tracking-[.16em]"
                  : "border border-white/10 bg-black/20 px-4 py-2 text-[9px] uppercase tracking-[.16em] opacity-40"
              }
            >
              {mode}
            </button>
          ))}
        </div>
      </header>
      {!encoding ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {evidence.status === "idle" || evidence.status === "loading"
            ? "正在读取独立验证收据…"
            : `证明星座不可用 / ${evidence.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-7 overflow-hidden rounded-[32px] border border-white/10 bg-[var(--v518-raised)] p-4 sm:p-6">
            <svg
              viewBox="0 0 100 80"
              role="img"
              aria-label="Eight verified provenance checkpoints connected by seven fixed edges"
              className="h-auto w-full"
            >
              {encoding.edges.map((edge) => {
                const from = encoding.nodes.find((node) => node.id === edge.from);
                const to = encoding.nodes.find((node) => node.id === edge.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={edge.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--v518-edge)"
                    strokeOpacity={profile.edgeOpacity}
                    strokeWidth="0.45"
                  />
                );
              })}
              {encoding.nodes.map((node) => (
                <g
                  key={node.id}
                  className={hud.mode === "cinematic" ? "animate-pulse" : undefined}
                  style={
                    hud.mode === "cinematic"
                      ? { animationDelay: `${node.ordinal * 137}ms`, animationDuration: "3.4s" }
                      : undefined
                  }
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4.6"
                    fill="var(--v518-halo)"
                    opacity={profile.nodeGlowOpacity}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="2.15"
                    fill="var(--v518-node-fill)"
                    stroke="var(--v518-node-stroke)"
                    strokeWidth="0.55"
                  />
                  <text
                    x={node.x}
                    y={node.y + 7.2}
                    textAnchor="middle"
                    fill="var(--v518-muted)"
                    fontSize="2.3"
                  >
                    {node.transition}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Gate label="payload" value={compact(encoding.scientificPayloadKey)} />
            <Gate label="chain head" value={compact(encoding.chainHeadSha256)} />
            <Gate label="geometry" value="identical 8 nodes / 7 edges" />
            <Gate label="style inputs" value="scientific numeric 0" />
          </div>
          <footer className="relative mt-6 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            Science bloom 0 · grade 0 · animation off / Cinematic seed fixed · no science writeback · dense 0/49
          </footer>
        </>
      )}
    </section>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span>{value}</span>
    </div>
  );
}

const compact = (value: string) => `${value.slice(0, 8)}…${value.slice(-8)}`;
