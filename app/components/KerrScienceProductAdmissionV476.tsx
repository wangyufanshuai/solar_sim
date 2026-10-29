"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrScienceProductAdmissionSnapshotV476,
  loadKerrScienceProductAdmissionSummaryV476,
  subscribeKerrScienceProductAdmissionV476,
} from "../lib/kerrScienceProductAdmissionClientV476";
import {
  resolveKerrScienceProductAdmissionV476,
  type KerrScienceProductIdV476,
} from "../lib/kerrScienceProductAdmissionV476";

export default function KerrScienceProductAdmissionV476() {
  const state = useSyncExternalStore(
    subscribeKerrScienceProductAdmissionV476,
    getKerrScienceProductAdmissionSnapshotV476,
    getKerrScienceProductAdmissionSnapshotV476,
  );
  const [selectedId, setSelectedId] = useState<KerrScienceProductIdV476>(
    "sparse-observable-hud",
  );

  useEffect(() => {
    void loadKerrScienceProductAdmissionSummaryV476().catch(() => undefined);
  }, []);

  const selected = state.summary?.products.find((entry) => entry.id === selectedId) ?? null;
  const decision = state.summary
    ? resolveKerrScienceProductAdmissionV476(state.summary, {
        productId: selectedId,
        deliveryProfile: "local-shadow",
        renderMode: "science",
      })
    : null;
  const style = {
    "--v476-open": "#79f7d4",
    "--v476-closed": "#ffb36b",
    "--v476-grid": "rgba(121,247,212,.075)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[44px] border border-white/10 bg-[#050806] p-5 text-[#e9fff8] shadow-[0_56px_180px_rgba(0,0,0,.74)] sm:p-8"
      data-atlas-kerr-science-product-admission-v476
      data-atlas-v476-allowed-products={state.summary?.contract.allowedProductCount ?? 0}
      data-atlas-v476-blocked-products={state.summary?.contract.blockedProductCount ?? 0}
      data-atlas-v476-science-pixels="0"
      data-atlas-v476-placeholder-measurements="false"
      data-atlas-v476-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--v476-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v476-grid)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-emerald-300/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -top-20 h-80 w-80 rounded-full bg-orange-300/7 blur-3xl" />

      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.4em] text-white/35">
            V476 / scientific product admission rail
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl tracking-[.045em] text-white/90 sm:text-5xl">
            科学信号可以停下，展示效果不能越过闸门
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[11px] leading-6 text-white/45">
            四条稀疏权威射线可以进入 HUD 与向量导出；缺少实测探测器、完整 dense campaign 和闭合误差预算时，强度、Stokes、raster、FITS 与 PNG 必须保持不可用。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-center font-mono">
          <Metric label="open" value="2" tone="open" />
          <Metric label="closed" value="7" tone="closed" />
          <Metric label="pixels" value="0" tone="closed" />
        </div>
      </header>

      {!state.summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v476-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取科研产品准入证据……"
            : "科研产品准入不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.summary.products.map((entry, index) => (
                <button
                  className={
                    "group relative min-h-32 overflow-hidden border p-4 text-left transition-colors " +
                    (selectedId === entry.id
                      ? entry.available
                        ? "border-[var(--v476-open)]/45 bg-[var(--v476-open)]/[.07]"
                        : "border-[var(--v476-closed)]/45 bg-[var(--v476-closed)]/[.07]"
                      : "border-white/8 bg-black/25 hover:border-white/20")
                  }
                  data-atlas-v476-product={entry.id}
                  data-atlas-v476-product-available={entry.available}
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between font-mono text-[8px] text-white/30">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className={entry.available ? "text-[var(--v476-open)]" : "text-[var(--v476-closed)]"}>
                      {entry.available ? "ADMIT" : "HOLD"}
                    </span>
                  </div>
                  <div className="mt-5 font-serif text-lg tracking-[.03em] text-white/80">
                    {entry.label}
                  </div>
                  <div className="mt-3 font-mono text-[7px] leading-4 text-white/30">
                    {entry.status}
                  </div>
                  <div
                    className={
                      "absolute bottom-0 left-0 h-px transition-all " +
                      (entry.available ? "w-full bg-[var(--v476-open)]/55" : "w-1/3 bg-[var(--v476-closed)]/55 group-hover:w-full")
                    }
                  />
                </button>
              ))}
            </div>

            <aside className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[.18em] text-white/35">
                <span>admission decision</span>
                <span className={decision?.allowed ? "text-[var(--v476-open)]" : "text-[var(--v476-closed)]"}>
                  {decision?.allowed ? "allowed" : "blocked"}
                </span>
              </div>
              {selected && decision ? (
                <>
                  <h3 className="mt-5 font-serif text-2xl tracking-[.04em] text-white/85">
                    {selected.label}
                  </h3>
                  <div className="mt-5 space-y-2 font-mono text-[8px]">
                    <RailRow label="authority" value={selected.authorityClass} />
                    <RailRow label="records" value={String(decision.recordCount)} />
                    <RailRow label="placeholder" value="forbidden" />
                    <RailRow label="presentation fallback" value="cannot grant authority" />
                    <RailRow label="science writeback" value="forbidden" />
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="font-mono text-[8px] uppercase tracking-[.16em] text-white/30">
                      blockers / {selected.blockedBy.length}
                    </div>
                    {selected.blockedBy.length === 0 ? (
                      <div className="mt-3 border-l-2 border-[var(--v476-open)]/50 bg-[var(--v476-open)]/[.04] px-3 py-3 font-mono text-[9px] text-[var(--v476-open)]">
                        sparse authority ready / science buffer read-only
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {selected.blockedBy.map((blocker) => (
                          <div
                            className="border-l-2 border-[var(--v476-closed)]/45 bg-[var(--v476-closed)]/[.035] px-3 py-2.5 font-mono text-[8px] text-[var(--v476-closed)]/80"
                            key={blocker}
                          >
                            {blocker}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </aside>
          </div>

          <div className="relative mt-6 grid gap-2 border border-white/10 bg-white/[.02] p-4 font-mono text-[8px] sm:grid-cols-3">
            <RootBlocker label="measured detector" value="0 / 6 files" />
            <RootBlocker label="dense campaign" value="0 / 49 shards" />
            <RootBlocker label="heavy qualification" value="not-run" />
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/35">
            <span>production budgets 0 closed · Stokes 0 · FITS 0 · no automatic action</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-[var(--v476-open)]/50 hover:text-[var(--v476-open)]"
              href="/api/atlas/relativity-evidence/v476/science-product-admission?download=admission"
            >
              导出准入证据
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "open" | "closed" }) {
  return (
    <div className="min-w-24 bg-black/50 px-4 py-3">
      <div className="text-[7px] uppercase tracking-[.14em] text-white/30">{label}</div>
      <div className={"mt-1 text-lg " + (tone === "open" ? "text-[var(--v476-open)]" : "text-[var(--v476-closed)]")}>
        {value}
      </div>
    </div>
  );
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-2">
      <span className="text-white/30">{label}</span>
      <span className="max-w-[65%] text-right text-white/65">{value}</span>
    </div>
  );
}

function RootBlocker({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-l border-[var(--v476-closed)]/30 px-3 py-2">
      <span className="text-white/30">{label}</span>
      <span className="text-[var(--v476-closed)]">{value}</span>
    </div>
  );
}
