"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import BottomControlBar from "./components/BottomControlBar";
import type { BottomControlBarSection } from "./components/BottomControlBar";
import SimClockReadout from "./components/SimClockReadout";

const UniverseCanvas = dynamic(() => import("./components/UniverseCanvas"), {
  ssr: false,
  loading: () => null,
});

const BodyDetailSidebar = dynamic(
  () => import("./components/BodyDetailSidebar"),
  { ssr: false, loading: () => null },
);

const ScienceTelemetryPanel = dynamic(
  () => import("./components/ScienceTelemetryPanel"),
  { ssr: false, loading: () => null },
);

const KerrBlackHolePanel = dynamic(
  () => import("./components/KerrBlackHolePanel"),
  { ssr: false, loading: () => null },
);
import {
  DEFAULT_SIM_DAYS_PER_WORLD_SECOND,
  EARTH_BODY_INDEX,
} from "./data/planetsJ2000";
import {
  CAMERA_FOCUS_ORIGIN_EVENT,
  dispatchCameraFocusBody,
  dispatchCameraFocusDirection,
  dispatchCameraFocusEarthMoon,
  dispatchCameraFocusOrigin,
  dispatchCameraZoom,
} from "./lib/camera-bridge";
import type { BodyLiveMetrics } from "./lib/bodyLiveMetrics";
import type { SimulationDiagnostics } from "./lib/simulationDiagnosticsTypes";
import type { TelemetrySeriesState } from "./lib/telemetryTypes";
import { useSolarSystemPhysics } from "./lib/useSolarSystem";
import type { PhysicsPrecisionTier } from "./lib/physicsPrecision";
import PhysicsPerformanceHud from "./components/PhysicsPerformanceHud";
import type { KerrBlackHoleUiState } from "./components/KerrBlackHolePanel";
import type { CameraBodyFocusRequest } from "./components/UniverseScene";
import UniverseSandboxHud from "./components/UniverseSandboxHud";
import {
  DEFAULT_SIMULATION_VIEW_SETTINGS,
  type SimulationViewSettings,
} from "./lib/simulationViewSettings";
import { applyHistoryEntryToPhysics } from "./lib/applyPhysicsSnapshot";
import { PhysicsHistoryStack } from "./lib/physicsHistoryStack";
import {
  captureHistoryEntry,
  filePayloadToHistoryEntry,
  parseSnapshotFile,
  snapshotToFilePayload,
} from "./lib/physicsSnapshot";
import { PHYSICS_ACTIVE_BODY_COUNT } from "./lib/physicsSharedBuffer";
import SimulationHistoryBar from "./components/SimulationHistoryBar";
import LaunchControlPanel from "./components/LaunchControlPanel";
import LaunchTelemetryStrip from "./components/LaunchTelemetryStrip";
import MissionDesignerPanel from "./components/MissionDesignerPanel";
import useLaunchWebSocket from "./lib/useLaunchWebSocket";
import type { LaunchConfig } from "./lib/launchTelemetryTypes";
import type { MissionOptimizationResult, MissionPlan } from "./lib/missionDesignerTypes";
import {
  startLaunchSequence,
  stopLaunchSequence,
  isLaunchActivePhase,
} from "./lib/spacecraftAutopilot";
import { SPACECRAFT_BODY_INDEX } from "./data/planetsJ2000";
import type { LocalTelemetry } from "./lib/localLaunchPhysics";
import { createFloatingOrigin, type FloatingOriginState } from "./lib/floatingOrigin";

const TIME_TRAVEL_LIVE_U = 0.9995;

