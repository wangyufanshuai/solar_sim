"use client";

import { useEffect, useState } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import { parseKerrDetectorCalibrationPackV364, type KerrDetectorCalibrationPackArtifactV364 } from "../lib/kerrDetectorCalibrationPackV364";

type Download = Readonly<{ id: string; mediaType: string; bytes: number; sha256: string; dataRowCount: number; admissibleAsMeasured: false; url: string }>;

export default function DetectorCalibrationPackSurfaceV364() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return null;
  return <CalibrationPackPanelV364 />;
}

function CalibrationPackPanelV364() {
  const resolved = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  useAtlasVisualRuntimeConsumerV300({ profile: resolved.id, group: "hud", consumer: "DetectorCalibrationPackSurfaceV364", tokenSignature: createAtlasVisualTokenSignatureV300(resolved.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<KerrDetectorCalibrationPackArtifactV364 | null>(null);
  const [downloads, setDownloads] = useState<readonly Download[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v364/calibration-pack", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const value = await response.json() as { available?: boolean; artifact?: unknown; downloads?: Download[] };
      if (response.ok && value.available === false) return null;
      if (!response.ok || value.available !== true || !value.artifact || value.downloads?.length !== 5) throw new Error("v364-pack-unavailable");
      return { artifact: parseKerrDetectorCalibrationPackV364(value.artifact), downloads: value.downloads };
    }).then((value) => { if (controller.signal.aborted) return; if (!value) { setState("unavailable"); return; } setArtifact(value.artifact); setDownloads(Object.freeze(value.downloads)); setState("ready"); }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  return <section
    className="mt-2 rounded-[10px] border border-indigo-100/15 bg-[linear-gradient(145deg,rgba(13,15,42,.94),rgba(6,8,14,.98))] p-3 font-mono text-[8px] text-white/55"
    data-atlas-detector-calibration-pack-v364
    data-atlas-detector-calibration-pack-status={state}
    data-atlas-v364-measured-data-rows={artifact?.counts.measuredDataRowCount ?? 0}
    data-atlas-v364-admissible-as-measured="false"
    data-atlas-v364-science-buffer-mutation="false"
    data-atlas-v364-cinematic-color-input="false"
  >
    <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[.2em] text-indigo-100/50">Acquisition pack v364</div><div className="text-[13px] text-indigo-50/90">空白模板、采集计划与验证入口</div></div><div className="text-right text-[7px] text-indigo-100/60">{state}<br />0 measured rows</div></div>
    {artifact ? <>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4"><Metric label="files" value="5 SHA-locked" /><Metric label="empty templates" value="3 / 3" /><Metric label="plan tasks" value="9" /><Metric label="conditioning" value="UNAVAILABLE" alert /></div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {downloads.map((download) => <a key={download.id} href={download.url} download className="atlas-accessible-focus rounded border border-indigo-100/15 bg-indigo-100/[.035] px-2 py-1 text-[8px] text-indigo-50/75" data-atlas-v364-download={download.id} data-atlas-v364-download-sha={download.sha256}>{download.id} · {download.bytes} B</a>)}
      </div>
      <div className="mt-2 rounded border border-amber-100/10 bg-amber-100/[.025] px-2 py-1.5 text-[7px] text-white/38">模板不含示例测量值，不能通过 v361 admission。表格完整性通过也不授予实测 authority；数值条件分析必须等待真实 Jacobian 与观测协方差。</div>
    </> : <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-white/40">{state === "loading" ? "正在读取内容寻址采集包…" : state === "unavailable" ? "仅 local-shadow Instrument Lab 可用。" : "采集包损坏或不可用；已 fail closed。"}</div>}
  </section>;
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) { return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className={`mt-1 text-[11px] ${alert ? "text-amber-100/80" : "text-indigo-50/84"}`}>{value}</div></div>; }
