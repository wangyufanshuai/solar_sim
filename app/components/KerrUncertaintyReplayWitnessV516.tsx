"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrUncertaintyReplayWitnessSnapshotV516,
  loadKerrUncertaintyReplayWitnessSummaryV516,
  subscribeKerrUncertaintyReplayWitnessV516,
} from "../lib/kerrUncertaintyReplayWitnessClientV516";
import { resolveKerrUncertaintyVisualProfileV514 } from "../lib/kerrUncertaintyVisualEncodingV514";

export default function KerrUncertaintyReplayWitnessV516() {
  const state = useSyncExternalStore(
    subscribeKerrUncertaintyReplayWitnessV516,
    getKerrUncertaintyReplayWitnessSnapshotV516,
    getKerrUncertaintyReplayWitnessSnapshotV516,
  );
  useEffect(() => {
    void loadKerrUncertaintyReplayWitnessSummaryV516().catch(() => undefined);
  }, []);
  const profile = resolveKerrUncertaintyVisualProfileV514("science");
  const style = {
    "--v516-panel": profile.panel,
    "--v516-raised": profile.panelRaised,
    "--v516-ink": profile.ink,
    "--v516-grid": profile.grid,
    "--v516-qualified": profile.status.qualified.ink,
  } as CSSProperties;
  const summary = state.summary;

  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[36px] border border-white/10 bg-[var(--v516-panel)] p-5 font-mono text-[var(--v516-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] sm:p-8"
      data-atlas-kerr-uncertainty-replay-witness-v516
      data-atlas-v516-transition-count="512"
      data-atlas-v516-witness-count="512"
      data-atlas-v516-checkpoint-count="8"
      data-atlas-v516-scientific-mutation="false"
      data-atlas-v516-automatic-request-count="0"
      data-atlas-v516-canvas-created="false"
      data-atlas-v516-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--v516-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v516-grid)_1px,transparent_1px)] [background-size:48px_48px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V516 / content-addressed replay witness chain
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          每一次切换都有自己的见证，不再只相信最终计数
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          512 个见证逐一绑定模式、修订号、Science payload、九行科研数据摘要和两路视觉签名；第二次独立重放必须得到同一个链头。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取见证链…"
            : `见证链不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="transitions" value={summary.chain.transitionCount} />
            <Metric label="witnesses" value={summary.chain.witnessCount} />
            <Metric label="checkpoints" value={summary.chain.checkpointCount} />
            <Metric label="A/B passes" value={summary.chain.passCount} />
            <Metric label="chain mismatch" value={summary.chain.mismatchCount} />
            <Metric label="row mismatch" value={summary.chain.scientificDigestMismatchCount} />
            <Metric label="visual mismatch" value={summary.chain.visualDigestMismatchCount} />
            <Metric label="mutations" value={summary.chain.scientificMutationCount} />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate label="chain head" value={compact(summary.chain.headSha256)} />
            <Gate label="repeat head" value={compact(summary.chain.repeatHeadSha256)} />
            <Gate label="scientific rows" value={compact(summary.basis.scientificRowsSha256)} />
            <Gate label="resource lifecycle" value={summary.lifecycle.finalResourceStatus} />
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {summary.checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.transitionIndex}
                className="border border-white/10 bg-[var(--v516-raised)] px-3 py-3 text-[8px]"
              >
                <div className="opacity-35">#{checkpoint.transitionIndex + 1}</div>
                <div className="mt-1 text-[var(--v516-qualified)]">
                  {compact(checkpoint.witnessSha256)}
                </div>
              </div>
            ))}
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>payload embedded false · detector unavailable · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v516/replay-witness?download=witness-chain"
            >
              Export witness chain
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="bg-[var(--v516-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v516-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v516-qualified)]">{value}</span>
    </div>
  );
}

const compact = (value: string) => `${value.slice(0, 8)}…${value.slice(-8)}`;
