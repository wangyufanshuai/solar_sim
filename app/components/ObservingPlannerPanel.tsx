"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  horizonAltitudeAtAzimuthV1,
  parseHorizonMaskCsvV1,
  type HorizonMaskPointV1,
  type ObserverProfileV1,
  type ObservationTargetV1,
  type TelescopeFovProfileV1,
} from "../lib/observationPlannerV1";
import {
  OBSERVATION_PROFILE_STORAGE_VERSION,
  createObservationPlannerViewModelV2,
  deleteObservationProfileV1,
  observationPlanToCsvV2,
  observationPlanToIcsV2,
  observationPlanToJsonV2,
  observationTargetFromSelectionV2,
  parseObservationLocationsV1,
  parseObservationWeatherV1,
  readObservationProfilesV1,
  saveFovProfileV1,
  saveObserverProfileV1,
  type ObservationWeatherSnapshotV1,
  type ObservationLocationResultV1,
  type StoredObservationProfilesV1,
} from "../lib/observationPlannerV2";
import { downloadText } from "../lib/telemetryExport";
import { useObservationPlannerWorkerV266 } from "../lib/useObservationPlannerWorkerV266";

const ObservationPlannerChartsV266 = lazy(() => import("./ObservationPlannerChartsV266"));

type FormState = {
  observerName: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationM: number;
  timeZone: string;
  raDeg: number;
  decDeg: number;
  durationHours: 24 | 48 | 72;
  refraction: boolean;
  horizonMask?: readonly HorizonMaskPointV1[];
};

type AsyncStatus = { status: "idle" | "loading" | "ready" | "blocked"; error: string };

const DEFAULT_FOV: TelescopeFovProfileV1 = {
  name: "APS-C 800 mm",
  focalLengthMm: 800,
  sensorWidthMm: 22.3,
  sensorHeightMm: 14.9,
  pixelSizeMicron: 3.76,
  rotationDeg: 0,
};

const EMPTY_PROFILES: StoredObservationProfilesV1 = {
  version: OBSERVATION_PROFILE_STORAGE_VERSION,
  observers: [],
  fovs: [],
};

