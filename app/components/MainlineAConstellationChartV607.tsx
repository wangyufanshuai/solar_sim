"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import { mainlineAConstellationAppearanceM4, resolveMainlineAConstellationAppearanceM4 } from "../lib/mainlineAConstellationAppearanceM4";
import { fitSkyChartV607 } from "../lib/skyChartProjectionV607";
import { selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { mainlineAConstellationChartLabelV638, mainlineAConstellationChartRadiusV638, mainlineAConstellationStarPriorityV638 } from "../lib/mainlineAConstellationPresentationV638";

export default function MainlineAConstellationChartV607({ code, onSelectObject }: { code: string; onSelectObject?: (id: string) => void }) {
  const figure = MAINLINE_A_CONSTELLATION_FIGURES_V607[code];
  const [showBoundary, setShowBoundary] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const appearance = useMemo(() => resolveMainlineAConstellationAppearanceM4(code, mobile), [code, mobile]);
  const style = appearance?.style ?? mainlineAConstellationAppearanceM4(mobile);
  const titleId = useId();
  const fieldId = useId();
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const geometry = useMemo(() => {
    if (!figure || !figure.stars.length) return null;
    const boundary = appearance?.boundary ?? [];
    const projection = fitSkyChartV607(showBoundary ? [...figure.stars, ...boundary] : figure.stars);
    return {
      stars: figure.stars.map((star) => ({ ...star, ...projection.project(star) })),
      boundary: boundary.map((point) => { const { x, y } = projection.project(point); return `${x.toFixed(2)},${y.toFixed(2)}`; }).join(" "),
    };
  }, [appearance, figure, showBoundary]);
  if (!figure) return null;
  if (!geometry) return <p role="status" data-mainline-a-star-chart={code} data-mainline-a-chart-source="incomplete"
    className="my-3 rounded border border-amber-200/20 p-3 text-xs text-amber-100">{figure.nameCn}的实名锚点资料待补，暂不绘制连线。</p>;
  const selected = geometry.stars.find((star) => star.id === selectedId)
    ?? [...geometry.stars].sort((a, b) => mainlineAConstellationStarPriorityV638(a) - mainlineAConstellationStarPriorityV638(b))[0];
  const catalogId = [`nearby-star:${selected.id}`, `bright-star:${selected.id}`].find((id) => selectCelestialCatalogEntry(id));
  const pointById = new Map(geometry.stars.map((star) => [star.id, star]));

  return <figure className="my-3 overflow-hidden rounded-md border border-[#c3b18a]/25 bg-[#080e16]" data-mainline-a-star-chart={code}
    data-mainline-a-chart-source={figure.sourceComplete ? "candidate-only" : "incomplete"}
    data-mainline-a-chart-scientific-writeback="false">
    <div className="flex items-center justify-between gap-2 px-3 pt-3">
      <figcaption className="min-w-0 truncate text-[11px] tracking-wide text-[#e4d8bb]">{figure.nameCn}<span className="ml-2 font-mono text-[9px] text-slate-500">{code.toUpperCase()} / J2000</span></figcaption>
      <span className="hidden shrink-0 font-mono text-[9px] text-slate-500 sm:inline" data-mainline-a-chart-star-count>{geometry.stars.length} anchors</span>
      <button type="button" aria-pressed={showBoundary} onClick={() => setShowBoundary((show) => !show)} className="min-h-9 rounded px-2 text-[10px] text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200">{showBoundary ? "隐藏边界" : "查看 IAU 边界"}</button>
    </div>
    {!figure.sourceComplete ? <p role="status" className="mx-3 mt-2 rounded bg-amber-900/20 px-2 py-1 text-[11px] leading-4 text-amber-100">
      资料待补：{figure.missingAnchorIds.join("、")}。仅显示已解析的成员和线段，缺项不以邻近恒星替代。
    </p> : null}
    <svg viewBox="0 0 360 260" className="block w-full" aria-labelledby={titleId} data-mainline-a-chart-boundary={showBoundary}>
      <title id={titleId}>{`${figure.nameCn}星图，北向上、东向左。选择星点查看名称与视星等。`}</title>
      <defs>
        <radialGradient id={fieldId} cx="50%" cy="44%" r="72%">
          <stop offset="0" stopColor="#18283b" stopOpacity=".9" />
          <stop offset=".58" stopColor="#0b1524" stopOpacity=".78" />
          <stop offset="1" stopColor="#050a12" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="360" height="260" rx="3" fill={`url(#${fieldId})`} />
      <path d="M28 130H332 M180 26V234" stroke="#9cb0c7" strokeOpacity=".08" strokeWidth=".6" strokeDasharray="2 5" />
      <path d="M18 44V18H44 M316 18H342V44 M18 216V242H44 M316 242H342V216" fill="none" stroke="#7c8da3" strokeOpacity=".25" />
      <g fill="#8695a9" fontSize="9" fontFamily="monospace"><text x="181" y="16" textAnchor="middle">N</text><text x="9" y="134">E</text></g>
      {showBoundary && appearance ? <polygon points={geometry.boundary} fill="none"
        stroke={style.boundaryColor} strokeOpacity={style.boundaryOpacity} strokeWidth={style.boundaryWidthCssPx}
        strokeDasharray={`${style.boundaryDashCssPx} ${style.boundaryGapCssPx}`} vectorEffect="non-scaling-stroke"
        data-mainline-a-chart-boundary-code={appearance.code} /> : null}
      <g stroke={style.lineColor} strokeWidth={style.lineWidthCssPx} strokeOpacity={style.lineOpacity} strokeLinecap="round"
        data-mainline-a-chart-figure-lines>
        {figure.segments.map(([a, b]) => <line key={`${a}-${b}`} vectorEffect="non-scaling-stroke"
          x1={pointById.get(a)!.x} y1={pointById.get(a)!.y} x2={pointById.get(b)!.x} y2={pointById.get(b)!.y} />)}
      </g>
      {geometry.stars.map((star) => {
        const active = selected.id === star.id;
        const radius = mainlineAConstellationChartRadiusV638(star.magV);
        const label = mainlineAConstellationChartLabelV638(star.nameCn, star.x, star.y);
        return <g key={star.id} role="button" tabIndex={0} aria-label={`查看 ${star.nameCn} ${star.name}`} aria-pressed={active} onClick={() => setSelectedId(star.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(star.id); } }} className="group cursor-pointer outline-none" data-mainline-a-chart-star={star.id}>
          <title>{`${star.nameCn} · ${star.name} · ${star.magV === null ? "未提供 V 星等" : `V ${star.magV.toFixed(2)}`}`}</title>
          <circle cx={star.x} cy={star.y} r="14" fill="transparent" />
          <circle cx={star.x} cy={star.y} r={radius * 3} fill={style.anchorColor} opacity={active ? .15 : .06} />
          <circle cx={star.x} cy={star.y} r={radius + 6} fill="none" stroke={style.activeAnchorColor}
            strokeWidth={style.activeRingWidthCssPx} vectorEffect="non-scaling-stroke"
            className={active ? "opacity-80" : "opacity-0 group-hover:opacity-70 group-focus-visible:opacity-100"} />
          <circle cx={star.x} cy={star.y} r={radius} fill={style.anchorColor} />
          {active ? <text x={label.left} y={label.top} fill="#ece4d4" fontSize="11" stroke="#080e16" strokeWidth="3" paintOrder="stroke">
            {label.lines.map((line, index) => <tspan key={index} x={label.left} dy={index ? 14 : 0}>{line}</tspan>)}
          </text> : null}
        </g>;
      })}
    </svg>
    <div className="flex min-h-14 items-center justify-between gap-2 border-t border-white/10 px-3 py-2" aria-live="polite">
      <div className="min-w-0"><div className="text-[12px] text-[#e8ddc7]">{selected.nameCn} <span className="ml-1 text-[10px] text-slate-400">{selected.name}</span></div><div className="mt-1 font-mono text-[10px] text-slate-400">{selected.magV === null ? "未提供 V 星等" : `V ${selected.magV.toFixed(2)}`} · RA {selected.raDeg.toFixed(2)}° · Dec {selected.decDeg.toFixed(2)}°</div></div>
      {catalogId && onSelectObject ? <button type="button" onClick={() => onSelectObject(catalogId)} className="min-h-10 shrink-0 rounded border border-[#bcaa81]/30 px-2 text-[10px] text-[#e8d7b0] hover:bg-[#bcaa81]/10 focus-visible:outline-2 focus-visible:outline-amber-200">聚焦此恒星 →</button> : null}
    </div>
    <p className="px-3 pb-3 text-[10px] leading-4 text-slate-400">选择星点查看详情。主场景与此图共用实名锚点和独立线段；位置来自项目 J2000 目录与留存的原始源目录。实线是星座图示，虚线是 IAU 边界。点色、点径为示意；无 V 星等的点使用统一点径。候选展示仍待审核，不代表科学身份准入。{showBoundary ? "当前已显示 IAU 边界环。" : "打开边界开关可查看 IAU 边界环。"}</p>
  </figure>;
}
