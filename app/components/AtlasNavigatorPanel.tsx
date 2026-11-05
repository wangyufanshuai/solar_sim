"use client";

import { Command, Crosshair, Database, FileCheck2, FlaskConical, Layers3, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ATLAS_NAVIGATOR_VERSION } from "../lib/atlasNavigator";
import type { AtlasNavigatorItem, AtlasNavigatorItemKind, AtlasNavigatorSummary } from "../lib/simulationDiagnosticsTypes";
import CatalogPackManager from "./CatalogPackManager";

type AtlasNavigatorPanelProps = {
  open: boolean;
  summary: AtlasNavigatorSummary;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onExecute: (item: AtlasNavigatorItem) => void;
  onSelectedIdChange?: (itemId: string) => void;
};

const KIND_LABELS: Record<AtlasNavigatorItemKind, string> = {
  "solar-body": "太阳系",
  "celestial-object": "深空目录",
  "gaia-star": "恒星目录",
  "evidence-claim": "科学证据",
  "panel-action": "功能面板",
};

export default function AtlasNavigatorPanel({ open, summary, query, onQueryChange, onClose, onExecute, onSelectedIdChange }: AtlasNavigatorPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const results = summary.results;
  const safeSelectedIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0;
  const selectedItem = results[safeSelectedIndex] ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedIndex(0);
      onSelectedIdChange?.("");
      return;
    }
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [onSelectedIdChange, open]);
  useEffect(() => setSelectedIndex(0), [query]);
  useEffect(() => {
    if (selectedIndex !== safeSelectedIndex) setSelectedIndex(safeSelectedIndex);
  }, [safeSelectedIndex, selectedIndex]);
  useEffect(() => {
    onSelectedIdChange?.(open ? selectedItem?.id ?? "" : "");
  }, [onSelectedIdChange, open, selectedItem?.id]);

  const executeItem = useCallback((item: AtlasNavigatorItem | null) => {
    if (item && !item.disabled) onExecute(item);
  }, [onExecute]);
  const closeWithFocusReturn = useCallback(() => {
    onClose();
    window.requestAnimationFrame(() => {
      const target = returnFocusRef.current;
      if (target && target.isConnected && !target.hasAttribute("disabled")) {
        target.focus({ preventScroll: true });
      } else {
        document.querySelector<HTMLElement>('[data-atlas-accessibility-return-target="search"]')?.focus({ preventScroll: true });
      }
    });
  }, [onClose]);
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeWithFocusReturn();
      return;
    }
    if (event.key === "Tab") {
      const dialog = dialogRef.current;
      const focusable = dialog
        ? Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        )).filter((element) => element.getAttribute("aria-hidden") !== "true" && element.offsetParent !== null)
        : [];
      if (focusable.length > 0) {
        event.preventDefault();
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex < 0
          ? 0
          : (currentIndex + direction + focusable.length) % focusable.length;
        focusable[nextIndex]?.focus({ preventScroll: true });
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => results.length ? (index + 1) % results.length : 0);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => results.length ? (index - 1 + results.length) % results.length : 0);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      executeItem(selectedItem);
    }
  }, [closeWithFocusReturn, executeItem, results.length, selectedItem]);
  const resultCountLabel = useMemo(() => `${summary.resultCount} / ${summary.itemCount}`, [summary.itemCount, summary.resultCount]);
  if (!open) return null;

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[106] text-white" data-atlas-navigator-version={ATLAS_NAVIGATOR_VERSION} data-atlas-navigator-open="true" data-atlas-navigator-query={query} data-atlas-navigator-result-count={summary.resultCount} data-atlas-navigator-selected-id={selectedItem?.id ?? ""} data-atlas-accessibility-surface-id="navigator" data-atlas-accessibility-focus-target="true" data-no-escape-clear onKeyDown={handleKeyDown} aria-label="图谱导航" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default bg-black/38 backdrop-blur-[2px]" onClick={closeWithFocusReturn} tabIndex={-1} aria-hidden="true" />
      <section className="atlas-accessible-surface atlas-cinematic-workbench pointer-events-auto absolute inset-x-2 bottom-[calc(var(--ui-dock-height)+10px+env(safe-area-inset-bottom))] overflow-hidden rounded-lg border shadow-[0_28px_90px_rgba(0,0,0,0.58)] sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-16 sm:w-[42rem] sm:max-w-[calc(100vw-1.5rem)] sm:-translate-x-1/2" data-atlas-accessibility-focus-target="true">
        <header className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-100/14 bg-cyan-100/[0.055] text-cyan-50/80"><Command className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] uppercase text-cyan-100/58">图谱导航<span className="ui-instrument rounded border border-white/10 px-1.5 py-0.5 text-[8px] text-white/36">{resultCountLabel}</span></div>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] px-2.5 py-1.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--atlas-a11y-text-muted)]" />
              <input ref={inputRef} value={query} onChange={(event) => onQueryChange(event.target.value)} className="atlas-accessible-focus h-9 min-w-0 flex-1 bg-transparent text-[14px] text-[var(--atlas-a11y-text-primary)] placeholder:text-[var(--atlas-a11y-text-muted)]" placeholder="搜索火星、天狼星、HD 209458、Gaia source ID、相对论..." aria-label="搜索图谱导航" data-no-escape-clear />
            </div>
          </div>
          <button type="button" onClick={closeWithFocusReturn} className="atlas-accessible-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/48 hover:bg-white/8 hover:text-white/86" aria-label="关闭图谱导航"><X className="h-4 w-4" /></button>
        </header>

        <div className="max-h-[min(58dvh,29rem)] overflow-y-auto px-2 py-2">
          {results.length > 0 ? (
            <div className="grid gap-1.5">
              {results.map((item, index) => <ResultRow key={item.id} item={item} selected={index === safeSelectedIndex} onPointerEnter={() => setSelectedIndex(index)} onExecute={() => executeItem(item)} />)}
            </div>
          ) : (
            <div className="px-4 py-7 text-center">
              <div className="text-[13px] text-white/72">没有匹配的本地目录或科学入口</div>
              <div className="mt-1 text-[11px] text-white/42">普通 Gaia 恒星可通过完整 source ID、designation 或坐标检索；不会伪造常用名称。</div>
            </div>
          )}
        </div>

        <footer className="grid gap-2 border-t border-white/10 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <CatalogPackManager />
          <span className="text-[9px] text-white/32">方向键选择 / Enter 打开 / Esc 关闭</span>
        </footer>
      </section>
    </div>
  );
}

