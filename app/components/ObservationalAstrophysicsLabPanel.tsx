"use client";

import { Activity, AlertTriangle, Database, Orbit, ScatterChart, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart as RechartsScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { fetchAtlasAsset } from "../lib/atlasAssetResolver";
import {
  EXOPLANET_OBSERVATION_MANIFEST_V2_URL,
  OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
  createRadialVelocityDocumentV2,
  createTransitDocumentV2,
  observationAssumptions,
  type ExoplanetObservationManifestV2,
  type ExoplanetObservationRecordV2,
  type ObservationModelSample,
  type ObservationWorkerRequest,
  type ObservationWorkerResponse,
  type RadialVelocityModelDocumentV2,
  type TransitModelDocumentV2,
} from "../lib/observationalAstrophysics";

type View = "hr" | "transit" | "rv";
type GaiaPoint = { color: number; absoluteG: number; sourceId: string };
type HrStatistics = { version: string; fullCatalogCount: number; eligibleCount: number; displaySampleCount: number };

type Props = {
  open: boolean;
  onClose: () => void;
  systemId?: string;
  planetId?: string;
};

async function loadObservationRecord(systemId: string, planetId: string): Promise<ExoplanetObservationRecordV2 | null> {
  const manifestResponse = await fetchAtlasAsset(EXOPLANET_OBSERVATION_MANIFEST_V2_URL, { cache: "force-cache" });
  if (!manifestResponse.ok) throw new Error("观测目录 manifest 不可用");
  const manifest = await manifestResponse.json() as ExoplanetObservationManifestV2;
  const requestedSystem = systemId || "hd-209458";
  const shardId = manifest.index[requestedSystem];
  if (shardId) {
    const shard = manifest.shards.find((entry) => entry.id === shardId);
    if (shard) {
      const response = await fetchAtlasAsset(shard.path, { cache: "force-cache" });
      if (response.ok) {
        const systems = await response.json() as Array<{ systemId: string; planets: ExoplanetObservationRecordV2[] }>;
        const system = systems.find((entry) => entry.systemId === requestedSystem);
        const selected = system?.planets.find((planet) => planet.planetId === planetId) ?? system?.planets[0];
        if (selected) return selected;
      }
    }
  }
  const validationResponse = await fetchAtlasAsset(manifest.validationSystemsPath, { cache: "force-cache" });
  if (!validationResponse.ok) return null;
  const validation = await validationResponse.json() as ExoplanetObservationRecordV2[];
  return validation.find((record) => record.systemId === requestedSystem && (!planetId || record.planetId === planetId))
    ?? validation.find((record) => record.planetName === "HD 209458 b")
    ?? null;
}

export default function ObservationalAstrophysicsLabPanel({ open, onClose, systemId = "", planetId = "" }: Props) {
  const [view, setView] = useState<View>("hr");
  const [samples, setSamples] = useState<readonly ObservationModelSample[]>([]);
  const [hrPoints, setHrPoints] = useState<readonly GaiaPoint[]>([]);
  const [hrStatistics, setHrStatistics] = useState<HrStatistics | null>(null);
  const [record, setRecord] = useState<ExoplanetObservationRecordV2 | null>(null);
  const [modelError, setModelError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void Promise.all([
      fetchAtlasAsset("/data/gaia-dr3-bright-5000.json", { cache: "force-cache" }).then((response) => response.json()),
      fetchAtlasAsset("/data/catalog-lite-v7/hr-statistics.json", { cache: "force-cache" }).then((response) => response.ok ? response.json() : null).catch(() => null),
    ]).then(([rows, statistics]: [Array<{ source_id?: string; sourceId?: string; phot_g_mean_mag?: number; magG?: number; bp_rp?: number; colorBpRp?: number; parallax?: number; parallaxMas?: number }>, HrStatistics | null]) => {
      if (!live) return;
      setHrStatistics(statistics);
      setHrPoints(rows.flatMap((row, index) => {
        if (index % 5 !== 0) return [];
        const parallax = row.parallaxMas ?? row.parallax ?? 0;
        const magnitude = row.magG ?? row.phot_g_mean_mag ?? 99;
        const color = row.colorBpRp ?? row.bp_rp;
        if (!(parallax > 0) || color == null) return [];
        return [{ color, absoluteG: magnitude + 5 * Math.log10(parallax / 100), sourceId: row.sourceId ?? row.source_id ?? String(index) }];
      }));
    }).catch(() => { if (live) setHrPoints([]); });
    return () => { live = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setModelError("");
    void loadObservationRecord(systemId, planetId)
      .then((next) => { if (live) setRecord(next); })
      .catch((error) => {
        if (!live) return;
        setRecord(null);
        setModelError(error instanceof Error ? error.message : String(error));
      });
    return () => { live = false; };
  }, [open, planetId, systemId]);

  const transitDocument = useMemo(() => record ? createTransitDocumentV2(record) : null, [record]);
  const rvDocument = useMemo(() => record ? createRadialVelocityDocumentV2(record) : null, [record]);
  const activeDocument = view === "transit" ? transitDocument : view === "rv" ? rvDocument : null;

  useEffect(() => {
    if (!open || view === "hr") return;
    if (!activeDocument) {
      setSamples([]);
      setModelError(view === "transit" ? "当前行星缺少构建凌日曲线所需的半径比或 a/R*。" : "当前行星没有已报告的径向速度半振幅。");
      return;
    }
    setModelError("");
    const worker = new Worker(new URL("../workers/observationModel.worker.ts", import.meta.url));
    const release = acquireAtlasResource("worker", "relativity-lab", "observation-model-v2");
    const requestId = ++requestIdRef.current;
    worker.onmessage = (event: MessageEvent<ObservationWorkerResponse>) => {
      if (event.data.requestId !== requestIdRef.current) return;
      if (event.data.type === "model-result") setSamples(event.data.samples);
      else setModelError(event.data.message);
    };
    const request: ObservationWorkerRequest = view === "transit"
      ? { type: "transit-model", requestId, document: activeDocument as TransitModelDocumentV2 }
      : { type: "radial-velocity-model", requestId, document: activeDocument as RadialVelocityModelDocumentV2 };
    worker.postMessage(request);
    return () => { worker.terminate(); release(); };
  }, [activeDocument, open, view]);

  const chartSamples = useMemo(() => samples.map((sample) => ({ phase: Number(sample.phase.toFixed(5)), value: sample.value })), [samples]);
  const assumptions = activeDocument ? observationAssumptions(activeDocument) : [];
  if (!open) return null;

  return (
    <section
      className="pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+12px)] top-12 z-[108] overflow-hidden rounded-lg border border-white/12 bg-[rgba(5,8,11,0.96)] text-white shadow-[0_28px_100px_rgba(0,0,0,0.64)] backdrop-blur-2xl sm:left-6 sm:right-auto sm:top-16 sm:w-[46rem]"
      data-observational-lab-version={OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION}
      data-observational-system-id={record?.systemId ?? "none"}
      data-observational-model-status={modelError ? "unavailable" : activeDocument ? "ready" : "idle"}
      aria-label="观测天体物理实验室"
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Activity className="h-4 w-4 text-cyan-200/80" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold">观测天体物理实验室</h2>
          <p className="mt-0.5 truncate text-[10px] text-white/42">观测量、派生量与展示假设严格分层 · {record?.planetName ?? "未选择行星"}</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-white/8 hover:text-white" aria-label="关闭观测实验室"><X className="h-4 w-4" /></button>
      </header>
      <nav className="grid grid-cols-3 gap-1 border-b border-white/10 p-1.5">
        <Tab active={view === "hr"} onClick={() => setView("hr")} icon={<ScatterChart className="h-3.5 w-3.5" />} label="HR 图" />
        <Tab active={view === "transit"} onClick={() => setView("transit")} icon={<Orbit className="h-3.5 w-3.5" />} label="凌日" />
        <Tab active={view === "rv"} onClick={() => setView("rv")} icon={<Activity className="h-3.5 w-3.5" />} label="径向速度" />
      </nav>
      <div className="grid h-[calc(100%-7.25rem)] grid-rows-[minmax(0,1fr)_auto] gap-3 p-4">
        <div className="relative min-h-0 rounded-md border border-white/9 bg-black/25 p-2">
          {view === "hr" ? (
            <ResponsiveContainer width="100%" height="100%"><RechartsScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 8 }}><CartesianGrid stroke="rgba(255,255,255,.07)" /><XAxis type="number" dataKey="color" name="BP-RP" stroke="rgba(255,255,255,.35)" /><YAxis type="number" reversed dataKey="absoluteG" name="绝对 G 星等" stroke="rgba(255,255,255,.35)" /><Tooltip cursor={{ stroke: "rgba(125,211,252,.3)" }} contentStyle={{ background: "#090d11", border: "1px solid rgba(255,255,255,.12)", fontSize: 11 }} /><Scatter data={[...hrPoints]} fill="#8bd9e8" fillOpacity={0.48} /></RechartsScatterChart></ResponsiveContainer>
          ) : modelError ? (
            <div className="flex h-full items-center justify-center px-8 text-center text-xs leading-5 text-amber-100/70"><AlertTriangle className="mr-2 h-4 w-4 shrink-0" />{modelError}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%"><LineChart data={chartSamples} margin={{ top: 12, right: 16, bottom: 12, left: 8 }}><CartesianGrid stroke="rgba(255,255,255,.07)" /><XAxis dataKey="phase" stroke="rgba(255,255,255,.35)" /><YAxis domain={view === "transit" ? ["dataMin", 1.0002] : ["auto", "auto"]} stroke="rgba(255,255,255,.35)" /><Tooltip contentStyle={{ background: "#090d11", border: "1px solid rgba(255,255,255,.12)", fontSize: 11 }} /><Line type="monotone" dataKey="value" dot={false} stroke={view === "transit" ? "#77d4e5" : "#f1b979"} strokeWidth={2} isAnimationActive={false} /></LineChart></ResponsiveContainer>
          )}
        </div>
        <div className="grid gap-2 text-[10px] text-white/58 sm:grid-cols-3">
          <Info icon={<Database className="h-3.5 w-3.5" />} label="数据范围" value={view === "hr" ? `${hrStatistics?.eligibleCount?.toLocaleString() ?? "未安装 V7"} 条完整统计；${hrPoints.length} 个亮星显示点` : `${record?.sourceTable ?? "无数据"} · NASA Exoplanet Archive`} />
          <Info icon={<Activity className="h-3.5 w-3.5" />} label="模型" value={view === "transit" ? "二次临边变暗数值积分" : view === "rv" ? "Keplerian 径向速度展示模型" : "完整目录统计 / 亮星分层显示"} />
          <Info icon={<Orbit className="h-3.5 w-3.5" />} label="科学边界" value={assumptions.length ? `${assumptions.length} 项假设已标记；模型不写回 N-body` : "展示模型不写回太阳系 N-body"} />
        </div>
      </div>
    </section>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={`flex h-8 items-center justify-center gap-1.5 rounded text-[11px] ${active ? "bg-cyan-100/10 text-cyan-50" : "text-white/44 hover:bg-white/5 hover:text-white/72"}`} aria-pressed={active}>{icon}{label}</button>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-md border border-white/8 bg-white/[0.025] p-2.5"><div className="flex items-center gap-1.5 text-white/36">{icon}{label}</div><div className="mt-1 leading-4 text-white/68">{value}</div></div>;
}