export default function ObservingPlannerPanel({
  onClose,
  selectedObjectId,
  gaiaIndex,
}: {
  onClose: () => void;
  selectedObjectId: string;
  gaiaIndex: readonly GaiaIndexedStar[];
}) {
  const [form, setForm] = useState<FormState>(() => ({
    observerName: "当前观测点",
    latitudeDeg: 39.9042,
    longitudeDeg: 116.4074,
    elevationM: 44,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    raDeg: 279.2347,
    decDeg: 38.7837,
    durationHours: 24,
    refraction: true,
  }));
  const [startLocal, setStartLocal] = useState(() => toDatetimeLocal(new Date()));
  const [targetMode, setTargetMode] = useState<"selected" | "manual">("selected");
  const [fovProfile, setFovProfile] = useState<TelescopeFovProfileV1>(DEFAULT_FOV);
  const [profiles, setProfiles] = useState<StoredObservationProfilesV1>(EMPTY_PROFILES);
  const [profileError, setProfileError] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locations, setLocations] = useState<readonly ObservationLocationResultV1[]>([]);
  const [locationStatus, setLocationStatus] = useState<AsyncStatus>({ status: "idle", error: "" });
  const [weatherStatus, setWeatherStatus] = useState<AsyncStatus>({ status: "idle", error: "" });
  const [weather, setWeather] = useState<ObservationWeatherSnapshotV1 | null>(null);
  const [horizonError, setHorizonError] = useState("");
  const [previewAzimuth, setPreviewAzimuth] = useState(180);
  const horizonInputRef = useRef<HTMLInputElement>(null);
  const { state: workerState, plan } = useObservationPlannerWorkerV266();

  useEffect(() => {
    try {
      setProfiles(readObservationProfilesV1(window.localStorage));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const selectedTarget = useMemo(() => {
    const selectedGaia = selectedObjectId.startsWith("gaia-dr3:")
      ? gaiaIndex.find((entry) => entry.id === selectedObjectId)?.star ?? null
      : null;
    return observationTargetFromSelectionV2(
      selectedObjectId,
      selectedGaia ? [selectedGaia] : [],
    );
  }, [gaiaIndex, selectedObjectId]);
  const manualTarget = useMemo<ObservationTargetV1>(() => ({
    id: "manual-target",
    name: "手动赤经赤纬目标",
    raDeg: form.raDeg,
    decDeg: form.decDeg,
    epochJulianYear: 2000,
  }), [form.decDeg, form.raDeg]);
  const activeTarget = targetMode === "selected" ? selectedTarget.target : manualTarget;
  const observer = useMemo<ObserverProfileV1>(() => ({
    version: "observer-profile-v1",
    id: "session-observer",
    name: form.observerName,
    latitudeDeg: form.latitudeDeg,
    longitudeDeg: form.longitudeDeg,
    elevationM: form.elevationM,
    timeZone: form.timeZone,
    source: "manual",
    horizonMask: form.horizonMask,
  }), [form]);

  const runPlan = useCallback(() => {
    if (!activeTarget) return;
    const start = new Date(startLocal);
    if (!Number.isFinite(start.getTime())) return;
    plan({
      observer,
      target: activeTarget,
      startIso: start.toISOString(),
      durationHours: form.durationHours,
      sampleMinutes: 10,
      refraction: form.refraction,
    });
  }, [activeTarget, form.durationHours, form.refraction, observer, plan, startLocal]);

  useEffect(() => {
    runPlan();
    // Initial worker plan only; edits are applied explicitly to avoid calculation waterfalls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewModel = useMemo(() => createObservationPlannerViewModelV2({
    status: workerState.status,
    observer,
    target: activeTarget,
    targetBoundary: targetMode === "manual" ? "manual" : selectedTarget.boundary,
    result: workerState.result,
    fovProfile,
    savedObserverCount: profiles.observers.length,
    savedFovCount: profiles.fovs.length,
    weather,
    error: workerState.error,
  }), [activeTarget, fovProfile, observer, profiles.fovs.length, profiles.observers.length, selectedTarget.boundary, targetMode, weather, workerState]);

  useEffect(() => {
    atlasRuntimeStore.setObserverPresentation({
      enabled: Boolean(activeTarget),
      targetId: activeTarget?.id ?? "",
      widthDeg: viewModel.fov.widthDeg,
      heightDeg: viewModel.fov.heightDeg,
      rotationDeg: viewModel.fov.rotationDeg,
    });
    return () => atlasRuntimeStore.setObserverPresentation({
      enabled: false,
      targetId: "",
      widthDeg: 0,
      heightDeg: 0,
      rotationDeg: 0,
    });
  }, [activeTarget, viewModel.fov.heightDeg, viewModel.fov.rotationDeg, viewModel.fov.widthDeg]);

  const updateNumber = (key: "latitudeDeg" | "longitudeDeg" | "elevationM" | "raDeg" | "decDeg", value: string) => {
    setForm((current) => ({ ...current, [key]: Number(value) }));
  };

  const searchLocations = async () => {
    if (locationQuery.trim().length < 2) return;
    setLocationStatus({ status: "loading", error: "" });
    try {
      const response = await fetch(`/api/atlas/locations?q=${encodeURIComponent(locationQuery.trim())}`, { cache: "no-store" });
      const payload = await response.json() as unknown;
      if (!response.ok) {
        const failure = payload && typeof payload === "object" ? payload as { error?: string } : {};
        throw new Error(failure.error ?? `地名搜索 ${response.status}`);
      }
      setLocations(parseObservationLocationsV1(payload));
      setLocationStatus({ status: "ready", error: "" });
    } catch (error) {
      setLocations([]);
      setLocationStatus({ status: "blocked", error: errorMessage(error, "地名搜索不可用") });
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus({ status: "blocked", error: "浏览器不支持定位；请手动输入坐标。" });
      return;
    }
    setLocationStatus({ status: "loading", error: "" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          observerName: "浏览器定位点",
          latitudeDeg: round(position.coords.latitude, 4),
          longitudeDeg: round(position.coords.longitude, 4),
          elevationM: position.coords.altitude ?? current.elevationM,
        }));
        setLocationStatus({ status: "ready", error: "" });
      },
      () => setLocationStatus({ status: "blocked", error: "定位未授权；仍可手动输入坐标。" }),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  };

  const requestWeather = async () => {
    setWeatherStatus({ status: "loading", error: "" });
    try {
      const response = await fetch("/api/atlas/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitudeDeg: form.latitudeDeg, longitudeDeg: form.longitudeDeg }),
      });
      const payload = await response.json() as unknown;
      if (!response.ok) {
        const failure = payload && typeof payload === "object" ? payload as { error?: string } : {};
        throw new Error(failure.error ?? `天气服务 ${response.status}`);
      }
      setWeather(parseObservationWeatherV1(payload));
      setWeatherStatus({ status: "ready", error: "" });
    } catch (error) {
      setWeather(null);
      setWeatherStatus({ status: "blocked", error: `${errorMessage(error, "天气不可用")}；离线天文结果保持可用。` });
    }
  };

  const saveObserver = () => {
    try {
      const next = saveObserverProfileV1(window.localStorage, {
        version: "saved-observer-profile-v1",
        id: profileId(observer.name),
        savedAt: new Date().toISOString(),
        profile: observer,
      });
      setProfiles(next);
      setProfileError("");
    } catch (error) {
      setProfileError(errorMessage(error, "观测点保存失败"));
    }
  };

  const saveFov = () => {
    try {
      const next = saveFovProfileV1(window.localStorage, {
        version: "saved-fov-profile-v1",
        id: profileId(fovProfile.name),
        savedAt: new Date().toISOString(),
        profile: fovProfile,
      });
      setProfiles(next);
      setProfileError("");
    } catch (error) {
      setProfileError(errorMessage(error, "FOV 保存失败"));
    }
  };

  const removeProfile = (kind: "observer" | "fov", id: string) => {
    try {
      setProfiles(deleteObservationProfileV1(window.localStorage, kind, id));
    } catch (error) {
      setProfileError(errorMessage(error, "Profile 删除失败"));
    }
  };

  const exportPlan = (kind: "json" | "csv" | "ics") => {
    const result = workerState.result;
    if (!result) return;
    const stem = `orbit-atlas-observation-${result.request.target.id}`;
    if (kind === "json") downloadText(`${stem}.json`, observationPlanToJsonV2(result, fovProfile, weather), "application/json;charset=utf-8");
    if (kind === "csv") downloadText(`${stem}.csv`, observationPlanToCsvV2(result, weather), "text/csv;charset=utf-8");
    if (kind === "ics") downloadText(`${stem}.ics`, observationPlanToIcsV2(result), "text/calendar;charset=utf-8");
  };

  const horizonAtPreview = form.horizonMask
    ? horizonAltitudeAtAzimuthV1(form.horizonMask, previewAzimuth)
    : 0;
  const rankedWindows = useMemo(() => [...(workerState.result?.windows ?? [])].sort(
    (left, right) => right.durationMinutes - left.durationMinutes || right.peakAltitudeDeg - left.peakAltitudeDeg,
  ), [workerState.result]);

  return (
    <section className="max-h-[calc(100dvh-5rem)] w-[min(520px,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-cyan-200/15 bg-[#05090c]/95 p-4 text-slate-100 shadow-2xl backdrop-blur-2xl max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[calc(var(--ui-dock-height)+0.5rem)] max-sm:top-14 max-sm:max-h-none max-sm:w-auto" aria-label="地面观测规划器" data-atlas-observation-planner="v266-worker-view-model" data-atlas-physics-mutation="not-applied">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/65">Observing Planner 2.0 · v266</p>
          <h2 className="mt-1 text-base font-semibold">地面观测工作台</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">离线星历为 canonical；天气仅为临时辅助，不进入科研证据或物理状态。</p>
        </div>
        <button data-atlas-accessibility-focus-target="true" type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-white/5 hover:text-white" aria-label="关闭观测规划器">×</button>
      </header>

      <PanelSection title="位置与时间">
        <div className="grid grid-cols-3 gap-2">
          <TextField label="观测点" value={form.observerName} onChange={(observerName) => setForm((current) => ({ ...current, observerName }))} className="col-span-3" />
          <NumberField label="纬度 °" value={form.latitudeDeg} onChange={(value) => updateNumber("latitudeDeg", value)} />
          <NumberField label="经度 °" value={form.longitudeDeg} onChange={(value) => updateNumber("longitudeDeg", value)} />
          <NumberField label="海拔 m" value={form.elevationM} onChange={(value) => updateNumber("elevationM", value)} />
          <TextField label="IANA 时区" value={form.timeZone} onChange={(timeZone) => setForm((current) => ({ ...current, timeZone }))} className="col-span-2" />
          <label className="text-[10px] text-slate-400">时长
            <select value={form.durationHours} onChange={(event) => setForm((current) => ({ ...current, durationHours: Number(event.target.value) as 24 | 48 | 72 }))} className={inputClass()}>
              <option value={24}>24 h</option><option value={48}>48 h</option><option value={72}>72 h</option>
            </select>
          </label>
          <label className="col-span-3 text-[10px] text-slate-400">起始时间
            <input type="datetime-local" value={startLocal} onChange={(event) => setStartLocal(event.target.value)} className={inputClass()} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchLocations(); }} placeholder="城市 / 地名" className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/35 px-2 py-1.5 text-xs" />
          <ActionButton onClick={() => void searchLocations()} disabled={locationStatus.status === "loading"}>搜索</ActionButton>
          <ActionButton onClick={requestBrowserLocation}>定位</ActionButton>
        </div>
        {locations.length ? <div className="mt-2 grid gap-1">{locations.slice(0, 5).map((location) => <button key={location.id || `${location.latitudeDeg}:${location.longitudeDeg}`} type="button" onClick={() => {
          setForm((current) => ({ ...current, observerName: location.name, latitudeDeg: location.latitudeDeg, longitudeDeg: location.longitudeDeg, elevationM: location.elevationM, timeZone: location.timeZone || current.timeZone }));
          setLocations([]);
        }} className="rounded-md border border-white/8 px-2 py-1.5 text-left text-[10px] text-slate-300 hover:border-cyan-200/20"><span className="text-slate-100">{location.name}</span> · {location.admin1} {location.country} · {location.latitudeDeg.toFixed(3)}, {location.longitudeDeg.toFixed(3)}</button>)}</div> : null}
        {locationStatus.error ? <StatusError>{locationStatus.error}</StatusError> : null}
        <ProfileStrip title={`已保存观测点 ${profiles.observers.length}/10`} entries={profiles.observers.map((entry) => ({ id: entry.id, label: entry.profile.name, apply: () => setForm((current) => ({ ...current, observerName: entry.profile.name, latitudeDeg: entry.profile.latitudeDeg, longitudeDeg: entry.profile.longitudeDeg, elevationM: entry.profile.elevationM, timeZone: entry.profile.timeZone, horizonMask: entry.profile.horizonMask })), remove: () => removeProfile("observer", entry.id) }))} onSave={saveObserver} />
      </PanelSection>

      <PanelSection title="目标与计算">
        <div className="flex gap-2 text-[10px]">
          <ToggleButton active={targetMode === "selected"} onClick={() => setTargetMode("selected")} disabled={!selectedTarget.target}>使用当前选中目标</ToggleButton>
          <ToggleButton active={targetMode === "manual"} onClick={() => setTargetMode("manual")}>手动 RA / Dec</ToggleButton>
        </div>
        {targetMode === "selected" ? <p className="mt-2 rounded-lg border border-white/8 p-2 text-[10px] text-slate-300">{activeTarget ? `${activeTarget.name} · RA ${activeTarget.raDeg.toFixed(5)}° · Dec ${activeTarget.decDeg.toFixed(5)}°` : selectedTarget.reason}</p> : <div className="mt-2 grid grid-cols-2 gap-2"><NumberField label="赤经 °" value={form.raDeg} onChange={(value) => updateNumber("raDeg", value)} /><NumberField label="赤纬 °" value={form.decDeg} onChange={(value) => updateNumber("decDeg", value)} /></div>}
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-slate-300"><input type="checkbox" checked={form.refraction} onChange={(event) => setForm((current) => ({ ...current, refraction: event.target.checked }))} />大气折射</label>
          <button type="button" disabled={!activeTarget || workerState.status === "calculating"} onClick={runPlan} className="ml-auto rounded-md border border-cyan-200/25 bg-cyan-200/[0.07] px-3 py-1.5 text-[10px] text-cyan-100 disabled:opacity-40">{workerState.status === "calculating" ? "Worker 计算中…" : "更新观测计划"}</button>
        </div>
        {workerState.error ? <StatusError>{workerState.error}</StatusError> : null}
        {workerState.result ? <p className="mt-2 text-[9px] text-slate-600">Observation Worker {workerState.durationMs?.toFixed(1)} ms · {workerState.result.samples.length} samples · physics mutation not-applied</p> : null}
      </PanelSection>

      <PanelSection title="地平遮挡与视场">
        <div className="flex flex-wrap gap-2 text-[10px]">
          <ActionButton onClick={() => horizonInputRef.current?.click()}>导入 horizon CSV</ActionButton>
          <ActionButton onClick={() => { setForm((current) => ({ ...current, horizonMask: undefined })); setHorizonError(""); }} disabled={!form.horizonMask}>清除地平线</ActionButton>
          <input ref={horizonInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            try {
              const csv = await file.text();
              const horizonMask = parseHorizonMaskCsvV1(csv);
              setForm((current) => ({ ...current, horizonMask }));
              setHorizonError("");
            } catch (error) {
              setHorizonError(errorMessage(error, "Horizon CSV 读取失败"));
            }
          }} />
        </div>
        {form.horizonMask ? <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400"><span>{form.horizonMask.length} 个方位点</span><input type="range" min={0} max={359} value={previewAzimuth} onChange={(event) => setPreviewAzimuth(Number(event.target.value))} className="min-w-0 flex-1" /><span>{previewAzimuth}° → {horizonAtPreview.toFixed(1)}°</span></div> : <p className="mt-2 text-[10px] text-slate-600">当前使用平坦地平线 0°。</p>}
        {horizonError ? <StatusError>{horizonError}</StatusError> : null}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <TextField label="FOV 名称" value={fovProfile.name} onChange={(name) => setFovProfile((current) => ({ ...current, name }))} className="col-span-3" />
          <FovNumber label="焦距 mm" value={fovProfile.focalLengthMm} onChange={(focalLengthMm) => { if (focalLengthMm !== undefined) setFovProfile((current) => ({ ...current, focalLengthMm })); }} />
          <FovNumber label="传感器宽 mm" value={fovProfile.sensorWidthMm} onChange={(sensorWidthMm) => setFovProfile((current) => ({ ...current, sensorWidthMm }))} />
          <FovNumber label="传感器高 mm" value={fovProfile.sensorHeightMm} onChange={(sensorHeightMm) => setFovProfile((current) => ({ ...current, sensorHeightMm }))} />
          <FovNumber label="像元 μm" value={fovProfile.pixelSizeMicron} onChange={(pixelSizeMicron) => setFovProfile((current) => ({ ...current, pixelSizeMicron }))} />
          <FovNumber label="目镜 mm" value={fovProfile.eyepieceFocalLengthMm} onChange={(eyepieceFocalLengthMm) => setFovProfile((current) => ({ ...current, eyepieceFocalLengthMm }))} />
          <FovNumber label="目镜视场 °" value={fovProfile.eyepieceApparentFovDeg} onChange={(eyepieceApparentFovDeg) => setFovProfile((current) => ({ ...current, eyepieceApparentFovDeg }))} />
          <FovNumber label="旋转 °" value={fovProfile.rotationDeg} onChange={(rotationDeg) => { if (rotationDeg !== undefined) setFovProfile((current) => ({ ...current, rotationDeg })); }} />
        </div>
        <p className="mt-2 text-[10px] text-cyan-100">Canvas FOV {viewModel.fov.widthDeg.toFixed(3)}° × {viewModel.fov.heightDeg.toFixed(3)}° · {viewModel.fov.arcsecPerPixel?.toFixed(2) ?? "—"} arcsec/pixel</p>
        <ProfileStrip title={`已保存 FOV ${profiles.fovs.length}/10`} entries={profiles.fovs.map((entry) => ({ id: entry.id, label: entry.profile.name, apply: () => setFovProfile(entry.profile), remove: () => removeProfile("fov", entry.id) }))} onSave={saveFov} />
        {profileError ? <StatusError>{profileError}</StatusError> : null}
      </PanelSection>

      {workerState.result ? <>
        <PanelSection title="事件与观测窗口">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {workerState.result.events.map((event) => <div key={`${event.type}:${event.at}`} className="rounded-lg border border-white/8 p-2"><span className="text-slate-500">{eventLabel(event.type)}</span><br /><span className="text-slate-200">{new Date(event.at).toLocaleString("zh-CN", { timeZone: observer.timeZone })}</span></div>)}
          </div>
          <div className="mt-3 space-y-2">{rankedWindows.length ? rankedWindows.map((window, index) => <div key={`${window.start}:${index}`} className={`rounded-lg border p-2 text-[10px] ${index === 0 ? "border-cyan-200/20 bg-cyan-200/[0.035]" : "border-white/8"}`}><div className="flex justify-between"><span>{index === 0 ? "推荐窗口" : `窗口 ${index + 1}`}</span><span className="text-cyan-100">{Math.round(window.durationMinutes)} min</span></div><p className="mt-1 text-slate-400">{new Date(window.start).toLocaleString("zh-CN", { timeZone: observer.timeZone })} → {new Date(window.end).toLocaleTimeString("zh-CN", { timeZone: observer.timeZone })}</p><p className="text-slate-600">峰值 {window.peakAltitudeDeg.toFixed(1)}° · min airmass {window.minimumAirmass?.toFixed(2) ?? "—"}</p></div>) : <p className="text-[10px] text-slate-500">当前范围内没有同时满足暗夜、地平线和 airmass 的窗口。</p>}</div>
        </PanelSection>
        <PanelSection title="24/48/72 小时曲线">
          <Suspense fallback={<div className="h-44 animate-pulse rounded-xl bg-white/[0.03]" aria-label="正在加载观测图表" />}>
            <ObservationPlannerChartsV266 series={viewModel.chartSeries} />
          </Suspense>
        </PanelSection>
      </> : null}

      <PanelSection title="可选天气与导出">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-200">Open-Meteo 临时天气</p><p className="text-[10px] text-slate-500">主动请求 · 0.01° · 服务端缓存 30 分钟</p></div><ActionButton onClick={() => void requestWeather()} disabled={weatherStatus.status === "loading"}>{weatherStatus.status === "loading" ? "获取中…" : "获取天气"}</ActionButton></div>
        {weather ? <p className="mt-2 text-[10px] text-emerald-300">{weather.samples.length} hourly samples · fetched {weather.fetchedAt} · canonical:false</p> : null}
        {weatherStatus.error ? <StatusError>{weatherStatus.error}</StatusError> : null}
        <div className="mt-3 flex gap-2"><ActionButton onClick={() => exportPlan("json")} disabled={!workerState.result}>JSON</ActionButton><ActionButton onClick={() => exportPlan("csv")} disabled={!workerState.result}>CSV</ActionButton><ActionButton onClick={() => exportPlan("ics")} disabled={!workerState.result}>ICS</ActionButton></div>
      </PanelSection>
    </section>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-3 rounded-xl border border-white/8 bg-white/[0.018] p-3"><h3 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">{title}</h3>{children}</section>;
}

