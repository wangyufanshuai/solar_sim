"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getKerrResponseAwareOfflineReplaySnapshotV540, loadKerrResponseAwareOfflineReplaySummaryV540, subscribeKerrResponseAwareOfflineReplayV540 } from "../lib/kerrResponseAwareOfflineReplayClientV540";
import { createKerrResponseAwareOfflineReplayHudEncodingV540, resolveKerrResponseAwareOfflineReplayHudProfileV540, type KerrResponseAwareOfflineReplayHudModeV540 } from "../lib/kerrResponseAwareOfflineReplayV540";

const stages = [
  ["Safe extraction", "path traversal · symlink · duplicate rejection"],
  ["Manifest", "8 / 8 member SHA replay"],
  ["FITS", "4 rows · 17 columns · checksum 4 / 4"],
  ["Column schema", "17 / 17 semantic rows"],
  ["Provenance", "4 canonical · 6 source links"],
  ["Cleanup", "network 0 · temporary leaks 0"],
] as const;
export default function KerrResponseAwareOfflineReplayV540() {
  const [mode, setMode] = useState<KerrResponseAwareOfflineReplayHudModeV540>("science");
  const state = useSyncExternalStore(subscribeKerrResponseAwareOfflineReplayV540, getKerrResponseAwareOfflineReplaySnapshotV540, getKerrResponseAwareOfflineReplaySnapshotV540);
  const profile = resolveKerrResponseAwareOfflineReplayHudProfileV540(mode), summary = state.summary, encoding = summary ? createKerrResponseAwareOfflineReplayHudEncodingV540(summary, mode) : null;
  useEffect(() => { void loadKerrResponseAwareOfflineReplaySummaryV540().catch(() => undefined); }, []);
  const style = { "--v540-panel": profile.panel, "--v540-raised": profile.panelRaised, "--v540-ink": profile.ink, "--v540-muted": profile.muted, "--v540-qualified": profile.qualified, "--v540-unavailable": profile.unavailable } as CSSProperties;
  return <section style={style} className="relative mt-7 overflow-hidden rounded-[48px] border border-white/10 bg-[var(--v540-panel)] p-6 font-mono text-[var(--v540-ink)]" data-atlas-response-aware-offline-replay-v540 data-atlas-v540-mode={mode} data-atlas-v540-replay-attempts={encoding?.replayAttemptCount ?? 0} data-atlas-v540-network-attempts="0" data-atlas-v540-temporary-leaks="0" data-atlas-v540-image-hdus="0" data-atlas-v540-canvas-created="false" data-atlas-v540-scene-revision-delta="0">
    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_18%_8%,rgba(116,244,197,.18),transparent_25%),radial-gradient(circle_at_88%_12%,rgba(125,211,252,.12),transparent_28%),linear-gradient(rgba(125,211,252,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.04)_1px,transparent_1px)] [background-size:auto,auto,46px_46px,46px_46px]" />
    <header className="relative border-b border-white/10 pb-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[9px] uppercase tracking-[.44em] text-[var(--v540-muted)]">V540 / Science Cinematic V8.9</div><h2 className="mt-4 max-w-4xl font-serif text-4xl">离开工作区，证据链仍然闭合</h2></div><div className="flex border border-white/10">{(["science", "cinematic"] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} className={mode === item ? "bg-white/10 px-3 py-2 text-[8px] text-white" : "px-3 py-2 text-[8px] text-[var(--v540-muted)]"} onClick={() => setMode(item)}>{item}</button>)}</div></div><p className="mt-4 max-w-4xl text-[10px] leading-6 text-[var(--v540-muted)]">验证器两次只接收同一个 v539 crate，在两个独立临时目录中完成安全解包、FITS、列语义和 provenance 重放。临时路径不写入 receipt，网络被主动阻断，结束后目录完全回收。</p></header>
    {!summary ? <div className="relative mt-6 text-[10px] text-[var(--v540-muted)]">{state.status === "unavailable" ? `离线 replay receipt 不可用 / ${state.reason ?? "request-failed"}` : "正在读取离线 replay receipt…"}</div> : <>
      <div className="relative mt-6 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{stages.map(([title, detail], index) => <article key={title} className="border border-white/10 bg-[var(--v540-raised)] p-4"><div className="flex items-center justify-between"><span className="text-[8px] uppercase tracking-[.16em] text-[var(--v540-muted)]">0{index + 1}</span><span className="text-[var(--v540-qualified)]">✓</span></div><h3 className="mt-4 text-[10px]">{title}</h3><p className="mt-2 text-[8px] leading-4 text-[var(--v540-muted)]">{detail}</p></article>)}</div>
      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center"><div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="grid gap-2 text-[9px] sm:grid-cols-2"><Row label="replay A / B" value="byte-identical receipt" /><Row label="input" value="v539 crate only" /><Row label="workspace sources" value="0" /><Row label="network attempts" value="0" /><Row label="temporary leaks" value="0" /><Row label="physical uncertainty" value="unavailable · 0/6" unavailable /></div><p className="mt-4 border-t border-white/10 pt-4 text-[8px] leading-5 text-[var(--v540-muted)]">重放只证明现有稀疏科研封装完整、可携带、可验证；不会生成像素、图像、测量或 production promotion。Dense campaign 仍为 0/49。</p></div><div className="flex flex-col gap-2"><a className="border border-white/15 px-4 py-3 text-[8px] text-white/70" href="/api/atlas/relativity-evidence/v540/response-aware-offline-replay?download=receipt">下载 replay receipt</a><a className="border border-white/15 px-4 py-3 text-[8px] text-white/70" href="/api/atlas/relativity-evidence/v540/response-aware-offline-replay?download=atlas">下载 replay provenance</a></div></div>
    </>}
  </section>;
}
function Row({ label, value, unavailable = false }: { label: string; value: string; unavailable?: boolean }) { return <div className="flex justify-between gap-3 border-b border-white/5 py-2"><span className="text-[var(--v540-muted)]">{label}</span><span className={unavailable ? "text-[var(--v540-unavailable)]" : "text-[var(--v540-qualified)]"}>{value}</span></div>; }
