"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrResponseAwareSparseFitsSnapshotV537,
  loadKerrResponseAwareSparseFitsSummaryV537,
  subscribeKerrResponseAwareSparseFitsV537,
} from "../lib/kerrResponseAwareSparseFitsClientV537";
import {
  createKerrResponseAwareSparseFitsHudEncodingV537,
  resolveKerrResponseAwareSparseFitsHudProfileV537,
  type KerrResponseAwareSparseFitsHudModeV537,
} from "../lib/kerrResponseAwareSparseFitsV537";

function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "qualified" | "unavailable" }) {
  return <div className="rounded-2xl border border-white/10 bg-[var(--v537-raised)] p-4">
    <dt className="text-[8px] uppercase tracking-[.18em] text-[var(--v537-muted)]">{label}</dt>
    <dd className={tone === "qualified" ? "mt-2 text-sm text-[var(--v537-qualified)]" : tone === "unavailable" ? "mt-2 text-sm text-[var(--v537-unavailable)]" : "mt-2 text-sm"}>{value}</dd>
  </div>;
}

export default function KerrResponseAwareSparseFitsV537() {
  const [mode, setMode] = useState<KerrResponseAwareSparseFitsHudModeV537>("science");
  const state = useSyncExternalStore(subscribeKerrResponseAwareSparseFitsV537, getKerrResponseAwareSparseFitsSnapshotV537, getKerrResponseAwareSparseFitsSnapshotV537);
  const profile = resolveKerrResponseAwareSparseFitsHudProfileV537(mode);
  const summary = state.summary;
  const encoding = summary ? createKerrResponseAwareSparseFitsHudEncodingV537(summary, mode) : null;
  useEffect(() => { void loadKerrResponseAwareSparseFitsSummaryV537().catch(() => undefined); }, []);
  const style = {
    "--v537-panel": profile.panel,
    "--v537-raised": profile.panelRaised,
    "--v537-ink": profile.ink,
    "--v537-muted": profile.muted,
    "--v537-qualified": profile.qualified,
    "--v537-unavailable": profile.unavailable,
  } as CSSProperties;
  return <section
    style={style}
    className="mt-7 overflow-hidden rounded-[48px] border border-white/10 bg-[var(--v537-panel)] p-6 font-mono text-[var(--v537-ink)]"
    data-atlas-response-aware-sparse-fits-v537
    data-atlas-v537-mode={mode}
    data-atlas-v537-table-rows={encoding?.rowCount ?? 0}
    data-atlas-v537-table-columns={encoding?.columnCount ?? 0}
    data-atlas-v537-image-hdus="0"
    data-atlas-v537-raster-pixels="0"
    data-atlas-v537-canvas-created="false"
    data-atlas-v537-scene-revision-delta="0"
  >
    <header className="border-b border-white/10 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-[.44em] text-[var(--v537-muted)]">V537 / Science Cinematic V8.6</div>
          <h2 className="mt-4 font-serif text-4xl">四行标准 FITS 表，不是科学图像</h2>
        </div>
        <div className="flex border border-white/10">
          {(["science", "cinematic"] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} className={mode === item ? "bg-white/10 px-3 py-2 text-[8px] text-white" : "px-3 py-2 text-[8px] text-[var(--v537-muted)]"} onClick={() => setMode(item)}>{item}</button>)}
        </div>
      </div>
      <p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v537-muted)]">v536 的四个连续 WCS 样本已发布为标准 FITS binary table。Primary HDU 的 NAXIS 为 0，唯一扩展是 SPARSE_SCIENCE 表；没有 image HDU、像素采样、插值或最近像素赋值。</p>
    </header>
    {!summary ? <div className="mt-6 text-[10px] text-[var(--v537-muted)]">{state.status === "unavailable" ? `FITS 表不可用 / ${state.reason ?? "request-failed"}` : "正在读取 FITS provenance…"}</div> : <>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="binary table" value={`${summary.fits.rowCount} rows × ${summary.fits.columnCount} columns`} tone="qualified" />
        <Metric label="HDU layout" value={`primary NAXIS ${summary.fits.primaryNaxis} · table ${summary.fits.binaryTableHduCount}`} />
        <Metric label="integrity" value={`CHECKSUM/DATASUM ${summary.fits.checksumCardCount}/4`} tone="qualified" />
        <Metric label="A/B replay" value={summary.fits.abByteIdentical ? "byte-identical" : "failed"} tone={summary.fits.abByteIdentical ? "qualified" : "unavailable"} />
        <Metric label="image HDU" value="0 · unavailable" tone="unavailable" />
        <Metric label="raster pixels" value="0 · unavailable" tone="unavailable" />
        <Metric label="physical uncertainty" value="unavailable · calibration 0/6" tone="unavailable" />
        <Metric label="dense campaign" value="incomplete 0/49" tone="unavailable" />
      </dl>
      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-[9px] leading-5 text-[var(--v537-muted)] lg:grid-cols-[1fr_auto] lg:items-center">
        <div><span className="text-[var(--v537-qualified)]">{summary.fits.tableName}</span> 保存 ray identity、连续 WCS、屏幕坐标、redshift、EVPA、归一化偏振方向、photon radiance、response Jacobian、非线性余项与逐行 SHA。Science 与 Cinematic 读取同一不可变表，不修改科学字段。</div>
        <div className="flex flex-wrap gap-2">
          <a className="border border-white/15 px-3 py-2 text-[8px] text-white/70" href="/api/atlas/relativity-evidence/v537/response-aware-sparse-fits?download=fits">下载 FITS binary table</a>
          <a className="border border-white/15 px-3 py-2 text-[8px] text-white/70" href="/api/atlas/relativity-evidence/v537/response-aware-sparse-fits?download=atlas">下载 provenance JSON</a>
        </div>
      </div>
    </>}
  </section>;
}