function ResultRow({ item, selected, onPointerEnter, onExecute }: { item: AtlasNavigatorItem; selected: boolean; onPointerEnter: () => void; onExecute: () => void }) {
  const Icon = iconForItem(item.kind);
  return (
    <button type="button" onClick={onExecute} onPointerEnter={onPointerEnter} disabled={item.disabled} className={`atlas-accessible-focus grid min-h-[4.4rem] w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-3 rounded-md border px-3 py-2.5 text-left ${selected ? "border-cyan-100/26 bg-cyan-100/[0.075]" : "border-white/8 bg-white/[0.028] hover:border-white/14 hover:bg-white/[0.05]"} ${item.disabled ? "cursor-not-allowed opacity-45" : ""}`} data-atlas-navigator-item-id={item.id} data-atlas-navigator-item-kind={item.kind} data-atlas-navigator-item-action={item.action} aria-current={selected ? "true" : undefined}>
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/22 text-cyan-50/70"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-[12px] font-medium text-white/84">{item.title}</span><span className="shrink-0 rounded border border-white/9 px-1.5 py-0.5 text-[8px] text-white/34">{KIND_LABELS[item.kind]}</span></span><span className="mt-1 block truncate text-[10px] text-white/44">{item.subtitle}</span><span className="mt-1 block truncate text-[9px] text-cyan-50/38">{item.primaryMetric}</span></span>
      <span className="self-center whitespace-nowrap text-[9px] text-cyan-50/50">{item.actionLabel}</span>
    </button>
  );
}

function iconForItem(kind: AtlasNavigatorItemKind) {
  if (kind === "solar-body") return Crosshair;
  if (kind === "celestial-object") return Layers3;
  if (kind === "gaia-star") return Database;
  if (kind === "evidence-claim") return FileCheck2;
  return FlaskConical;
}
