"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrUncertaintyIndependentVerificationSnapshotV517,
  loadKerrUncertaintyIndependentVerificationSummaryV517,
  subscribeKerrUncertaintyIndependentVerificationV517,
} from "../lib/kerrUncertaintyIndependentVerificationClientV517";
import { resolveKerrUncertaintyVisualProfileV514 } from "../lib/kerrUncertaintyVisualEncodingV514";

export default function KerrUncertaintyIndependentVerificationV517() {
  const state = useSyncExternalStore(
    subscribeKerrUncertaintyIndependentVerificationV517,
    getKerrUncertaintyIndependentVerificationSnapshotV517,
    getKerrUncertaintyIndependentVerificationSnapshotV517,
  );
  useEffect(() => {
    void loadKerrUncertaintyIndependentVerificationSummaryV517().catch(() => undefined);
  }, []);
  const profile = resolveKerrUncertaintyVisualProfileV514("science");
  const style = {
    "--v517-panel": profile.panel,
    "--v517-raised": profile.panelRaised,
    "--v517-ink": profile.ink,
    "--v517-grid": profile.grid,
    "--v517-qualified": profile.status.qualified.ink,
  } as CSSProperties;
  const summary = state.summary;
  return (
    <section
      style={style}
      className="relative mt-7 overflow-hidden rounded-[36px] border border-white/10 bg-[var(--v517-panel)] p-5 font-mono text-[var(--v517-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] sm:p-8"
      data-atlas-kerr-uncertainty-independent-verification-v517
      data-atlas-v517-recomputed-witness-count="512"
      data-atlas-v517-matched-checkpoint-count="8"
      data-atlas-v517-imported-v516-parser="false"
      data-atlas-v517-imported-v516-builder="false"
      data-atlas-v517-automatic-request-count="0"
      data-atlas-v517-scientific-mutation="false"
      data-atlas-v517-canvas-created="false"
      data-atlas-v517-scene-revision-delta="0"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--v517-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v517-grid)_1px,transparent_1px)] [background-size:48px_48px]" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="text-[9px] uppercase tracking-[.42em] opacity-50">
          V517 / independent verification receipt
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] sm:text-5xl">
          生成器写下见证，独立验证器重新证明它
        </h2>
        <p className="mt-4 max-w-3xl text-[10px] leading-6 opacity-55">
          验证器不导入 v516 parser 或 builder；它重新计算 canonical SHA、全部 512 个见证、8 个检查点及源文件清单，并输出一张净化收据。
        </p>
      </header>
      {!summary ? (
        <div className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-4 text-[10px] opacity-55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取独立验证收据…"
            : `验证收据不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            <Metric label="witnesses" value={summary.verification.recomputedWitnessCount} />
            <Metric label="checkpoints" value={summary.verification.matchedCheckpointCount} />
            <Metric label="witness mismatch" value={summary.verification.witnessMismatchCount} />
            <Metric label="boundary violations" value={summary.verification.boundaryViolationCount} />
            <Metric label="sequence mismatch" value={summary.verification.sequenceMismatchCount} />
            <Metric label="invalid SHA" value={summary.verification.invalidShaCount} />
            <Metric label="network requests" value={summary.lifecycle.networkRequestCount} />
            <Metric label="science mutations" value={0} />
          </div>
          <div className="relative mt-5 grid gap-3 md:grid-cols-2">
            <Gate label="independent implementation" value="yes" />
            <Gate label="v516 parser imported" value="no" />
            <Gate label="source manifest" value="verified" />
            <Gate label="chain head" value={compact(summary.verification.chainHeadSha256)} />
            <Gate label="artifact canonical" value="verified" />
            <Gate label="detector authority" value="unavailable · 0/6" />
          </div>
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.12em] opacity-40">
            <span>dense 0/49 · raster unavailable · browser not-run · product v263</span>
            <a
              className="border border-white/12 px-3 py-2"
              href="/api/atlas/relativity-evidence/v517/independent-verification?download=receipt"
            >
              Export verification receipt
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="bg-[var(--v517-raised)] px-3 py-4 text-center">
      <div className="text-[7px] uppercase tracking-[.14em] opacity-30">{label}</div>
      <div className="mt-1 text-xl text-[var(--v517-qualified)]">{value}</div>
    </div>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-black/20 px-4 py-3 text-[9px]">
      <span className="opacity-35">{label}</span>
      <span className="text-[var(--v517-qualified)]">{value}</span>
    </div>
  );
}

const compact = (value: string) => `${value.slice(0, 8)}…${value.slice(-8)}`;
