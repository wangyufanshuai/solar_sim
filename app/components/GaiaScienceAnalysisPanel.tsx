"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  GAIA_RESEARCH_COLOR_EDGES,
  GAIA_RESEARCH_G_EDGES,
  createDefaultGaiaResearchFiltersV271,
  createGaiaCovarianceDiagnosticsV271,
  deriveGaiaResearchAnalysisFlagsV271,
  propagateGaiaProperMotionEpochV271,
  serializeGaiaResearchExportV271,
  type GaiaResearchFiltersV271,
  type GaiaResearchPopulationV271,
  type GaiaResearchQueryV271,
  type GaiaResearchResponseV271,
} from "../lib/gaiaResearchWorkbenchV271";
import type { GaiaScienceAnalysisResultV8, GaiaScienceRecordV8 } from "../lib/gaiaScienceV8";
import { downloadText } from "../lib/telemetryExport";
import type { GaiaAnalysisWorkerRequestV8, GaiaAnalysisWorkerResponseV8 } from "../workers/gaiaAnalysis.worker";
import GaiaResearchDensityViewsV267, { GaiaUncertaintyEllipseV267 } from "./GaiaResearchDensityViewsV267";
import GaiaResearchDiagnosticsV271 from "./GaiaResearchDiagnosticsV271";

type LocalState = { status: "idle" | "loading" | "ready" | "blocked"; record: GaiaScienceRecordV8 | null; provenance: string; error: string };
type OnlineState = { status: "idle" | "loading" | "ready" | "blocked"; count: number; fetchedAt: string; error: string };
type ResearchState = { status: "idle" | "loading" | "ready" | "blocked"; response: GaiaResearchResponseV271 | null; error: string };
type ResearchView = "single-star" | "overview" | "healpix-density" | "hr-density" | "selection";
type AggregateView = Exclude<ResearchView, "single-star">;

const VIEW_LABELS: Readonly<Record<ResearchView, string>> = {
  "single-star": "单星误差",
  overview: "样本总览",
  "healpix-density": "天空密度",
  "hr-density": "HR / CMD",
  selection: "选择函数",
};

