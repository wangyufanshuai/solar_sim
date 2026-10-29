"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import {
  STELLAR_ATLAS_FAMILIES, selectStellarAtlasStars, stellarAtlasColor,
  stellarAtlasGeometry, stellarAtlasReferenceRadius, stellarAtlasFocusTarget,
  type StellarAtlasFamily, type StellarAtlasOrder, type StellarAtlasScale,
} from "../lib/mainlineAStellarAtlasV608";
import MainlineAStellarPortraitV607 from "./MainlineAStellarPortraitV607";

type Props = { onClose: () => void; onFocus: (direction: [number, number, number], catalogId?: string) => void };

export default function MainlineAStellarAtlasV608({ onClose, onFocus }: Props) {
  const [family, setFamily] = useState<StellarAtlasFamily>("all");
  const [search, setSearch] = useState("");
  const [scale, setScale] = useState<StellarAtlasScale>("normalized");
  const [order, setOrder] = useState<StellarAtlasOrder>("catalog");
  const [selectedId, setSelectedId] = useState("altair");
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const stars = useMemo(() => selectStellarAtlasStars(MAINLINE_A_CURRENT_STARS, { family, search, order }), [family, search, order]);
  const referenceRadius = stellarAtlasReferenceRadius(MAINLINE_A_CURRENT_STARS);
  const selected = MAINLINE_A_CURRENT_STARS.find((star) => star.id === selectedId) ?? MAINLINE_A_CURRENT_STARS[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  function focusSelected() {
    const target = stellarAtlasFocusTarget(selected);
    onFocus(target.direction, target.catalogId);
    onClose();
  }

  function selectPortrait(id: string) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby={headingId}
      className="fixed m-auto h-[min(850px,94dvh)] max-h-[94dvh] w-[min(1180px,96vw)] max-w-[96vw] overflow-hidden rounded-xl border border-amber-100/20 bg-[#071018] p-0 text-slate-200 shadow-2xl backdrop:bg-black/75"
      data-mainline-a-stellar-atlas="true" data-mainline-a-atlas-scale={scale}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <div className="font-mono text-[9px] tracking-[.3em] text-amber-100/50">STELLAR ATLAS / MAINLINE A</div>
            <h2 id={headingId} className="mt-1 text-lg text-amber-50">恒星图集 <span className="ml-2 font-mono text-xs text-slate-500">{MAINLINE_A_CURRENT_STARS.length} 颗光球示意</span></h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭恒星图集" className="min-h-11 rounded px-3 text-sm hover:bg-white/10">关闭 ×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_340px]">
            <section ref={listRef} aria-label="恒星对照" className="min-w-0 p-4 sm:p-6 lg:overflow-y-auto">
              <p className="mb-4 max-w-xl text-xs leading-6 text-slate-400">从橙红色巨星到蓝白色亮星，比较目录参数塑造的光球。选择一颗恒星查看细节，再回到星空定位。</p>
              <div className="flex flex-wrap gap-1.5" aria-label="色温与形态筛选">
                {STELLAR_ATLAS_FAMILIES.map((item) => <button key={item.id} type="button" onClick={() => setFamily(item.id)} aria-pressed={family === item.id}
                  className={`min-h-10 rounded border px-2.5 text-[11px] ${family === item.id ? "border-amber-100/40 bg-amber-100/10 text-amber-50" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>{item.label}</button>)}
              </div>
              <div className="my-3 flex flex-wrap gap-2">
                <input aria-label="搜索恒星图集" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="名称、星座或光谱型"
                  className="min-h-10 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs" />
                <select aria-label="恒星排序" value={order} onChange={(event) => setOrder(event.target.value as StellarAtlasOrder)} className="min-h-10 rounded border border-white/15 bg-[#101c29] px-2 text-xs">
                  <option value="catalog">图集顺序</option><option value="temperature">色温从低到高</option><option value="radius">半径从小到大</option>
                </select>
              </div>
              <div className="mb-4 rounded border border-white/10 bg-white/[0.02] p-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-pressed={scale === "normalized"} onClick={() => setScale("normalized")} className="min-h-9 rounded border border-white/15 px-2 text-xs aria-pressed:border-cyan-200/40 aria-pressed:text-cyan-100">按卡片归一</button>
                  <button type="button" aria-pressed={scale === "shared-radius"} onClick={() => setScale("shared-radius")} className="min-h-9 rounded border border-white/15 px-2 text-xs aria-pressed:border-cyan-200/40 aria-pressed:text-cyan-100">统一半径比例</button>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-slate-400">{scale === "normalized"
                  ? "每张光球填满相同画幅，便于比较颜色与扁率；大小不代表真实半径或视亮度。"
                  : `全图使用线性半径比例，最大展示半径 ${referenceRadius.toLocaleString("zh-CN")} R☉。小于一像素的光球用十字定位，不额外放大。`}</p>
              </div>
              <p role="status" className="mb-2 text-xs text-slate-500">显示 {stars.length} / {MAINLINE_A_CURRENT_STARS.length} 颗</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-mainline-a-atlas-result-count={stars.length}>
                {stars.map((star) => {
                  const geometry = stellarAtlasGeometry(star, scale, referenceRadius);
                  const color = stellarAtlasColor(star.artDirection.colorTemperatureK);
                  const glyphId = `${headingId}-${star.id}`;
                  return <button key={star.id} type="button" onClick={() => selectPortrait(star.id)} aria-pressed={star.id === selectedId}
                    data-mainline-a-atlas-star={star.id} aria-label={`查看 ${star.displayName}`}
                    className={`min-w-0 overflow-hidden rounded-lg border p-2 text-left transition-colors ${star.id === selectedId ? "border-amber-100/45 bg-[#16212c]" : "border-white/10 bg-[#0a151f] hover:border-slate-500"}`}>
                    <svg viewBox="0 0 150 100" className="w-full" aria-hidden="true">
                      <defs>
                        <radialGradient id={`${glyphId}-body`} cx="42%" cy="36%" r="66%">
                          <stop offset="0" stopColor="#fff7e6" />
                          <stop offset=".35" stopColor={color} />
                          <stop offset=".75" stopColor={color} stopOpacity=".82" />
                          <stop offset="1" stopColor={color} stopOpacity=".22" />
                        </radialGradient>
                        <radialGradient id={`${glyphId}-halo`}>
                          <stop offset=".45" stopColor={color} stopOpacity=".16" />
                          <stop offset="1" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <ellipse cx="75" cy="46" rx={geometry.rx * 1.5} ry={geometry.ry * 1.5} fill={`url(#${glyphId}-halo)`} />
                      <ellipse cx="75" cy="46" rx={geometry.rx} ry={geometry.ry} fill={`url(#${glyphId}-body)`} />
                      {geometry.subpixel ? <path d="M68 46h-5m19 0h5M75 39v-5m0 19v5" stroke="#a9b8c8" strokeWidth=".6" /> : null}
                      <path d="M15 85H135" stroke="#ffffff" strokeOpacity=".06" />
                    </svg>
                    <span className="block truncate text-xs text-slate-100">{star.displayName}</span>
                    <span className="mt-1 block truncate font-mono text-[9px] text-slate-400">{star.artDirection.colorTemperatureK.toLocaleString("zh-CN")} K · {star.artDirection.radiusSolar.toLocaleString("zh-CN")} R☉</span>
                  </button>;
                })}
              </div>
              {!stars.length ? <p className="py-8 text-center text-sm text-slate-400">没有匹配的恒星，试试其他名称或类别。</p> : null}
            </section>
            <aside ref={detailRef} aria-label="已选恒星" className="min-w-0 border-t border-white/10 bg-[#0b141e] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0" data-mainline-a-atlas-selected={selected.id}>
              <button type="button" onClick={() => listRef.current?.scrollIntoView({ block: "start" })} className="mb-3 min-h-10 rounded border border-white/15 px-3 text-xs text-slate-300 lg:hidden">← 返回恒星列表</button>
              <h3 className="text-base text-amber-50">{selected.displayName}</h3>
              <p className="mt-1 text-xs text-slate-400">{selected.narrative.summaryCn}</p>
              <MainlineAStellarPortraitV607 key={selected.id} objectId={selected.id} title={selected.displayName} profile={selected.artDirection} />
              <p className="text-xs leading-6 text-slate-400">{selected.narrative.detailCn}</p>
              <button type="button" onClick={focusSelected} className="mt-4 min-h-11 w-full rounded border border-amber-100/30 bg-amber-100/10 text-sm text-amber-50 hover:bg-amber-100/15">在星空中定位</button>
              <a href={selected.evidence.sources[0]?.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block py-2 text-center text-xs text-cyan-100/65 underline">查看 SIMBAD 来源参考</a>
            </aside>
          </div>
        </div>
      </div>
    </dialog>
  );
}
