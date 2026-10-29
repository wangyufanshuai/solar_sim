"use client";

import { Fragment, useId, useMemo, useState } from "react";
import type { StellarPresentationProfileV607 } from "../lib/celestialObjectContractV607";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveMainlineAStellarPresentationM2 } from "../lib/mainlineAStellarPresentationM2";
import type { StellarArchetypeV1 } from "../lib/stellarArchetypeProfileV1";

const MORPHOLOGY_LABELS: Record<StellarArchetypeV1, string> = {
  "hot-radiative": "细密辐射层纹理",
  "blue-supergiant-wind": "辐射层与疏松风层",
  "solar-like-convective": "细胞状对流纹理",
  "cool-convective": "宽阔对流细胞",
  "red-giant-supergiant": "大尺度对流细胞",
  "warm-radiative-convective": "辐射层与对流纹理",
  "rapid-rotator-gravity-darkened": "极区增亮与赤道暗化",
};

// Noise supplies one scalar multiplier for all three channels. It cannot
// replace the shared scene colour with the grey output of feTurbulence.
function luminanceMatrix(strength: number) {
  const amount = Math.min(0.84, Math.max(0, strength * 0.7));
  // Keep the typical noise sample close to neutral brightness instead of
  // accumulating three large exposure reductions over the shared palette.
  const row = `${0.2126 * amount} ${0.7152 * amount} ${0.0722 * amount} 0 ${1 - amount * 0.65}`;
  // feTurbulence generates alpha noise too. The multiplier must be opaque;
  // otherwise three arithmetic composites multiply the photosphere's alpha.
  return `${row} ${row} ${row} 0 0 0 0 1`;
}

/** Display palette interpolation only, not a synthetic spectrum or Gaia colour. */
function temperaturePalette(temperatureK: number) {
  const anchors = [[3000, 255, 142, 79], [6500, 255, 246, 224], [15000, 161, 198, 255], [30000, 141, 179, 255]];
  const temperature = Math.max(3000, Math.min(30000, temperatureK));
  const index = anchors.findIndex((anchor) => anchor[0] >= temperature);
  const right = anchors[Math.max(0, index)];
  const left = anchors[Math.max(0, index - 1)];
  const t = right[0] === left[0] ? 0 : (temperature - left[0]) / (right[0] - left[0]);
  return `rgb(${[1, 2, 3].map((channel) => Math.round(left[channel] * (1 - t) + right[channel] * t)).join(",")})`;
}

