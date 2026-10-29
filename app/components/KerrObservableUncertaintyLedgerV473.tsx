"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import { resolveAtlasScienceCinematicV8V472 } from "../lib/atlasScienceCinematicV8V472";
import {
  getKerrObservableUncertaintySnapshotV473,
  loadKerrObservableUncertaintySummaryV473,
  subscribeKerrObservableUncertaintyV473,
} from "../lib/kerrObservableUncertaintyClientV473";

export default function KerrObservableUncertaintyLedgerV473() {
  const state = useSyncExternalStore(
    subscribeKerrObservableUncertaintyV473,
    getKerrObservableUncertaintySnapshotV473,
    getKerrObservableUncertaintySnapshotV473,
  );
  const [selectedId, setSelectedId] = useState("geometry-classification");
  const tokens = resolveAtlasScienceCinematicV8V472("science");

  useEffect(() => {
    void loadKerrObservableUncertaintySummaryV473().catch(() => undefined);
  }, []);

  const selected =
    state.summary?.entries.find((entry) => entry.observableId === selectedId) ??
    state.summary?.entries[0] ??
    null;
  const style = {
    "--v473-ink": tokens.researchHud.ink,
    "--v473-panel": tokens.researchHud.panel,
    "--v473-grid": tokens.researchHud.grid,
    "--v473-short": tokens.researchHud.shortAuthority,
    "--v473-coordinate": tokens.researchHud.coordinateAuthority,
    "--v473-analytic": tokens.researchHud.analyticFixture,
    "--v473-open": tokens.researchHud.unavailable,
  } as CSSProperties;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[38px] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(196,181,253,.11),transparent_28%),linear-gradient(150deg,var(--v473-panel),#020607_60%,#07050d)] p-5 font-mono text-[var(--v473-ink)] shadow-[0_44px_150px_rgba(0,0,0,.6)] sm:p-8"
      data-atlas-kerr-uncertainty-v473
      data-atlas-v473-production-ledger="open"
      data-atlas-v473-rss-entry-count={state.summary?.summary.rssEntryCount ?? 0}
      data-atlas-v473-scientific-field-mutation="false"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(var(--v473-grid)_1px,transparent_1px)] [background-size:100%_34px]" />
      <header className="relative grid gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.36em] opacity-45">
            V473 / observable uncertainty ledger
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.06em] sm:text-5xl">
            误差不是一个数字，而是一组不能随意相加的收据
          </h2>
          <p className="mt-4 max-w-3xl text-[11px] leading-6 opacity-55">
            未证明独立性时线性相加；嵌套容差取最大值；不同物理通道保持分列。RSS
            禁止，production ledger 继续保持 open。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-center">
          <Metric label="components" value={String(state.summary?.summary.componentCount ?? 0)} />
          <Metric label="quantified" value={String(state.summary?.summary.quantifiedEntryCount ?? 0)} />
          <Metric label="RSS" value="0" />
          <Metric label="prod closed" value="0" />
        </div>
      </header>

      {!state.summary ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60"
          data-atlas-v473-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 observable uncertainty ledger…"
            : "Uncertainty ledger 不可用 / " + (state.reason ?? "request-failed")}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
            <div className="grid content-start gap-1">
              {state.summary.entries.map((entry, index) => (
                <button
                  className={
                    "grid grid-cols-[auto_1fr_auto] items-center gap-3 border px-3 py-3 text-left text-[8px] transition-colors " +
                    (selected?.observableId === entry.observableId
                      ? "border-white/25 bg-white/[.06]"
                      : "border-white/8 bg-black/15 opacity-55 hover:opacity-90")
                  }
                  data-atlas-v473-entry={entry.observableId}
                  key={entry.observableId}
                  onClick={() => setSelectedId(entry.observableId)}
                  type="button"
                >
                  <span className="opacity-35">{String(index + 1).padStart(2, "0")}</span>
                  <span>{entry.observableId}</span>
                  <span
                    className={
                      entry.combinationPolicy === "unavailable"
                        ? "text-[var(--v473-open)]"
                        : "text-[var(--v473-short)]"
                    }
                  >
                    {entry.combinationPolicy === "unavailable" ? "OPEN" : "QUANTIFIED"}
                  </span>
                </button>
              ))}
            </div>

            <article className="border border-white/10 bg-black/25 p-5">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[8px] uppercase tracking-[.18em] opacity-45">
                    <span>{selected.observableId}</span>
                    <span>{selected.status}</span>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {selected.components.map((component) => (
                      <div className="border border-white/8 bg-white/[.025] p-4" key={component.id}>
                        <div className="text-[8px] opacity-40">{component.id}</div>
                        <div className="mt-3 text-xl text-[var(--v473-coordinate)]">
                          {formatMetric(component.value)}
                        </div>
                        <div className="mt-1 text-[8px] opacity-35">{component.units}</div>
                        <div className="mt-3 text-[8px] leading-4 opacity-40">
                          {component.category} · {component.sourceId}
                          <br />
                          group {component.correlationGroup}
                        </div>
                      </div>
                    ))}
                    {selected.components.length === 0 ? (
                      <div className="col-span-full border border-[var(--v473-open)]/25 bg-[var(--v473-open)]/[.035] p-5">
                        <div className="text-[9px] uppercase tracking-[.18em] text-[var(--v473-open)]">
                          {selected.unavailableReason}
                        </div>
                        <p className="mt-3 text-[9px] leading-5 opacity-50">
                          没有数值就不生成预算，也不把 unavailable 写成零。
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                    <LedgerRow label="combination" value={selected.combinationPolicy} />
                    <LedgerRow
                      label="combined"
                      value={
                        selected.combinedValue === null
                          ? "separate channels"
                          : formatMetric(selected.combinedValue) + " " + selected.combinedUnits
                      }
                    />
                    <LedgerRow label="independence proven" value="false" />
                    <LedgerRow label="production closed" value="false" />
                  </div>
                  <div className="mt-5">
                    <div className="text-[8px] uppercase tracking-[.18em] opacity-35">
                      missing production components
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.missingProductionComponents.map((missing) => (
                        <span
                          className="border border-[var(--v473-open)]/20 px-2 py-1 text-[8px] text-[var(--v473-open)]/70"
                          key={missing}
                        >
                          {missing}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </article>
          </div>

          <div className="relative mt-6 border border-[var(--v473-open)]/20 bg-[var(--v473-open)]/[.025] p-5">
            <div className="text-[8px] uppercase tracking-[.2em] text-[var(--v473-open)]/75">
              production uncertainty ledger / OPEN
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {state.summary.productionLedger.missingComponentIds.map((missing) => (
                <div className="border-l border-white/15 pl-3 text-[9px] leading-5 opacity-50" key={missing}>
                  {missing}
                </div>
              ))}
            </div>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>linear sum 3 · max correlated 1 · separate channels 1 · RSS 0</span>
            <a
              className="border border-white/10 px-3 py-1.5 transition-colors hover:border-white/30 hover:opacity-90"
              href="/api/atlas/relativity-evidence/v473/observable-uncertainty?download=uncertainty-ledger"
            >
              导出不确定度账本
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
      <div className="text-[7px] uppercase tracking-[.16em] opacity-35">{label}</div>
      <div className="mt-1 text-lg text-[var(--v473-open)]">{value}</div>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/7 pb-2 text-[8px]">
      <span className="opacity-35">{label}</span>
      <span className="max-w-[70%] text-right text-[var(--v473-open)]">{value}</span>
    </div>
  );
}

function formatMetric(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 1000) return value.toExponential(4);
  return value.toPrecision(6);
}