function inputClass() {
  return "mt-1 w-full rounded-md border border-white/10 bg-black/35 px-2 py-2 text-xs text-slate-100";
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="text-[10px] text-slate-400">{label}<input type="number" value={Number.isFinite(value) ? value : ""} onChange={(event) => onChange(event.target.value)} className={inputClass()} /></label>;
}

function FovNumber({ label, value, onChange }: { label: string; value?: number; onChange: (value: number | undefined) => void }) {
  return <label className="text-[10px] text-slate-400">{label}<input type="number" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} className={inputClass()} /></label>;
}

function TextField({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return <label className={`text-[10px] text-slate-400 ${className}`}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()} /></label>;
}

function ActionButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-slate-300 hover:border-cyan-300/30 disabled:opacity-40">{children}</button>;
}

function ToggleButton({ children, active, onClick, disabled = false }: { children: React.ReactNode; active: boolean; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} aria-pressed={active} onClick={onClick} className={`rounded-full border px-2.5 py-1.5 ${active ? "border-cyan-200/30 bg-cyan-200/[0.08] text-cyan-100" : "border-white/10 text-slate-500"} disabled:opacity-30`}>{children}</button>;
}

function ProfileStrip({ title, entries, onSave }: { title: string; entries: readonly { id: string; label: string; apply: () => void; remove: () => void }[]; onSave: () => void }) {
  return <div className="mt-3 border-t border-white/6 pt-2"><div className="flex items-center justify-between"><span className="text-[9px] text-slate-600">{title}</span><ActionButton onClick={onSave}>保存当前</ActionButton></div>{entries.length ? <div className="mt-2 flex gap-1 overflow-x-auto">{entries.map((entry) => <div key={entry.id} className="flex shrink-0 rounded-md border border-white/8"><button type="button" onClick={entry.apply} className="px-2 py-1 text-[9px] text-slate-300">{entry.label}</button><button type="button" onClick={entry.remove} aria-label={`删除 ${entry.label}`} className="border-l border-white/8 px-1.5 text-[9px] text-slate-600 hover:text-rose-300">×</button></div>)}</div> : null}</div>;
}

function StatusError({ children }: { children: React.ReactNode }) {
  return <p role="status" className="mt-2 text-[10px] text-amber-300">{children}</p>;
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toDatetimeLocal(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function profileId(name: string): string {
  const clean = name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `${clean || "profile"}-${Date.now().toString(36)}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function eventLabel(type: string): string {
  return ({
    rise: "升起", transit: "过中天", set: "落下", "civil-dusk": "民用暮光结束",
    "nautical-dusk": "航海暮光结束", "astronomical-dusk": "天文暮光结束",
    "astronomical-dawn": "天文晨光开始", "nautical-dawn": "航海晨光开始", "civil-dawn": "民用晨光开始",
  } as Record<string, string>)[type] ?? type;
}