export default function MainlineAStellarPortraitV607({ objectId, title, profile }: {
  objectId: string; title: string; profile: StellarPresentationProfileV607;
}) {
  const uid = useId().replace(/:/g, "");
  const [surface, setSurface] = useState(true);
  const mode = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode === "research" ? "science" : "cinematic");
  const shared = useMemo(() => resolveMainlineAStellarPresentationM2(objectId, mode), [objectId, mode]);
  const appearance = shared?.appearance;
  const ratio = appearance?.axisRatio ?? Math.max(1, profile.equatorialPolarRadiusRatio);
  const rx = 91;
  const ry = rx / ratio;
  const color = appearance?.baseColor ?? temperaturePalette(profile.colorTemperatureK);
  const seed = appearance ? Math.round(appearance.deterministicSeed * 65535) : [...objectId].reduce((value, char) => (value * 31 + char.charCodeAt(0)) % 997, 7);
  const modelTemperatureK = appearance?.colorTemperatureK ?? profile.colorTemperatureK;
  const fallbackGiant = !appearance && profile.radiusSolar > 100;
  const textureLayers = appearance ? [
    { id: "macro", scale: appearance.surface.macroScale, strength: appearance.surface.macroStrength },
    { id: "meso", scale: appearance.surface.mesoScale, strength: appearance.surface.mesoStrength },
    { id: "micro", scale: appearance.surface.microScale, strength: appearance.surface.microStrength },
  ] : [];
  const haloEnabled = appearance?.haloEnabled ?? mode === "cinematic";
  const gravityEdge = appearance ? 0.15 + (1 - appearance.gravityTransition) * 0.22 : 0.2;
  const modelDiffers = modelTemperatureK !== profile.colorTemperatureK || Math.abs(ratio - profile.equatorialPolarRadiusRatio) > 0.0001;
  return <figure className="my-3 min-w-0 overflow-hidden rounded-md border border-slate-500/30 bg-[#070c13]"
    data-mainline-a-stellar-portrait={objectId}
    data-mainline-a-stellar-surface={surface}
    data-mainline-a-stellar-portrait-tier="hero"
    data-mainline-a-stellar-presentation-id={appearance ? "m2-shared-v596" : undefined}
    data-mainline-a-stellar-presentation-sha256={appearance?.signatureSha256}
    data-mainline-a-stellar-color-family={appearance?.family}
    data-mainline-a-stellar-color-srgb={appearance?.baseColor}
    data-mainline-a-stellar-model-axis-ratio={appearance?.axisRatio}
    data-mainline-a-stellar-render-mode={mode}
    data-mainline-a-stellar-halo-enabled={haloEnabled}
  >
    <div className="flex min-w-0 items-center justify-between gap-2 px-3 pt-2 text-[10px]">
      <span className="min-w-0 truncate text-slate-300">{title} <span className="ml-1 text-slate-500">光球示意</span></span>
      <button type="button" aria-pressed={surface} onClick={() => setSurface((show) => !show)} className="min-h-11 min-w-11 shrink-0 rounded px-2 text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200">{surface ? "隐藏表面纹理" : "显示表面纹理"}</button>
    </div>
    <svg viewBox="0 0 360 250" className="block w-full" role="img" aria-labelledby={`${uid}-title`}>
      <title id={`${uid}-title`}>{`${title}参数化光球：展示模型色温 ${modelTemperatureK} K，赤道与极半径比 ${ratio}；${appearance ? `${MORPHOLOGY_LABELS[appearance.family]}；` : ""}非观测表面。`}</title>
      <defs>
        <radialGradient id={`${uid}-body`}>
          <stop offset="0" stopColor={appearance?.coreColor ?? color} />
          <stop offset=".6" stopColor={color} />
          <stop offset=".87" stopColor={color} stopOpacity={appearance ? 1 : 0.82} />
          <stop offset="1" stopColor={appearance?.limbColor ?? color} stopOpacity={appearance ? 1 : 0.3} />
        </radialGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset={appearance ? Math.min(0.75, appearance.halo.coreTightness / 8) : 0.55} stopColor={appearance?.haloColor ?? color} stopOpacity={appearance ? Math.min(0.28, 0.08 + appearance.haloStrength * 0.14) : 0.14} />
          <stop offset="1" stopColor={appearance?.haloColor ?? color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-limb`}><stop offset="0" stopColor="#02060b" stopOpacity="0" /><stop offset=".55" stopColor="#02060b" stopOpacity=".03" /><stop offset=".8" stopColor="#02060b" stopOpacity=".2" /><stop offset="1" stopColor="#02060b" stopOpacity=".78" /></radialGradient>
        {appearance ? <>
          <linearGradient id={`${uid}-polar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={appearance.coreColor} stopOpacity={appearance.polarBrightening * 0.65} />
            <stop offset=".34" stopColor={appearance.coreColor} stopOpacity="0" />
            <stop offset=".66" stopColor={appearance.coreColor} stopOpacity="0" />
            <stop offset="1" stopColor={appearance.coreColor} stopOpacity={appearance.polarBrightening * 0.65} />
          </linearGradient>
          <linearGradient id={`${uid}-equator`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset={gravityEdge} stopColor="#000" stopOpacity="0" />
            <stop offset=".5" stopColor="#000" stopOpacity={appearance.equatorialDarkening * 0.45} />
            <stop offset={1 - gravityEdge} stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </> : null}
        <clipPath id={`${uid}-clip`}><ellipse cx="180" cy="118" rx={rx} ry={ry} /></clipPath>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {appearance ? textureLayers.map((layer, index) => <Fragment key={layer.id}>
            <feTurbulence type="fractalNoise" baseFrequency={layer.scale / (rx * 2)} numOctaves="2" seed={seed + index * 19} result={`${layer.id}-noise`} />
            <feColorMatrix in={`${layer.id}-noise`} type="matrix" values={luminanceMatrix(layer.strength)} result={`${layer.id}-luminance`} />
            <feComposite in={index === 0 ? "SourceGraphic" : `${textureLayers[index - 1].id}-color`} in2={`${layer.id}-luminance`} operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result={`${layer.id}-color`} />
          </Fragment>) : <>
            <feTurbulence type="fractalNoise" baseFrequency={fallbackGiant ? ".021" : ".14"} numOctaves="3" seed={seed} result="grain" />
            <feColorMatrix in="grain" type="saturate" values="0" result="gray" />
            <feBlend in="SourceGraphic" in2="gray" mode="soft-light" />
          </>}
        </filter>
      </defs>
      {haloEnabled ? <ellipse cx="180" cy="118" rx={appearance ? rx + 95 / appearance.halo.outerFalloff : 140} ry={ry + 38} fill={`url(#${uid}-glow)`} data-mainline-a-stellar-svg-halo="true" /> : null}
      {appearance?.coronaEnabled ? <ellipse cx="180" cy="118" rx={rx + 1} ry={ry + 1} fill="none" stroke={appearance.haloColor} strokeWidth={1 + appearance.corona.layerSeparation * 3} opacity={Math.min(0.3, appearance.coronaStrength * 0.25)} /> : null}
      <g clipPath={`url(#${uid}-clip)`}>
        <ellipse cx="180" cy="118" rx={rx} ry={ry} fill={`url(#${uid}-body)`} filter={surface ? `url(#${uid}-grain)` : undefined} data-mainline-a-photosphere-ratio={ratio} />
        {appearance ? <>
          <ellipse cx="180" cy="118" rx={rx} ry={ry} fill={`url(#${uid}-polar)`} />
          <ellipse cx="180" cy="118" rx={rx} ry={ry} fill={`url(#${uid}-equator)`} />
        </> : <ellipse cx="180" cy="118" rx={rx} ry={ry} fill={`url(#${uid}-limb)`} />}
      </g>
      <path d="M53 49V32H70 M290 32H307V49 M53 191V208H70 M290 208H307V191" stroke="#a0a8b3" strokeOpacity=".22" fill="none" />
      <g fill="#adb7c6" fontSize="10" fontFamily="monospace"><text x="180" y="239" textAnchor="middle">{modelTemperatureK.toLocaleString("en-US")} K · {ratio.toFixed(2)} : 1</text></g>
    </svg>
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-slate-500/15 px-3 py-1.5 font-mono text-[9px] text-slate-400" data-mainline-a-stellar-art-metrics="true">
      <span>目录色温 {profile.colorTemperatureK.toLocaleString("zh-CN")} K</span><span>光度 {profile.luminositySolar.toLocaleString("zh-CN")} L☉</span><span>半径 {profile.radiusSolar.toLocaleString("zh-CN")} R☉</span>
    </div>
    <figcaption className="space-y-1 border-t border-slate-500/20 px-3 py-2 text-[10px] leading-4 text-slate-400">
      <p>{appearance ? MORPHOLOGY_LABELS[appearance.family] : fallbackGiant ? "大尺度表面纹理" : "细颗粒表面纹理"}与临边变暗用于解释光球形态，均为参数化艺术表达，非已解析的真实表面。</p>
      <p>{ratio > 1.05 ? "按赤道侧视画出扁率；朝向未按观测倾角设置。" : "采用近球形光球示意。"}各张肖像按卡片尺寸归一，不按真实半径、距离或视亮度缩放。</p>
      {appearance ? <p>与场景共用色板和形态参数；二维图鉴为近似示意，不是三维画面的像素复制。{modelDiffers ? `图形采用展示模型 ${modelTemperatureK.toLocaleString("zh-CN")} K、轴比 ${ratio.toFixed(3)}；目录数值保留各自定义。` : ""}</p> : null}
      {objectId === "achernar" ? <p>单一色温表示展示配色；极区与赤道的温度差见下方文献模型。</p> : null}
    </figcaption>
  </figure>;
}
