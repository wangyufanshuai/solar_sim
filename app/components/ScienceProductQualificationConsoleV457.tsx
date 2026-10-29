"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  resolveAtlasScienceCinematicV7V457,
  type AtlasScienceCinematicV7ModeV457,
} from "../lib/atlasScienceCinematicV7V457";
import {
  getScienceProductPromotionSnapshotV457,
  loadScienceProductPromotionSummaryV457,
  subscribeScienceProductPromotionV457,
} from "../lib/scienceProductPromotionClientV457";
import type {
  ScienceProductGateEntryV457,
  ScienceProductGateStatusV457,
} from "../lib/scienceProductPromotionGateV457";

const STATUS_LABEL: Record<ScienceProductGateStatusV457, string> = {
  qualified: "已验证",
  blocked: "阻塞",
  incomplete: "未完成",
  unquantified: "未量化",
  "not-run": "未运行",
};

export default function ScienceProductQualificationConsoleV457() {
  const state = useSyncExternalStore(
    subscribeScienceProductPromotionV457,
    getScienceProductPromotionSnapshotV457,
    getScienceProductPromotionSnapshotV457,
  );
  const [mode, setMode] = useState<AtlasScienceCinematicV7ModeV457>("science");
  const tokens = resolveAtlasScienceCinematicV7V457(mode);
  useEffect(() => {
    void loadScienceProductPromotionSummaryV457().catch(() => undefined);
  }, []);
  const style = {
    "--v457-ink": tokens.productGate.ink,
    "--v457-panel": tokens.productGate.panel,
    "--v457-grid": tokens.productGate.grid,
    "--v457-qualified": tokens.productGate.qualified,
    "--v457-blocked": tokens.productGate.blocked,
    "--v457-rail": tokens.productGate.railOpacity,
    "--v457-glow": tokens.productGate.blockerGlow,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_84%_0%,color-mix(in_srgb,var(--v457-blocked)_10%,transparent),transparent_29%),linear-gradient(145deg,var(--v457-panel),#030609_64%,#090503)] p-5 font-mono text-[var(--v457-ink)] shadow-[0_32px_110px_rgba(0,0,0,.52)] transition-colors duration-500 sm:p-7"
      data-atlas-science-product-console-v457
      data-atlas-v457-profile="science-cinematic-v7-v457"
      data-atlas-v457-mode={mode}
      data-atlas-v457-promotion-allowed="false"
      data-atlas-v457-fits-write-allowed="false"
      data-atlas-v457-png-write-allowed="false"
      data-atlas-v457-scientific-field-mutation="false"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--v457-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v457-grid)_1px,transparent_1px)] [background-size:36px_36px]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.34em] opacity-45">
            V457 / science product promotion airlock
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-2xl tracking-[.08em] sm:text-4xl">
            结构已经合格，像素仍未获得科学身份
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 opacity-55">
            FITS header 与 provenance 已通过；实测探测器输入、像素值、dense aggregate
            和重型资格尚未闭合。晋级门因此拒绝写出 FITS、PNG，也不会改变 local-shadow 默认值。
          </p>
        </div>
        <div
          className="flex border border-white/10 bg-black/20 p-1"
          aria-label="Science Cinematic V7 mode"
        >
          {(["science", "cinematic"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`px-3 py-2 text-[9px] uppercase tracking-[.18em] transition-colors ${
                mode === value
                  ? "bg-white/10 text-white"
                  : "text-white/35 hover:text-white/70"
              }`}
              data-atlas-v457-mode-option={value}
            >
              {value}
            </button>
          ))}
        </div>
      </header>
      {!state.summary ? (
        <div className="relative mt-5 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取晋级门证据…"
            : `晋级门不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
            <aside className="border border-white/10 bg-black/25 p-5">
              <div className="text-[9px] uppercase tracking-[.24em] opacity-45">
                Promotion verdict
              </div>
              <div className="mt-8 text-5xl font-light tracking-[-.06em] text-[var(--v457-blocked)]">
                HOLD
              </div>
              <div className="mt-3 max-w-xs text-[10px] leading-5 opacity-50">
                {state.summary.counts.qualifiedCount} 项已验证 · {state.summary.counts.blockerCount} 项仍阻塞
              </div>
              <dl className="mt-8 grid gap-3 text-[9px]">
                <Verdict label="Science product" value="拒绝晋级" />
                <Verdict label="FITS write" value="禁止" />
                <Verdict label="PNG write" value="禁止" />
                <Verdict label="Local-shadow default" value="保持 Legacy V9" />
              </dl>
            </aside>
            <div className="grid gap-2 sm:grid-cols-2">
              {state.summary.gates.map((gate, index) => (
                <GateCard key={gate.id} gate={gate} index={index + 1} />
              ))}
            </div>
          </div>
          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>
              detector {state.summary.counts.measuredDetectorReady}/
              {state.summary.counts.measuredDetectorRequired} · dense {state.summary.counts.denseShardsCompleted}/
              {state.summary.counts.denseShardsPlanned}
            </span>
            <a
              className="border border-white/10 px-3 py-1.5 hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v457/science-product-gate?download=gate"
            >
              gate artifact
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function GateCard({
  gate,
  index,
}: Readonly<{ gate: ScienceProductGateEntryV457; index: number }>) {
  const qualified = gate.status === "qualified";
  return (
    <article
      className="relative overflow-hidden border border-white/10 bg-black/25 p-4"
      data-atlas-v457-gate={gate.id}
      data-atlas-v457-gate-status={gate.status}
    >
      <div
        className={`absolute inset-y-0 left-0 w-px ${
          qualified ? "bg-[var(--v457-qualified)]" : "bg-[var(--v457-blocked)]"
        }`}
        style={{ opacity: qualified ? 0.65 : "var(--v457-rail)" }}
      />
      <div className="flex items-center justify-between gap-3 text-[8px] uppercase tracking-[.18em] opacity-45">
        <span>{String(index).padStart(2, "0")}</span>
        <span className={qualified ? "text-[var(--v457-qualified)]" : "text-[var(--v457-blocked)]"}>
          {STATUS_LABEL[gate.status]}
        </span>
      </div>
      <h3 className="mt-4 text-[11px] tracking-[.06em]">{gate.label}</h3>
      <p className="mt-2 text-[9px] leading-5 opacity-40">{gate.evidence}</p>
    </article>
  );
}

function Verdict({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/7 pb-2">
      <dt className="opacity-35">{label}</dt>
      <dd className="text-[var(--v457-blocked)]">{value}</dd>
    </div>
  );
}
