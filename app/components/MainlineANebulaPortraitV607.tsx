"use client";

import Image from "next/image";
import { useState } from "react";
import { getMainlineANebulaVisualAssetV607 } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { getMainlineANebulaVisualAssetV607All } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648, mainlineAWebNebulaPreviewV648 } from "../lib/mainlineAWebNebulaPreviewV648";

import { mainlineANebulaImageNoteM3 } from "../lib/mainlineANebulaImageNotesM3";

export default function MainlineANebulaPortraitV607({ objectId, title }: { objectId: string; title: string }) {
  const asset = getMainlineANebulaVisualAssetV607(objectId) ?? getMainlineANebulaVisualAssetV607All(objectId);
  const preview = mainlineAWebNebulaPreviewV648(objectId);
  const [gain, setGain] = useState(1);
  const [failed, setFailed] = useState(false);
  const available = MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.valid && preview?.available === true
    && preview.localPath === asset?.src && preview.localSha256 === asset?.sha256
    && preview.imageId === asset?.imageId && preview.sourcePage === asset?.sourcePage
    && preview.sourceLicenseLabel === asset?.license && preview.sourceCredit === asset?.credit
    && preview.humanRightsSignoff === "pending" && preview.releaseAdmission === "candidate-only";
  if (!asset || !available) return <div className="my-3 rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-[11px] text-amber-100/80" data-mainline-a-nebula-portrait={objectId} data-mainline-a-nebula-preview="marker-only" data-mainline-a-human-rights-signoff="pending">
    本地图像与来源或版权台账未闭合；仅显示目录信息。
  </div>;
  return <figure className="my-3 min-w-0 overflow-hidden rounded-md border border-slate-500/30 bg-[#060b12]" data-mainline-a-nebula-portrait={objectId} data-mainline-a-nebula-preview="candidate-only" data-mainline-a-human-rights-signoff="pending">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px]">
      <span className="min-w-0 truncate tracking-wide text-slate-300">候选观测影像 <span className="ml-1 font-mono text-slate-500">{asset.imageId}</span></span>
      <span className="shrink-0 rounded border border-amber-200/25 px-1.5 py-0.5 text-[9px] text-amber-100/80" data-mainline-a-rights-badge="pending-human-signoff">逐图版权待签</span>
      <button type="button" onClick={() => setGain(1)} disabled={gain === 1} className="min-h-9 rounded px-2 text-slate-300 hover:bg-white/10 disabled:opacity-40">恢复原图亮度</button>
    </div>
    {failed ? <p className="px-3 py-12 text-center text-sm text-slate-300">本地图像暂时无法载入，可从下方来源页查看。</p> : <Image
      src={asset.src} width={asset.dimensions.width} height={asset.dimensions.height}
      alt={`${title}：${mainlineANebulaImageNoteM3(objectId)}`} unoptimized loading="lazy"
      className="max-h-80 w-full object-contain" style={{ filter: gain === 1 ? "none" : `brightness(${gain})` }}
      onError={() => setFailed(true)} data-mainline-a-observation-image={asset.imageId}
    />}
    <div className="flex items-center gap-3 border-t border-slate-500/20 px-3 py-2">
      <label className="shrink-0 text-[10px] text-slate-400" htmlFor={`nebula-gain-${objectId}`}>画面增益</label>
      <input id={`nebula-gain-${objectId}`} aria-label="星云画面增益" type="range" min="0.5" max="1.5" step="0.05" value={gain} onChange={(event) => setGain(Number(event.target.value))} className="h-8 min-w-0 flex-1 accent-[#bdad8c]" />
      <output className="w-9 font-mono text-[10px] text-slate-300">{gain.toFixed(2)}×</output>
    </div>
    <figcaption className="space-y-2 px-3 pb-3 text-[10px] leading-4 text-slate-300">
      <p>{mainlineANebulaImageNoteM3(objectId)}</p>
      <p className="text-slate-400">波段：{asset.bands.join(" / ")}。保留官方构图和配色；画面增益仅改变屏幕显示，不是曝光时间或通量标定。图像视野与目录总角径不一定相同。</p>
      <p className="text-slate-400" data-mainline-a-image-modification>{gain === 1 ? "当前显示已校验的本地图像；无额外调色或裁剪。" : `当前仅将显示亮度乘以 ${gain.toFixed(2)}；图像文件保持原样。`}</p>
      <p className="text-amber-100/80" data-mainline-a-preview-rights-note>本地图像仅供候选视觉审阅；下方许可链接是来源标记，不代表项目逐图版权签署。</p>
      <p className="border-t border-slate-500/20 pt-2 text-slate-200" data-mainline-a-image-credit>{asset.credit}</p>
      <div className="flex flex-wrap gap-4 text-[#bfcee2]"><a href={asset.sourcePage} target="_blank" rel="noreferrer" className="underline underline-offset-2">官方来源与完整图像 ↗</a><a href={asset.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{asset.license}</a></div>
    </figcaption>
  </figure>;
}
