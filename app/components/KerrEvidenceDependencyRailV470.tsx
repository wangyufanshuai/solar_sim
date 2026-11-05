"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";

import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrEvidenceDependencySnapshotV470,
  loadKerrEvidenceDependencySummaryV470,
  subscribeKerrEvidenceDependencyV470,
} from "../lib/kerrEvidenceDependencyClientV470";

export default function KerrEvidenceDependencyRailV470() {
  const state = useSyncExternalStore(
    subscribeKerrEvidenceDependencyV470,
    getKerrEvidenceDependencySnapshotV470,
    getKerrEvidenceDependencySnapshotV470,
  );
  const tokens = resolveAtlasScienceCinematicV7V457("science");

  useEffect(() => {
    void loadKerrEvidenceDependencySummaryV470().catch(() => undefined);
  }, []);

  const style = {
    "--v470-ink": tokens.productGate.ink,
    "--v470-panel": tokens.productGate.panel,
    "--v470-grid": tokens.productGate.grid,
    "--v470-qualified": tokens.productGate.qualified,
    "--v470-blocked": tokens.productGate.blocked,
  } as CSSProperties;
  const summary = state.summary;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(251,146,60,.11),transparent_27%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,.1),transparent_24%),linear-gradient(155deg,var(--v470-panel),#030708_56%,#071014)] p-5 font-mono text-[var(--v470-ink)] shadow-[0_40px_140px_rgba(0,0,0,.58)] sm:p-8"
      data-atlas-kerr-dependency-v470
      data-atlas-v470-root-blockers={summary?.analysis.rootBlockers.length ?? 0}
      data-atlas-v470-authority={
        summary?.outcomes.scienceRasterAuthorityGranted ? "true" : "false"
      }
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(var(--v470-grid)_1px,transparent_1px)] [background-size:100%_36px]" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.36em] opacity-45">
            V470 / qualification prerequisite DAG
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.06em] sm:text-5xl">
            不是一堵墙，而是三条可追溯的根阻塞
          </h2>
          <p className="mt-4 max-w-3xl text-[11px] leading-6 opacity-55">
            每条边都来自已冻结合同；协议通过不等于生产资格，局部 fixture 也不能越过 measured
            authority、dense aggregate 或重型运行时门禁。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-center">
          <Metric label="authority" value="NO" />
          <Metric label="pixels" value="0" />
          <Metric label="dense" value="0/49" />
          <Metric label="browser" value="N/R" />
        </div>
      </header>

      {!summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60"
          data-atlas-v470-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在解析资格依赖图…"
            : "Dependency evidence 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-3 lg:grid-cols-3">
            {summary.analysis.rootBlockers.map((blocker, index) => (
              <article
                className="border border-[var(--v470-blocked)]/25 bg-[var(--v470-blocked)]/[.035] p-5"
                data-atlas-v470-root-blocker={blocker.nodeId}
                key={blocker.nodeId}
              >
                <div className="flex items-center justify-between text-[8px] uppercase tracking-[.2em] opacity-45">
                  <span>root blocker {String(index + 1).padStart(2, "0")}</span>
                  <span>{blocker.blockedDescendantCount} downstream</span>
                </div>
                <div className="mt-4 font-serif text-xl tracking-[.04em]">
                  {summary.nodes.find((node) => node.id === blocker.nodeId)?.label ??
                    blocker.nodeId}
                </div>
                <p className="mt-3 text-[10px] leading-5 text-[var(--v470-blocked)]/75">
                  {blocker.reason}
                </p>
              </article>
            ))}
          </div>

          <div className="relative mt-7 grid gap-5 xl:grid-cols-[1fr_320px]">
            <div className="border border-white/10 bg-black/25 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between text-[8px] uppercase tracking-[.22em] opacity-45">
                <span>evidence chain / topological order</span>
                <span>{summary.contract.edgeCount} signed edges</span>
              </div>
              <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                {summary.analysis.topologicalOrder.map((nodeId, index) => {
                  const node = summary.nodes.find((candidate) => candidate.id === nodeId);
                  if (!node) return null;
                  return (
                    <div
                      className="min-h-28 bg-[#05090b] p-4"
                      data-atlas-v470-node={node.id}
                      data-atlas-v470-production-qualified={
                        node.productionQualified ? "true" : "false"
                      }
                      key={node.id}
                    >
                      <div className="flex items-center justify-between text-[8px] opacity-35">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{node.kind}</span>
                      </div>
                      <div className="mt-3 text-[11px] leading-5">{node.label}</div>
                      <div className="mt-2 text-[8px] leading-4 text-[var(--v470-blocked)]/70">
                        {node.blockReason ?? "qualified"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="border border-white/10 bg-black/25 p-5">
              <div className="text-[8px] uppercase tracking-[.22em] opacity-45">
                manual recovery only
              </div>
              <div className="mt-5 grid gap-5">
                {summary.recovery.map((entry, index) => (
                  <div className="border-l border-white/15 pl-4" key={entry.blocker}>
                    <div className="text-[8px] opacity-35">
                      0{index + 1} / {entry.blocker}
                    </div>
                    <p className="mt-2 text-[10px] leading-5 opacity-60">
                      {entry.requiredExternalAction}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-7 border-t border-white/10 pt-4 text-[9px] leading-5 text-[var(--v470-blocked)]/70">
                automatic action: forbidden
                <br />
                retry: forbidden
                <br />
                threshold relaxation: forbidden
              </div>
            </aside>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>Science/Cinematic writeback isolated · new Canvas 0 · sceneRevision Δ 0</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v470/dependency-graph?download=dependency-graph"
            >
              导出依赖图
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 bg-black/45 px-4 py-3">
      <div className="text-[7px] uppercase tracking-[.18em] opacity-35">{label}</div>
      <div className="mt-1 text-lg text-[var(--v470-blocked)]">{value}</div>
    </div>
  );
}