export default function UniversePage() {
  const { physicsRef, physicsReady, physicsUsesSharedBuffer } =
    useSolarSystemPhysics();
  const precisionTierRef = useRef<PhysicsPrecisionTier>("full");
  const floatingOriginRef = useRef<FloatingOriginState>(createFloatingOrigin());
  const simDaysRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [daysPerSecond, setDaysPerSecond] = useState(
    DEFAULT_SIM_DAYS_PER_WORLD_SECOND
  );
  const [activeSection, setActiveSection] =
    useState<BottomControlBarSection>("simulation");
  const [relativityEnabled, setRelativityEnabled] = useState(true);
  const relativityEnabledRef = useRef(true);
  relativityEnabledRef.current = relativityEnabled;
  /** UI selection and camera lock target (body index; `null` = free view / origin). */
  const [selectedBodyIndex, setSelectedBodyIndex] = useState<number | null>(
    null
  );
  const [cameraBodyFocusRequest, setCameraBodyFocusRequest] =
    useState<CameraBodyFocusRequest | null>(null);
  const [earthMoonView, setEarthMoonView] = useState(false);
  const bodyMetricsRef = useRef<BodyLiveMetrics | null>(null);
  const simulationDiagnosticsRef = useRef<SimulationDiagnostics | null>(null);
  const telemetrySeriesRef = useRef<TelemetrySeriesState | null>(null);
  const [kerrBlackHole, setKerrBlackHole] = useState<KerrBlackHoleUiState>({
    massSolar: 12,
    aOverM: 0.88,
    frameDragTeachingScale: 1.2e12,
  });
  const [visualEnhance, setVisualEnhance] = useState(false);
  const [viewSettings, setViewSettings] = useState<SimulationViewSettings>(
    DEFAULT_SIMULATION_VIEW_SETTINGS
  );
  const applyPerformanceSafeMode = useCallback(() => {
    setVisualEnhance(false);
    setViewSettings({
      ...DEFAULT_SIMULATION_VIEW_SETTINGS,
      renderBudget: "balanced",
      showGaiaStars: false,
      showDeepSkyMarkers: false,
      highQualityRendering: false,
      showRelativisticOptics: false,
    });
  }, []);
  const lagrangeSpawnNonceRef = useRef(0);
  const physicsHistoryRef = useRef(new PhysicsHistoryStack());
  const integrationSuspendedRef = useRef(false);
  const timeTravelScrubURef = useRef(1);
  const timeTravelScrubbingRef = useRef(false);
  const importStateInputRef = useRef<HTMLInputElement>(null);
  const [timeTravelScrubUi, setTimeTravelScrubUi] = useState(1000);
  const [historySnapshotCount, setHistorySnapshotCount] = useState(0);
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [missionResult, setMissionResult] = useState<MissionOptimizationResult | null>(null);
  const [missionPreviewPlan, setMissionPreviewPlan] = useState<MissionPlan | null>(null);

  // ── Launch mode state ──
  const [launchMode, setLaunchMode] = useState(false);
  const [localLaunchActive, setLocalLaunchActive] = useState(false);
  const [launchTelemetryTick, setLaunchTelemetryTick] = useState(0);
  const localLaunchActiveRef = useRef(false);
  const localTelemetryRef = useRef<LocalTelemetry | null>(null);
  const launchConfigRef = useRef<LaunchConfig | null>(null);
  const {
    launchState,
    startLaunch: wsStartLaunch,
    pauseLaunch: wsPauseLaunch,
    resumeLaunch: wsResumeLaunch,
    setTimeScale: wsSetTimeScale,
  } = useLaunchWebSocket(undefined, false);

  const handleLaunchStart = useCallback(
    (config: LaunchConfig) => {
      setLaunchMode(true);
      launchConfigRef.current = config;
      // All profiles use local physics for reliability
      localLaunchActiveRef.current = true;
      setLocalLaunchActive(true);
    },
    []
  );

  const handleLaunchAbort = useCallback(() => {
    setLaunchMode(false);
    setActiveSection("simulation");
    setSelectedBodyIndex(null);
    setCameraBodyFocusRequest(null);
    localLaunchActiveRef.current = false;
    setLocalLaunchActive(false);
    localTelemetryRef.current = null;
    launchConfigRef.current = null;
    dispatchCameraFocusOrigin();
    if (isLaunchActivePhase()) {
      stopLaunchSequence(physicsRef.current);
    }
  }, [physicsRef]);

  useEffect(() => {
    if (!launchMode && !localLaunchActive) return;
    const id = window.setInterval(() => {
      setLaunchTelemetryTick((tick) => (tick + 1) % 100_000);
    }, 250);
    return () => window.clearInterval(id);
  }, [launchMode, localLaunchActive]);

  /** Called by LaunchSceneView when the spacecraft reaches sufficient altitude for handoff. */
  const handleLocalLaunchHandoff = useCallback(
    (heliocentric: {
      posM: [number, number, number];
      velMs: [number, number, number];
      massKg: number;
    }) => {
      const p = physicsRef.current;
      if (!p || SPACECRAFT_BODY_INDEX < 0) return;
      const n = "n" in p ? (p as { n: number }).n : 0;
      if (SPACECRAFT_BODY_INDEX >= n) return;

      // Write heliocentric position & velocity to global physics arrays
      const k = 3 * SPACECRAFT_BODY_INDEX;
      p.posM[k] = heliocentric.posM[0];
      p.posM[k + 1] = heliocentric.posM[1];
      p.posM[k + 2] = heliocentric.posM[2];
      p.velM[k] = heliocentric.velMs[0];
      p.velM[k + 1] = heliocentric.velMs[1];
      p.velM[k + 2] = heliocentric.velMs[2];
      p.mass[SPACECRAFT_BODY_INDEX] = heliocentric.massKg;

      // Sync AU positions for rendering
      if ("syncPosAu" in p && typeof p.syncPosAu === "function") {
        p.syncPosAu();
      }

      // Deactivate local launch, resume global simulation
      localLaunchActiveRef.current = false;
      setLocalLaunchActive(false);
      setLaunchMode(false);
      setActiveSection("simulation");
      localTelemetryRef.current = null;
      launchConfigRef.current = null;

      // Camera: fly-to spacecraft body (existing system)
      setSelectedBodyIndex(SPACECRAFT_BODY_INDEX);
      setCameraBodyFocusRequest((prev) => ({
        bodyIndex: SPACECRAFT_BODY_INDEX,
        mode: "lock",
        nonce: (prev?.nonce ?? 0) + 1,
      }));
      dispatchCameraFocusBody(SPACECRAFT_BODY_INDEX, { mode: "lock" });
    },
    [physicsRef]
  );

  useEffect(() => {
    const clear = () => setEarthMoonView(false);
    window.addEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clear);
    return () => window.removeEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clear);
  }, []);

  const syncTimeTravelSuspension = useCallback(() => {
    integrationSuspendedRef.current =
      timeTravelScrubURef.current < TIME_TRAVEL_LIVE_U ||
      timeTravelScrubbingRef.current;
  }, []);

  const bumpHistorySnapshotCount = useCallback(() => {
    setHistorySnapshotCount(physicsHistoryRef.current.length);
  }, []);

  useEffect(() => {
    bumpHistorySnapshotCount();
  }, [bumpHistorySnapshotCount]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(bumpHistorySnapshotCount, 1200);
    return () => window.clearInterval(id);
  }, [isPlaying, bumpHistorySnapshotCount]);

  const handleExportSystemState = useCallback(() => {
    const p = physicsRef.current;
    if (!p) return;
    const e = captureHistoryEntry(p, simDaysRef.current);
    const payload = snapshotToFilePayload(e, simDaysRef.current);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solar-system-state-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [physicsRef]);

  const handleImportStateFile = useCallback(
    async (ev: ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0];
      ev.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = parseSnapshotFile(JSON.parse(text) as unknown);
        if (
          !parsed ||
          parsed.massKg.length !== PHYSICS_ACTIVE_BODY_COUNT
        ) {
          window.alert("文件无效：schema 或天体数量与当前模拟不一致。");
          return;
        }
        const p = physicsRef.current;
        if (!p) return;
        const entry = filePayloadToHistoryEntry(parsed);
        applyHistoryEntryToPhysics(p, entry);
        simDaysRef.current = parsed.simDays;
        physicsHistoryRef.current.clear();
        timeTravelScrubURef.current = 1;
        timeTravelScrubbingRef.current = false;
        setTimeTravelScrubUi(1000);
        syncTimeTravelSuspension();
        bumpHistorySnapshotCount();
      } catch {
        window.alert("无法解析 JSON 文件。");
      }
    },
    [physicsRef, syncTimeTravelSuspension, bumpHistorySnapshotCount],
  );

  const handleZoomIn = useCallback(() => dispatchCameraZoom(1), []);
  const handleZoomOut = useCallback(() => dispatchCameraZoom(-1), []);
  const clearFocusLock = useCallback(() => {
    setEarthMoonView(false);
    setSelectedBodyIndex(null);
    setCameraBodyFocusRequest(null);
    dispatchCameraFocusOrigin();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          "input, textarea, select, [contenteditable=true], [data-no-escape-clear]"
        )
      ) {
        return;
      }
      clearFocusLock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFocusLock]);

  const handleFocus = useCallback(() => {
    setEarthMoonView(false);
    if (selectedBodyIndex !== null) {
      setCameraBodyFocusRequest((prev) => ({
        bodyIndex: selectedBodyIndex,
        mode: "lock",
        nonce: (prev?.nonce ?? 0) + 1,
      }));
      dispatchCameraFocusBody(selectedBodyIndex, { mode: "lock" });
    } else dispatchCameraFocusOrigin();
  }, [selectedBodyIndex]);

  const handleEarthMoon = useCallback(() => {
    setEarthMoonView(true);
    if (EARTH_BODY_INDEX >= 0) {
      setSelectedBodyIndex(EARTH_BODY_INDEX);
    }
    dispatchCameraFocusEarthMoon();
  }, []);

  const simSlower = useCallback(() => {
    setDaysPerSecond((d) =>
      Math.max(0.05, Math.round((d / 1.25) * 1000) / 1000)
    );
  }, []);
  const simFaster = useCallback(() => {
    setDaysPerSecond((d) =>
      Math.min(200, Math.round(d * 1.25 * 1000) / 1000)
    );
  }, []);
  const simRewind = useCallback(() => {
    setDaysPerSecond((d) =>
      Math.max(0.05, Math.round((d / 1.65) * 1000) / 1000)
    );
  }, []);
  const simFastForward = useCallback(() => {
    setDaysPerSecond((d) =>
      Math.min(200, Math.round(d * 1.65 * 1000) / 1000)
    );
  }, []);
  const handleSearch = useCallback(() => {
    setSearchFocusNonce((n) => n + 1);
  }, []);

  const onBodyFocusFromList = useCallback((bodyIndex: number) => {
    setEarthMoonView(false);
    setSelectedBodyIndex(bodyIndex);
    setCameraBodyFocusRequest((prev) => ({
      bodyIndex,
      mode: "inspect",
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    dispatchCameraFocusBody(bodyIndex, { mode: "inspect" });
  }, []);

  const toggleRelativity = useCallback(() => {
    setRelativityEnabled((v) => !v);
  }, []);

  /** 单击画布天体：选中并显示右侧详情，不锁定相机。 */
  const onBodyCanvasPick = useCallback((bodyIndex: number) => {
    setEarthMoonView(false);
    setSelectedBodyIndex(bodyIndex);
    setCameraBodyFocusRequest((prev) => ({
      bodyIndex,
      mode: "inspect",
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    dispatchCameraFocusBody(bodyIndex, { mode: "inspect" });
  }, []);

  /** 双击天体：锁定该天体为参考系，并打开详情侧栏。 */
  const onSelectBody = useCallback((bodyIndex: number) => {
    setEarthMoonView(false);
    setSelectedBodyIndex(bodyIndex);
    setCameraBodyFocusRequest((prev) => ({
      bodyIndex,
      mode: "lock",
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    dispatchCameraFocusBody(bodyIndex, { mode: "lock" });
  }, []);

  /** 单击邻近恒星：将相机朝向该恒星方向旋转。 */
  const onNearbyStarFocus = useCallback((direction: [number, number, number]) => {
    setEarthMoonView(false);
    setSelectedBodyIndex(null);
    dispatchCameraFocusDirection(direction);
  }, []);

  if (!physicsReady) {
    return (
      <div
        className="flex h-[100dvh] w-screen flex-col items-center justify-center gap-2 bg-[#030303] text-slate-300"
        style={{ backgroundColor: "#030303" }}
      >
        <div className="text-sm">初始化物理引擎（Worker / 主线程）…</div>
        <div className="max-w-sm px-4 text-center text-xs text-slate-500">
          若需 SharedArrayBuffer 零拷贝，请确保页面为 cross-origin isolated（见 README）。
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#030303]">
      {/* touch-none：减少移动端拖场景时误触滚动；底部栏单独可点 */}
      <div className="absolute inset-0 touch-none">
        <UniverseCanvas
          simulation={{
            simDaysRef,
            isPlaying,
            daysPerSecond,
            physicsRef,
            relativityEnabledRef,
            precisionTierRef,
            floatingOriginRef,
            onSelectBody,
            onBodyCanvasPick,
            selectedBodyIndex,
            cameraBodyFocusRequest,
            bodyMetricsRef,
            simulationDiagnosticsRef,
            earthMoonView,
            telemetrySeriesRef,
            kerrBlackHole,
            visualEnhance,
            viewSettings,
            lagrangeSpawnNonceRef,
            integrationSuspendedRef,
            timeTravelScrubURef,
            timeTravelScrubbingRef,
            physicsHistoryRef,
            missionPreviewPlan,
            onCanvasPointerMissed: clearFocusLock,
            launchMode,
            localLaunchActive,
            localLaunchActiveRef,
            onLocalLaunchHandoff: handleLocalLaunchHandoff,
            onLocalLaunchAbort: handleLaunchAbort,
            localTelemetryRef,
            launchConfigRef,
          }}
        />
      </div>
      <UniverseSandboxHud
        activeSection={activeSection}
        searchFocusNonce={searchFocusNonce}
        selectedBodyIndex={selectedBodyIndex}
        onBodyFocus={onBodyFocusFromList}
        onBodyInspect={onSelectBody}
        onNearbyStarFocus={onNearbyStarFocus}
        onConstellationFocus={onNearbyStarFocus}
        viewSettings={viewSettings}
        onViewSettingsChange={setViewSettings}
        onPerformanceSafe={applyPerformanceSafeMode}
        visualEnhance={visualEnhance}
        onVisualEnhanceChange={setVisualEnhance}
        leftPanelCollapsed={leftPanelCollapsed}
        onLeftPanelCollapsedChange={setLeftPanelCollapsed}
        lagrangeSpawnNonceRef={lagrangeSpawnNonceRef}
        onExportSystemState={handleExportSystemState}
        onImportSystemState={() => importStateInputRef.current?.click()}
      />
      <PhysicsPerformanceHud
        physicsRef={physicsRef}
        precisionTierRef={precisionTierRef}
        physicsUsesSharedBuffer={physicsUsesSharedBuffer}
        viewSettings={viewSettings}
        missionPlan={missionPreviewPlan}
      />
      {viewSettings.showKerrBlackHole ? (
        <KerrBlackHolePanel value={kerrBlackHole} onChange={setKerrBlackHole} />
      ) : null}
      <ScienceTelemetryPanel
        telemetrySeriesRef={telemetrySeriesRef}
        selectedBodyIndex={selectedBodyIndex}
        relativityEnabled={relativityEnabled}
        mainSidebarOffsetPx={leftPanelCollapsed ? 0 : 288}
      />
      <AnimatePresence mode="wait">
        {selectedBodyIndex !== null ? (
          <BodyDetailSidebar
            key={selectedBodyIndex}
            physicsRef={physicsRef}
            bodyMetricsRef={bodyMetricsRef}
            simulationDiagnosticsRef={simulationDiagnosticsRef}
            telemetrySeriesRef={telemetrySeriesRef}
            relativityEnabled={relativityEnabled}
            simDaysRef={simDaysRef}
            daysPerSecond={daysPerSecond}
            selectedBodyIndex={selectedBodyIndex}
            onDismiss={clearFocusLock}
          />
        ) : null}
      </AnimatePresence>
      <input
        ref={importStateInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={handleImportStateFile}
      />
      <BottomControlBar
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((p) => !p)}
        simulationTimeSlot={<SimClockReadout simDaysRef={simDaysRef} />}
        daysPerSecond={daysPerSecond}
        activeSection={activeSection}
        onSectionChange={(s) => {
          setActiveSection(s);
          if (s === "launch") setLaunchMode(true);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFocusSelected={handleFocus}
        onResetView={clearFocusLock}
        onEarthMoonView={handleEarthMoon}
        onSimSlower={simSlower}
        onSimFaster={simFaster}
        onSimRewind={simRewind}
        onSimFastForward={simFastForward}
        onSearch={handleSearch}
        relativityEnabled={relativityEnabled}
        onRelativityToggle={toggleRelativity}
        historySlot={
          <SimulationHistoryBar
            simDaysRef={simDaysRef}
            scrubURef={timeTravelScrubURef}
            scrubbingRef={timeTravelScrubbingRef}
            physicsHistoryRef={physicsHistoryRef}
            scrubUi={timeTravelScrubUi}
            setScrubUi={setTimeTravelScrubUi}
            snapshotCount={historySnapshotCount}
            onSyncSuspension={syncTimeTravelSuspension}
            onScrubEnd={bumpHistorySnapshotCount}
          />
        }
        launchMode={launchMode}
        launchTelemetrySlot={
          launchMode ? (
            <LaunchTelemetryStrip
              key={launchTelemetryTick}
              state={launchState}
              localTelemetry={localTelemetryRef.current}
            />
          ) : null
        }
      />
      {activeSection === "launch" ? (
        <div className="pointer-events-auto absolute bottom-28 right-4 z-[130] origin-bottom-right scale-[0.88]">
          <LaunchControlPanel
            onLaunch={handleLaunchStart}
            onAbort={handleLaunchAbort}
            isStreaming={localLaunchActive}
          />
        </div>
      ) : null}
      {activeSection === "mission" ? (
        <MissionDesignerPanel
          physicsRef={physicsRef}
          simDaysRef={simDaysRef}
          relativityEnabled={relativityEnabled}
          result={missionResult}
          selectedPlanId={missionPreviewPlan?.id ?? null}
          onResult={setMissionResult}
          onSelectPlan={setMissionPreviewPlan}
        />
      ) : null}
    </div>
  );
}