export default function GaiaScienceAnalysisPanel({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<ResearchView>("single-star");
  const [sourceId, setSourceId] = useState("3235862721054592");
  const [local, setLocal] = useState<LocalState>({ status: "idle", record: null, provenance: "", error: "" });
  const [analysis, setAnalysis] = useState<GaiaScienceAnalysisResultV8 | null>(null);
  const [online, setOnline] = useState<OnlineState>({ status: "idle", count: 0, fetchedAt: "", error: "" });
  const [filters, setFilters] = useState<GaiaResearchFiltersV271>(createDefaultGaiaResearchFiltersV271);
  const [healpixOrder, setHealpixOrder] = useState<3 | 5>(3);
  const [hrBins, setHrBins] = useState<64 | 128>(64);
  const [population, setPopulation] = useState<GaiaResearchPopulationV271>("v7-gaia-id");
  const [targetEpoch, setTargetEpoch] = useState(2026);
  const [research, setResearch] = useState<ResearchState>({ status: "idle", response: null, error: "" });
  const [isPending, startTransition] = useTransition();
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const responseCacheRef = useRef(new Map<string, GaiaResearchResponseV271>());

  useEffect(() => {
    const worker = new Worker(new URL("../workers/gaiaAnalysis.worker.ts", import.meta.url));
    const release = acquireAtlasResource("worker", "atlas", "gaia-analysis-v8", { owner: "research" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<GaiaAnalysisWorkerResponseV8>) => {
      const message = event.data;
      if (message.requestId !== requestIdRef.current) return;
      if (message.type === "result") setAnalysis(message.result);
      else setLocal((current) => ({ ...current, status: "blocked", error: message.message }));
    };
    return () => {
      abortRef.current?.abort();
      worker.terminate();
      release();
      workerRef.current = null;
    };
  }, []);

  const diagnostics = useMemo(() => local.record ? {
    flags: deriveGaiaResearchAnalysisFlagsV271(local.record),
    covariance: createGaiaCovarianceDiagnosticsV271(local.record),
    propagated: propagateGaiaProperMotionEpochV271(local.record, targetEpoch),
  } : null, [local.record, targetEpoch]);

  const loadFrozen = async () => {
    setLocal({ status: "loading", record: null, provenance: "", error: "" });
    setAnalysis(null);
    try {
      const response = await fetch(`/api/atlas/science-record?sourceId=${encodeURIComponent(sourceId)}`, { cache: "no-store" });
      const payload = await response.json() as { record?: GaiaScienceRecordV8; sourceSha256?: string; error?: string };
      if (!response.ok || !payload.record) throw new Error(payload.error ?? `Science subset ${response.status}`);
      setLocal({ status: "ready", record: payload.record, provenance: payload.sourceSha256 ?? "", error: "" });
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      workerRef.current?.postMessage({ type: "analyze", requestId, record: payload.record } satisfies GaiaAnalysisWorkerRequestV8);
    } catch (error) {
      setLocal({ status: "blocked", record: null, provenance: "", error: error instanceof Error ? error.message : String(error) });
    }
  };

  const queryLive = async () => {
    setOnline({ status: "loading", count: 0, fetchedAt: "", error: "" });
    try {
      const response = await fetch("/api/atlas/catalog/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "source-id", sourceId }),
      });
      const payload = await response.json() as { records?: unknown[]; fetchedAt?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? `Live Gaia ${response.status}`);
      setOnline({ status: "ready", count: payload.records?.length ?? 0, fetchedAt: payload.fetchedAt ?? "", error: "" });
    } catch (error) {
      setOnline({ status: "blocked", count: 0, fetchedAt: "", error: error instanceof Error ? error.message : String(error) });
    }
  };

  const createQuery = (nextView: AggregateView): GaiaResearchQueryV271 => {
    if (nextView === "overview") return { kind: nextView, filters };
    if (nextView === "hr-density") return { kind: nextView, bins: hrBins, filters };
    if (nextView === "selection") return { kind: nextView, order: healpixOrder, population, filters };
    return { kind: nextView, order: healpixOrder, filters };
  };

  const loadResearch = async (nextView: AggregateView) => {
    const query = createQuery(nextView);
    const key = JSON.stringify(query);
    const cached = responseCacheRef.current.get(key);
    setView(nextView);
    if (cached) {
      startTransition(() => setResearch({ status: "ready", response: cached, error: "" }));
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResearch({ status: "loading", response: null, error: "" });
    try {
      const response = await fetch("/api/atlas/science-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: key,
        signal: controller.signal,
      });
      const payload = await response.json() as GaiaResearchResponseV271 & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? `Gaia Research ${response.status}`);
      responseCacheRef.current.set(key, payload);
      startTransition(() => setResearch({ status: "ready", response: payload, error: "" }));
    } catch (error) {
      if (controller.signal.aborted) return;
      setResearch({ status: "blocked", response: null, error: error instanceof Error ? error.message : String(error) });
    }
  };

  const exportResearch = (format: "json" | "csv") => {
    const response = research.response;
    if (!response) return;
    const exported = serializeGaiaResearchExportV271(response, format);
    downloadText(exported.fileName, exported.content, exported.mediaType);
  };

  const distance = analysis?.monteCarlo.distancePc;
  const tangential = analysis?.monteCarlo.tangentialSpeedKmS;
  const overview = research.response?.payload.kind === "overview" ? research.response.payload : null;
  return (
    <section className="max-h-[calc(100dvh-5rem)] w-[min(560px,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-cyan-200/15 bg-[#05090d]/96 p-4 text-slate-100 shadow-2xl backdrop-blur-2xl max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[calc(var(--ui-dock-height)+.5rem)] max-sm:top-14 max-sm:max-h-none max-sm:w-auto" aria-label="Gaia 科学研究工作台" data-atlas-gaia-research-workbench="v271-shadow" data-atlas-physics-mutation="not-applied">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/60">Gaia Research Workbench · v271 shadow</p><h2 className="mt-1 text-base font-semibold">误差传播与冻结样本统计</h2><p className="mt-1 text-[11px] text-slate-500">冻结 200k 子集；Gaia survey completeness 明确 unavailable。</p></div>
        <button data-atlas-accessibility-focus-target="true" type="button" onClick={onClose} className="rounded px-2 py-1 text-slate-400 hover:bg-white/5" aria-label="关闭 Gaia 研究工作台">×</button>
      </header>

      <nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Gaia 研究视图">{(Object.keys(VIEW_LABELS) as ResearchView[]).map((id) => <button key={id} type="button" aria-pressed={view === id} onClick={() => id === "single-star" ? setView(id) : void loadResearch(id)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[9px] ${view === id ? "border-cyan-200/30 bg-cyan-200/[.08] text-cyan-100" : "border-white/8 text-slate-500"}`}>{VIEW_LABELS[id]}</button>)}</nav>

      {view === "single-star" ? <div className="mt-4">
        <label className="block text-[10px] text-slate-400">Gaia DR3 source id<input value={sourceId} onChange={(event) => setSourceId(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-cyan-100" /></label>
        <div className="mt-2 flex gap-2"><button type="button" onClick={() => void loadFrozen()} className="flex-1 rounded-lg border border-cyan-200/20 bg-cyan-300/[0.06] px-3 py-2 text-[11px] text-cyan-100">分析冻结记录</button><button type="button" onClick={() => void queryLive()} className="rounded-lg border border-amber-200/15 px-3 py-2 text-[11px] text-amber-100">临时在线核对</button></div>
        {local.error ? <Status>{local.error}</Status> : null}
        {analysis && diagnostics ? <div className="mt-4 space-y-2">
          <div className="grid grid-cols-3 gap-2"><Metric label="冻结质量层" value={analysis.qualityTier} /><Metric label="维度" value={`${analysis.dimension}D`} /><Metric label="MC" value="4096" /></div>
          <GaiaUncertaintyEllipseV267 covariance={analysis.covariance} />
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Monte Carlo transformed interval</p><p className="mt-1 text-lg font-semibold text-cyan-100">{distance ? `${distance.median.toFixed(1)} pc` : "unavailable"}</p>{distance ? <p className="text-[10px] text-slate-500">{distance.lower.toFixed(1)} – {distance.upper.toFixed(1)} pc · fixed seed</p> : <p className="text-[10px] text-amber-300">视差符号或SNR不足；不进行可靠三维反演。</p>}</div>
          <div className="rounded-xl border border-white/8 p-3 text-xs text-slate-300">切向速度 {tangential ? `${tangential.median.toFixed(2)} km/s` : "unavailable"}<br /><span className="text-[10px] text-slate-500">RV {analysis.radialVelocity ? `${analysis.radialVelocity.valueKmS.toFixed(2)} ± ${analysis.radialVelocity.errorKmS.toFixed(2)} km/s` : "缺失；结果保持5D"}</span></div>
          <label className="block text-[9px] text-slate-500">目标历元<input type="number" min="1900" max="2200" step="0.1" value={targetEpoch} onChange={(event) => setTargetEpoch(Number(event.target.value))} className="ml-2 w-24 rounded border border-white/10 bg-black/35 p-1 font-mono text-cyan-100" /></label>
          <GaiaResearchDiagnosticsV271 flags={diagnostics.flags} diagnostics={diagnostics.covariance} propagated={diagnostics.propagated} />
          <p className="break-all text-[9px] text-slate-600">source SHA {local.provenance}</p>
        </div> : local.status === "loading" ? <p className="mt-4 text-xs text-slate-400">读取本地冻结子集…</p> : null}
        <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[0.02] p-3 text-[10px]"><p className="text-slate-300">在线结果独立边界</p>{online.status === "ready" ? <p className="mt-1 text-amber-200">{online.count} 行 · canonical:false · {online.fetchedAt}</p> : online.error ? <p className="mt-1 text-amber-300">{online.error}；不自动重试。</p> : <p className="mt-1 text-slate-600">仅在主动点击后发出受限 source-id 查询。</p>}</div>
      </div> : <div className="mt-4">
        <ResearchFilters filters={filters} onChange={setFilters} />
        <div className="mt-2 grid grid-cols-3 gap-2 text-[9px]">
          <Select label="HEALPix" value={healpixOrder} onChange={(value) => setHealpixOrder(Number(value) as 3 | 5)} options={[[3, "order 3"], [5, "order 5"]]} />
          <Select label="HR bins" value={hrBins} onChange={(value) => setHrBins(Number(value) as 64 | 128)} options={[[64, "64 × 64"], [128, "128 × 128"]]} />
          <Select label="Mother" value={population} onChange={(value) => setPopulation(value as GaiaResearchPopulationV271)} options={[["v7-gaia-id", "Gaia IDs"], ["v7-presentation", "Presentation"]]} />
        </div>
        <div className="mt-2 flex justify-between gap-2"><button type="button" onClick={() => void loadResearch(view as AggregateView)} className="rounded-md border border-cyan-200/20 px-3 py-1.5 text-[10px] text-cyan-100">应用筛选</button><div className="flex gap-1"><button type="button" disabled={!research.response} onClick={() => exportResearch("json")} className="rounded-md border border-white/10 px-2 py-1 text-[9px] disabled:opacity-30">JSON</button><button type="button" disabled={!research.response} onClick={() => exportResearch("csv")} className="rounded-md border border-white/10 px-2 py-1 text-[9px] disabled:opacity-30">CSV</button></div></div>
        {research.status === "loading" || isPending ? <div className="mt-4 h-40 animate-pulse rounded-xl bg-white/[.025]" /> : research.error ? <Status>{research.error}</Status> : null}
        {overview ? <div className="mt-4 space-y-2"><div className="grid grid-cols-2 gap-2"><Metric label="冻结行" value={overview.frozenRows.toLocaleString()} /><Metric label="筛选域" value={overview.selectionDomainRows.toLocaleString()} /><Metric label="筛选后" value={overview.matchedRows.toLocaleString()} /><Metric label="HR eligible" value={overview.hrEligibleRows.toLocaleString()} /><Metric label="Gaia-ID mother" value={overview.motherPopulations["v7-gaia-id"].toLocaleString()} /><Metric label="V7 overlap" value={overview.astrophysicalOverlapRows.toLocaleString()} /></div><QualityFlow rows={overview.qualityCutFlow} /><div className="rounded-xl border border-amber-300/10 p-3 text-[10px] text-amber-200">Gaia DR3 survey completeness：unavailable；Atlas subset inclusion不能替代。</div></div> : null}
        {research.response && research.response.payload.kind !== "overview" ? <div className="mt-4"><GaiaResearchDensityViewsV267 payload={research.response.payload} />{research.response.payload.kind === "selection" ? <p className="mt-2 text-[10px] text-slate-400">Selected {research.response.payload.selected.toLocaleString()} / mother {research.response.payload.mother.toLocaleString()} · inclusion {research.response.payload.inclusionFraction?.toFixed(5) ?? "unavailable"}</p> : null}</div> : null}
        {research.response ? <p className="mt-3 break-all text-[9px] text-slate-600">manifest SHA {research.response.provenance.manifestSha256} · aggregate SHA {research.response.provenance.aggregateSha256} · canonical:true · no physics mutation</p> : null}
      </div>}
    </section>
  );
}

function ResearchFilters({ filters, onChange }: { filters: GaiaResearchFiltersV271; onChange: (value: GaiaResearchFiltersV271) => void }) {
  const toggleQuality = (quality: "gold" | "silver" | "limited") => {
    const exists = filters.qualityTiers.includes(quality);
    const next = exists ? filters.qualityTiers.filter((entry) => entry !== quality) : [...filters.qualityTiers, quality];
    if (next.length) onChange({ ...filters, qualityTiers: next });
  };
  const update = (next: GaiaResearchFiltersV271) => {
    if (next.gMin < next.gMax && next.bpRpMin < next.bpRpMax) onChange(next);
  };
  return <div className="rounded-xl border border-white/8 bg-white/[.018] p-3 text-[10px]"><div className="flex gap-3">{(["gold", "silver", "limited"] as const).map((quality) => <label key={quality} className="flex items-center gap-1 text-slate-400"><input type="checkbox" checked={filters.qualityTiers.includes(quality)} onChange={() => toggleQuality(quality)} />{quality}</label>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><RangeSelect label="G min" value={filters.gMin} values={GAIA_RESEARCH_G_EDGES.slice(0, -1)} onChange={(gMin) => update({ ...filters, gMin })} /><RangeSelect label="G max" value={filters.gMax} values={GAIA_RESEARCH_G_EDGES.slice(1)} onChange={(gMax) => update({ ...filters, gMax })} /><label className="text-slate-500">RUWE max<select value={filters.ruweMax ?? "all"} onChange={(event) => onChange({ ...filters, ruweMax: event.target.value === "all" ? null : Number(event.target.value) as 1.2 | 1.4 | 2 })} className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-slate-200"><option value="all">all</option><option value="1.2">1.2</option><option value="1.4">1.4</option><option value="2">2.0</option></select></label><RangeSelect label="BP−RP min" value={filters.bpRpMin} values={GAIA_RESEARCH_COLOR_EDGES.slice(0, -1)} onChange={(bpRpMin) => update({ ...filters, bpRpMin })} /><RangeSelect label="BP−RP max" value={filters.bpRpMax} values={GAIA_RESEARCH_COLOR_EDGES.slice(1)} onChange={(bpRpMax) => update({ ...filters, bpRpMax })} /></div></div>;
}

function QualityFlow({ rows }: { rows: readonly { order: number; id: string; count: number }[] }) {
  return <div className="rounded-xl border border-white/8 p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Cumulative quality-cut flow</p><ol className="mt-2 space-y-1 text-[9px] text-slate-400">{rows.map((row) => <li key={row.id} className="flex justify-between gap-2"><span>{row.order + 1}. {row.id}</span><strong className="font-mono text-cyan-100">{row.count.toLocaleString()}</strong></li>)}</ol></div>;
}

function Select({ label, value, options, onChange }: { label: string; value: string | number; options: readonly (readonly [string | number, string])[]; onChange: (value: string) => void }) {
  return <label className="text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-slate-200">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>;
}

function RangeSelect({ label, value, values, onChange }: { label: string; value: number; values: readonly number[]; onChange: (value: number) => void }) {
  return <label className="text-slate-500">{label}<select value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-slate-200">{values.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/8 p-2"><p className="text-[9px] uppercase text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-200">{value}</p></div>; }
function Status({ children }: { children: React.ReactNode }) { return <p role="status" className="mt-3 text-[10px] text-amber-300">{children}</p>; }
