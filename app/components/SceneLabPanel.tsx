"use client";

import { Download, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { downloadText } from "../lib/telemetryExport";
import {
  compareSceneLabDocuments,
  createSceneLabDocument,
  exportSceneLabCsv,
  updateSceneLabParameter,
  type SceneLabParameterDefinition,
} from "../lib/sceneLab";

const DEFINITIONS: readonly SceneLabParameterDefinition[] = [
  { id: "timeScale", label: "时间倍率", minimum: 0.25, maximum: 4, step: 0.25, defaultValue: 1, unit: "x" },
  { id: "displayExposure", label: "展示曝光", minimum: 0.5, maximum: 1.25, step: 0.05, defaultValue: 0.9, unit: "EV" },
  { id: "orbitTrailDays", label: "轨迹窗口", minimum: 10, maximum: 720, step: 10, defaultValue: 180, unit: "天" },
];

function initialDocument() {
  return createSceneLabDocument({
    id: "scene-lab-current",
    title: "受控场景 A/B",
    sourceSceneId: "atlas-current-snapshot",
    parameters: Object.fromEntries(DEFINITIONS.map((definition) => [definition.id, definition.defaultValue])),
  });
}

export default function SceneLabPanel({ onClose }: { onClose: () => void }) {
  const [baseline] = useState(initialDocument);
  const [candidate, setCandidate] = useState(initialDocument);
  const comparison = useMemo(() => compareSceneLabDocuments(baseline, candidate), [baseline, candidate]);

  return (
    <aside className="fixed bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] right-3 top-auto z-[145] flex max-h-[46dvh] w-[min(390px,calc(100vw-24px))] flex-col border border-white/15 bg-[#07090b]/95 text-slate-100 shadow-2xl backdrop-blur-xl sm:bottom-[74px] sm:top-3 sm:max-h-none" data-atlas-scene-lab="v138-controlled-scene-lab">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div><div className="text-[10px] uppercase text-cyan-100/45">Scene Lab / 隔离副本</div><h2 className="mt-1 text-sm font-semibold">场景实验室</h2></div>
        <button type="button" className="atlas-cinematic-icon" onClick={onClose} aria-label="关闭场景实验室" title="关闭"><X className="h-4 w-4" /></button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {DEFINITIONS.map((definition) => {
          const value = Number(candidate.parameters[definition.id]);
          return <label key={definition.id} className="block"><span className="flex items-center justify-between text-xs text-slate-300"><span>{definition.label}</span><span className="font-mono text-cyan-100/80">{value.toFixed(definition.step < 1 ? 2 : 0)} {definition.unit}</span></span><input className="mt-3 w-full accent-cyan-200" data-atlas-scene-lab-parameter={definition.id} type="range" min={definition.minimum} max={definition.maximum} step={definition.step} value={value} onChange={(event) => setCandidate((document) => updateSceneLabParameter(document, definition, Number(event.target.value)))} /></label>;
        })}
        <div className="border-t border-white/10 pt-4 text-xs text-slate-400"><div className="flex justify-between"><span>变更参数</span><span className="font-mono text-slate-200">{comparison.changedParameterIds.length}</span></div><div className="mt-2 flex justify-between"><span>状态边界</span><span className="text-emerald-200/75">不写入标准星历</span></div></div>
      </div>
      <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
        <button type="button" className="atlas-cinematic-icon" title="重置" aria-label="重置实验参数" onClick={() => setCandidate(initialDocument())}><RotateCcw className="h-4 w-4" /></button>
        <button type="button" className="flex h-9 items-center gap-2 border border-white/15 px-3 text-xs text-slate-200 hover:bg-white/5" onClick={() => downloadText("scene-lab-comparison.csv", exportSceneLabCsv(candidate), "text/csv;charset=utf-8")}><Download className="h-4 w-4" />导出 CSV</button>
        <button type="button" className="flex h-9 items-center gap-2 border border-cyan-100/25 bg-cyan-100/[0.07] px-3 text-xs text-cyan-50 hover:bg-cyan-100/[0.12]" onClick={() => downloadText("scene-lab.json", JSON.stringify(candidate, null, 2), "application/json")}><Download className="h-4 w-4" />导出 JSON</button>
      </footer>
    </aside>
  );
}
